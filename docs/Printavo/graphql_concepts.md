# GraphQL Concepts

GraphQL is designed to limit excess in requests and responses, providing users with tools to tailor actions to their needs. The core concept is "ask for what you want and that's exactly what you'll get".

## Types and Fields

Data models are called "types", and information is stored in their "fields". A request defines the specific fields it wants to query or mutate.

## Collections and Pagination

A set of data objects is returned in a [connection](https://graphql-ruby.org/pagination/connection_concepts), and each individual object inside the connection object is called a "node".

The Printavo API paginates connections into pages of twenty-five nodes. Each connection reports its `totalNodes` value. GraphQL supports [slicing](https://graphql.org/learn/pagination/#slicing) to specify where in the list to begin and how many nodes to request.

Example:
```graphql
query {
  tasks {
    nodes(first: 5) {
      id
    }
  }
}
Use code with caution.
Markdown
Aliasing
GraphQL supports aliasing for queries, mutations, and fields to customize labels in returned data.

Example:

query {
  taskAlias: tasks {
    nodes {
      nameAlias: name
    }
  }
}
Use code with caution.
Graphql
Response:

{
  "data": {
    "taskAlias": {
      "nodes": [
        {
          "nameAlias": "Prepare the screens"
        },
        ...
      ]
    }
  }
}
Use code with caution.
Json
Conventions: The Use of !
! indicates two meanings:

Argument: A required argument.

query {
  task(id: ID!) {
	...
  }
}
Use code with caution.
Graphql
In the task query, an ID value is required.
2. Returned Field: A non-nullable value. For connections, it signifies that GraphQL will always return a connection even if that connection is empty.

Example:

fees (FeeConnection!)
Use code with caution.
Even if no fees are attached to an Invoice, a connection will always be returned.

Queries vs Mutations
Queries: Retrieve data.

Mutations: Modify data (analogous to HTTP verbs like POST, PATCH, DELETE).

Continued Reading
For more information check out GraphQL's official documentation

---

