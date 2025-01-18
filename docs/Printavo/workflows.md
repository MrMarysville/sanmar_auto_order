# Workflows

This section describes common workflows for creating quotes and invoices, and working with products and line items.

## Creating a Quote

To create a quote, you'll typically use the `quoteCreate` mutation. This mutation requires an `input` object with various fields, including:

-   `contact`: The customer contact associated with the quote.
-   `customerDueAt`: The date the quote is due to the customer.
-   `lineItemGroups`: An array of line item groups, each containing line items.
-   `shippingAddress`: The shipping address for the quote.

Example mutation to create a quote:

```graphql
mutation {
  quoteCreate(
    input: {
      contact: { id: "123" }
      customerDueAt: "2024-01-20"
      lineItemGroups: [
        {
          lineItems: [
            {
              product: { id: "456" }
              items: 10
              price: 25.00
            }
          ]
        }
      ]
      shippingAddress: {
        address1: "123 Main St"
        city: "Anytown"
        stateIso: "CA"
        zipCode: "12345"
      }
    }
  ) {
    id
    visualId
  }
}
```

## Creating an Invoice

To create an invoice, you'll typically use the `invoiceCreate` mutation. This mutation requires an `input` object with various fields, including:

-   `contact`: The customer contact associated with the invoice.
-   `customerDueAt`: The date the invoice is due to the customer.
-   `lineItemGroups`: An array of line item groups, each containing line items.
-   `shippingAddress`: The shipping address for the invoice.

Example mutation to create an invoice:

```graphql
mutation {
  invoiceCreate(
    input: {
      contact: { id: "123" }
      customerDueAt: "2024-01-20"
      lineItemGroups: [
        {
          lineItems: [
            {
              product: { id: "456" }
              items: 10
              price: 25.00
            }
          ]
        }
      ]
      shippingAddress: {
        address1: "123 Main St"
        city: "Anytown"
        stateIso: "CA"
        zipCode: "12345"
      }
    }
  ) {
    id
    visualId
  }
}
```

## Working with Products

Products represent the items you sell. You can query for products using the `products` connection, and you can create or update products using mutations.

Example query to retrieve products:

```graphql
query {
  products(first: 10) {
    nodes {
      id
      itemNumber
      description
    }
  }
}
```

## Working with Line Items

Line items represent the individual items within a quote or invoice. You can create, update, or delete line items using mutations.

Example mutation to create a line item:

```graphql
mutation {
  lineItemCreate(
    lineItemGroupId: "789"
    input: {
      product: { id: "456" }
      items: 10
      price: 25.00
    }
  ) {
    id
    items
    price
  }
}
