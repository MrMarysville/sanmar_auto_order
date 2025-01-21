/**
 * @typedef {Object} InvoiceQueryOptions
 * @property {number} [first=25] - Number of invoices to fetch (max 25)
 * @property {string} [after] - Cursor for pagination
 * @property {string[]} [statusIds] - Filter by status IDs
 * @property {string} [inProductionAfter] - Filter by production start date
 * @property {string} [inProductionBefore] - Filter by production end date
 * @property {string} [paymentStatus] - Filter by payment status
 * @property {string} [sortOn] - Field to sort on
 * @property {boolean} [sortDescending] - Sort direction
 * @property {string} [searchTerm] - Search term for filtering
 * @property {string[]} [tags] - Filter by tags
 */

const GET_INVOICE = `
  query GetInvoice($id: ID!) {
    invoice(id: $id) {
      id
      visualId
      customerDueAt
      contact {
        id
        email
        fullName
        phone
        company {
          id
          name
        }
      }
      owner {
        id
        email
        firstName
        lastName
      }
      status {
        id
        name
        color
        type
        position
      }
      lineItemGroups {
        nodes {
          id
          name
          description
          position
          lineItems {
            nodes {
              id
              product {
                id
                name
                sku
                description
                category {
                  id
                  name
                }
              }
              quantity
              size
              color
              price
              cost
              markup
              profit
              mockups {
                nodes {
                  id
                  url
                  position
                }
              }
              imprints {
                nodes {
                  id
                  name
                  description
                  location
                  colors
                  mockupUrl
                }
              }
            }
          }
        }
      }
      shippingAddress {
        companyName
        customerName
        address1
        address2
        city
        stateIso
        zipCode
        countryIso
      }
      billingAddress {
        companyName
        customerName
        address1
        address2
        city
        stateIso
        zipCode
        countryIso
      }
      customerNote
      productionNote
      internalNote
      tags
      paymentStatus
      paymentProcessor
      paymentTerms {
        id
        name
        description
        daysUntilDue
      }
      deliveryMethod {
        id
        name
        description
      }
      approvals {
        nodes {
          id
          status
          requestedAt
          respondedAt
          mockupUrl
        }
      }
      subtotal
      tax
      shipping
      total
      balance
      depositRequired
      depositPaid
      timestamps {
        createdAt
        updatedAt
        deletedAt
        inProductionAt
        completedAt
      }
    }
  }
`;

const GET_RECENT_INVOICES = `
  query GetRecentInvoices(
    $first: Int
    $after: String
    $statusIds: [ID!]
    $inProductionAfter: ISO8601DateTime
    $inProductionBefore: ISO8601DateTime
    $paymentStatus: OrderPaymentStatus
    $sortOn: OrderSortField
    $sortDescending: Boolean
    $searchTerm: String
    $tags: [String!]
  ) {
    invoices(
      first: $first
      after: $after
      statusIds: $statusIds
      inProductionAfter: $inProductionAfter
      inProductionBefore: $inProductionBefore
      paymentStatus: $paymentStatus
      sortOn: $sortOn
      sortDescending: $sortDescending
      searchTerm: $searchTerm
      tags: $tags
    ) {
      nodes {
        id
        visualId
        customerDueAt
        contact {
          id
          email
          fullName
          company {
            id
            name
          }
        }
        status {
          id
          name
          color
          type
        }
        lineItemGroups {
          nodes {
            id
            name
            lineItems {
              nodes {
                id
                quantity
                size
                color
                price
                product {
                  id
                  name
                  sku
                }
              }
            }
          }
        }
        paymentStatus
        subtotal
        tax
        shipping
        total
        balance
        tags
        timestamps {
          createdAt
          updatedAt
          inProductionAt
          completedAt
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
      totalNodes
    }
  }
`;

module.exports = {
  GET_INVOICE,
  GET_RECENT_INVOICES
};
