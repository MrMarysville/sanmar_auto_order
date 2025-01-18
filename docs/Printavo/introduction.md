# Introduction to the Printavo API

The Printavo API is a GraphQL API that allows you to access and modify data in your Printavo account. This document provides an overview of how to use the API, including authentication, basic concepts, and common workflows.

## Authentication
Printavo endpoint https://www.printavo.com/api/v2

To make requests to the Printavo API, you will need to include the following headers:

```
const headers = {
  'Content-Type': 'application/json',
  'email': '{{youremail@email.com}}',
  'token': '{{API token from My Account page}}'
};
```

Replace `{{youremail@email.com}}` with your Printavo account email and `{{API token from My Account page}}` with your API token.

## Basic Concepts

The Printavo API uses GraphQL, which is a query language for APIs. In GraphQL, you ask for specific data and get back exactly what you asked for.

### Types

Data models in GraphQL are called "types". Information about types is stored in their "fields".

### Connections and Pagination

A set of data objects (such as Customers or Invoices) is returned in a "connection". Each individual object inside the connection object is called a "node".

By default, the Printavo API paginates connections into pages of twenty-five nodes. You can use the `first` and `after` arguments to control pagination.

### Aliasing

GraphQL supports aliasing for queries, mutations, and individual fields, allowing you to customize the labels in the returned data.

### Conventions

In GraphQL, the exclamation point `!` indicates a required argument or a non-nullable value.

## Queries vs Mutations

Queries are used to retrieve data, while mutations are used to modify data.

## Further Reading

For more information, check out the official GraphQL documentation: https://graphql.org/learn/
