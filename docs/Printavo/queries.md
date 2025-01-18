# Queries

Queries are used to retrieve data from the server. A basic GraphQL request will pass arguments to the query, and define a set of fields in the body of the query that should be returned. Unlike a RESTful API, the response from the server will include only those fields that the request explicitly asks for.

## Example Query: Customer

```graphql
query {
  contact(id: 12345) {
    id
    fullName
    email
  }
}
```

The `contact` query above is simple and performant, allowing an API user to specify exactly what they need and retrieve it, without waste.

## Example Query: Orders

GraphQL queries can be tailored to be more specific, allowing the trade-off of additional up-front writing complexity in exchange for greatly increased granularity. An excellent example of this in the Printavo environment is the Orders type. Many Printavo users will have a large collection of Quotes and Invoices in their system, across a broad timeline. Filtering across those and other fields allows us to make a more complex, but vastly more powerful query. Here is an example of one such query.

```graphql
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
```

### Unions and Fragments

Quotes and Invoices are both joined together into the OrderUnion type. This [union type](https://graphql.org/learn/schema/#union-types) allows API users to query for a combined set of both Quotes and Invoices. Each node in the response can behave differently based on whether its a Quote or an Invoice, which is where the [fragments](https://graphql.org/learn/queries/#fragments) come into play. The fields defined in the fragment blocks `... on Quote { ... }` and `... on Invoice { ... }` instruct the server about what fields to return for each respective node, depending on which type it actually belongs to, without the API user needing to specify for each one. If a returned node is a `Quote`, then the ID and email of the Quote's `contact` will be returned. Otherwise, if a returned node is an `Invoice`, then the ID and email of the Invoice's `owner` will be returned.

### Searching

The arguments included in this query are `inProductionAfter`, `inProductionBefore`, `statusIds`, and `sortOn`, though the query supports additional arguments as defined below. In the example above, our query explicitly asks for quotes and invoices that were produced between April 1st and May 1st of 2023. Further, our query is only interested in quotes and invoices that are in the **Completed - Ready for Package** and **Order Ready for Pickup** statuses, corresponding to `statusIDs` 4 and 5 respectively.

### Enums and Slicing

GraphQL supports [slicing](https://graphql.org/learn/pagination/#slicing), which allows an API user to define specifically which results of a sorted dataset the server's response should include. In the example above, the `sortOn` field acts as an [Enum](https://graphql.org/learn/schema/#enumeration-types), and informs the server that it should sort the quotes and invoices in the dataset by their `visualID`, and return only the first ten results.

## Available Queries

Here are some of the queries available in the Printavo API:

-   `account`
-   `contact`
-   `contacts`
-   `customer`
-   `customers`
-   `inquiry`
-   `inquiries`
-   `invoice`
-   `invoices`
-   `lineItem`
-   `lineItemGroup`
-   `lineItemGroupPricing`
-   `merchOrder`
-   `merchStores`
-   `merchStore`
-   `order`
-   `orders`
-   `paymentRequests`
-   `products`
-   `quotes`
-   `statuses`
-   `status`
-   `tasks`
-   `task`
-   `threads`
-   `thread`
-   `transactions`
-   `transaction`
-   `transactionDetail`
-   `user`
