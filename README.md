# 🛍️ Shopify Product Manager App (Remix)

A simple embedded Shopify app built with the [Shopify Remix App Template](https://github.com/Shopify/shopify-app-template-remix). This app allows merchants to:

- ✅ View products (5 per page) with pagination
- ➕ Create new products with Title, Status (Active, Draft, Archived), and SKU for the variant

---

## 🧱 Tech Stack

- **Framework:** [Remix](https://remix.run)
- **UI:** [Shopify Polaris](https://polaris.shopify.com)
- **API:** [Shopify Admin GraphQL](https://shopify.dev/docs/api/admin-graphql)
- **CLI:** [Shopify CLI](https://shopify.dev/docs/api/shopify-cli)

---

## 🚀 Getting Started

## 1. Setup Enviroment

- Make sure you have partners account Shopify to develop custom app
- Create a development store in partnerts account
- Make sure you install Shopify CLI lastest version

### 1. Install dependencies

```bash
## in case you do not install Shopify CLI yet

npm install -g @shopify/cli@latest
```

```bash
npm install
```

### 2. Run the app in local

```bash
npm run dev
```

This will generate link to install to dev store

---

## 🧪 Features

### 📋 Product List

- Displays product `title`, `status`, and `SKU`
- Fetches 5 products per page
- Uses Polaris DataTable with built-in **Next/Previous** controls

### 🆕 Create Product

- Enter:
  - Title (e.g., "Red Hoodie")
  - Status (Active, Draft, Archived)
  - SKU (e.g., `RED-HOODIE-001`)
- App will:
  1. Create the product via `productCreate`
  2. Update the first variant with the provided SKU

---

## 📁 File Structure

```
app/
├── app._index.tsx    # Main Logic for Product listing page
```

---

## 🙋 Addition Note

### Can I test this with my development store?

Yes! Just make sure:

- Your store is in development mode
- You've installed the app using the Shopify CLI

### Where do I see created products?

- Click **"View product"** or go to your Shopify admin → Products
- Click **View** Button in Actions column of data table to view product in Shopify Admin

---
