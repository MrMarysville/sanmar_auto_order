
**File: 11_queries.md**
```markdown
# Queries

Queries are used to retrieve data from the server.

Example: Fetch a customer
```graphql
query {
  contact(id: 12345) {
    id
    fullName
    email
  }
}

Example: Fetch Orders
query {
  orders(
    inProductionAfter: "2023-04-01T00:00:00Z"
    inProductionBefore: "2023-05-01T00:00:00Z"
    statusIds: ["4", "5"]
    first: 10
    sortOn: VISUAL_ID
  ) {
    nodes {
      ... on Quote {
        id
        visualId
        contact {
          id
          email
        }
      }
      ... on Invoice {
        id
        visualId
        owner {
          id
          email
        }
      }
    }
  }
}

Queries include, but aren't limited to:

account

contact

contacts

customer

customers

inquiries

inquiry

invoice

invoices

lineItem

lineItemGroup

lineItemGroupPricing

merchOrder

merchStore

merchStores

order

orders

paymentRequests

products

quotes

quote

statuses

status

tasks

task

threads

thread

transaction

transactions

transactionDetail

user