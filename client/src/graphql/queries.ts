import { gql } from '@apollo/client'

export const GET_ORDERS = gql`
  query GetOrders($first: Int, $after: String) {
    orders(first: $first, after: $after) {
      edges {
        node {
          id
          createdAt
          status
          customerDueAt
          tags
          lineItemGroups {
            edges {
              node {
                id
                name
                lineItems {
                  edges {
                    node {
                      id
                      name
                      sku
                      quantity
                      price
                    }
                  }
                }
              }
            }
          }
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`

export const GET_ORDER = gql`
  query GetOrder($id: ID!) {
    order(id: $id) {
      id
      createdAt
      status
      customerDueAt
      tags
      lineItemGroups {
        edges {
          node {
            id
            name
            lineItems {
              edges {
                node {
                  id
                  name
                  sku
                  quantity
                  price
                }
              }
            }
          }
        }
      }
    }
  }
`

export const CREATE_ORDER = gql`
  mutation CreateOrder($input: OrderCreateInput!) {
    orderCreate(input: $input) {
      order {
        id
        createdAt
        status
        customerDueAt
        tags
      }
      errors {
        field
        message
      }
    }
  }
`

export const UPDATE_ORDER = gql`
  mutation UpdateOrder($id: ID!, $input: OrderUpdateInput!) {
    orderUpdate(id: $id, input: $input) {
      order {
        id
        createdAt
        status
        customerDueAt
        tags
      }
      errors {
        field
        message
      }
    }
  }
`

export const DELETE_ORDER = gql`
  mutation DeleteOrder($id: ID!) {
    orderDelete(id: $id) {
      success
      errors {
        field
        message
      }
    }
  }
` 