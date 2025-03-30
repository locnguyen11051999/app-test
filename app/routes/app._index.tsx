// Updated based on Shopify Remix App Template

import {
  Page,
  Card,
  DataTable,
  TextField,
  Select,
  Button,
  FormLayout,
  Layout,
  Banner,
  BlockStack,
} from "@shopify/polaris";
import { useLoaderData, Form, useActionData, useNavigate, useNavigation } from "@remix-run/react";
import { json } from "@remix-run/node";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { useEffect, useState } from "react";

type ProductEntry = {
  id: string;
  title: string;
  status: string;
  sku: string;
};

type LoaderData = {
  products: ProductEntry[];
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  nextCursor: string | null;
  prevCursor: string | null;
};

type ActionData = {
  error?: string;
  success?: string;
};

const itemsPerPage = 5;

export async function loader({ request, params }: LoaderFunctionArgs) {
  const { admin } = await authenticate.admin(request);
  const url = new URL(request.url);
  const query = url.searchParams;
  const after = query.get("after") ?? null;
  const before = query.get("before") ?? null;

  const cursor = before || after;

  const response = await admin.graphql(
    `#graphql
    query ListProducts($direction: String) {
      products(sortKey: CREATED_AT, reverse: true, ${before ? `last: ${itemsPerPage}, before: $direction` : `first: ${itemsPerPage}, after: $direction`}) {
        edges {
          cursor
          node {
            id
            title
            status
            variants(first: 1) {
              edges {
                node {
                  sku
                }
              }
            }
          }
        }
        pageInfo {
          hasNextPage
          hasPreviousPage
          startCursor
          endCursor
        }
      }
    }`,
    { variables: { direction: cursor } }
  );

  const jsonRes = await response.json();
  const products: ProductEntry[] = jsonRes.data.products.edges.map((edge: any) => {
    return {
      cursor: edge.cursor,
      id: edge.node.id,
      title: edge.node.title,
      status: edge.node.status,
      sku: edge.node.variants.edges[0]?.node?.sku ?? "",
    };
  });

  const pageInfo = jsonRes.data.products.pageInfo;

  return json<LoaderData>({
    products,
    hasNextPage: pageInfo.hasNextPage,
    hasPreviousPage: pageInfo.hasPreviousPage,
    nextCursor: pageInfo.endCursor,
    prevCursor: pageInfo.startCursor,
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const { admin } = await authenticate.admin(request);
  const formData = await request.formData();
  const title = formData.get("title")?.toString() ?? "";
  const status = formData.get("status")?.toString() ?? "DRAFT";
  const sku = formData.get("sku")?.toString() ?? "";

  try {
    const createRes = await admin.graphql(
      `#graphql
      mutation CreateProduct($input: ProductInput!) {
        productCreate(input: $input) {
          product {
            id
            variants(first: 1) {
              edges { node { id } }
            }
          }
          userErrors { field message }
        }
      }`,
      {
        variables: {
          input: { title, status },
        },
      }
    );

    const product = (await createRes.json()).data.productCreate.product;
    const variantId = product.variants.edges[0]?.node.id;

    console.log("Product created:", product);

    if (variantId) {
      await admin.graphql(
        `#graphql
        mutation productVariantsBulkUpdate($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
          productVariantsBulkUpdate(productId: $productId, variants: $variants) {
            product {
              id
            }
            productVariants {
              id
            }
            userErrors {
              field
              message
            }
          }
        }`,
        {
          variables: {
            productId: product.id,
            variants: [
              {
                id: variantId,
                inventoryItem: {
                  sku: sku
                }
              }
            ]
          },
        }
      );
    }
    return json<ActionData>({ success: "Product created successfully" });
  } catch (e: any) {
    return json<ActionData>({ error: e.message });
  }
}

export default function Index() {
  const { products, hasNextPage, hasPreviousPage, nextCursor, prevCursor } =
    useLoaderData<LoaderData>();

  useEffect(() => {
    if (!hasPreviousPage) {
      navigate({
        pathname: "/app",
        search: ``
      });
    }
  }, [hasPreviousPage])

  const [formState, setFormState] = useState({
    title: "",
    status: "DRAFT",
    sku: "",
  });

  const navigate = useNavigate();
  const actionData = useActionData<ActionData>();
  const navigation = useNavigation();

  const statusOptions = [
    { label: "Active", value: "ACTIVE" },
    { label: "Draft", value: "DRAFT" },
    { label: "Archived", value: "ARCHIVED" },
  ];

  return (
    <Page title="Manage Products">

      <Layout>
        <Layout.Section>
          <Card>
            <DataTable
              hoverable={true}
              columnContentTypes={["text", "text", "text", "text"]}
              headings={["Title", "Status", "SKU", "Actions"]}
              rows={products.map((p) => [p.title, p.status, p.sku, <Button url={`shopify:admin/products/${p.id.replace('gid://shopify/Product/', '')}`}>View</Button>])}
              pagination={{
                hasNext: hasNextPage,
                hasPrevious: hasPreviousPage,
                onNext: () => {
                  navigate({
                    pathname: "/app",
                    search: `?after=${nextCursor}`
                  });
                },
                onPrevious: () => {
                  navigate({
                    pathname: "/app",
                    search: `?before=${prevCursor}`
                  });
                },
              }}
            />
          </Card>
        </Layout.Section>
        <Layout.Section>
          <Card>
            {actionData?.error &&
              <Banner tone="critical" title="Error">
                <p>{actionData.error}</p>
              </Banner>
            }

            {actionData?.success &&
              <Banner title="Product Created" tone="success">
                <p>{actionData.success}</p>
              </Banner>
            }

            <Form method="post">
              <FormLayout>
                <TextField requiredIndicator label="Title" name="title" autoComplete="off" value={formState.title} onChange={value => setFormState({ ...formState, title: value })} />
                <Select label="Status" name="status" options={statusOptions} value={formState.status} onChange={value => setFormState({ ...formState, status: value })} />
                <TextField requiredIndicator label="SKU" name="sku" autoComplete="off" value={formState.sku} onChange={value => setFormState({ ...formState, sku: value })} />
                <BlockStack inlineAlign="end">
                  <Button loading={navigation.state == "submitting"} tone="critical" submit disabled={!formState.title || !formState.sku}>
                    Create Product
                  </Button>
                </BlockStack>
              </FormLayout>
            </Form>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
