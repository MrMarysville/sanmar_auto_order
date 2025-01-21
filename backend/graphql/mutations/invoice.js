/**
 * @typedef {Object} InvoiceCreateInput
 * @property {string} contactId - ID of the contact
 * @property {string} [dueDate] - Due date for the invoice
 * @property {Array<{
 *   productId: string,
 *   quantity: number,
 *   size: string,
 *   color: string,
 *   price: number,
 *   imprints?: Array<{
 *     name: string,
 *     description?: string,
 *     location: string,
 *     colors: Array<string>
 *   }>
 * }>} lineItems - Array of line items
 * @property {Object} [shippingAddress] - Shipping address
 * @property {Object} [billingAddress] - Billing address
 * @property {string} [customerNote] - Customer-facing note
 * @property {string} [productionNote] - Production-specific note
 * @property {string} [internalNote] - Internal note
 * @property {Array<string>} [tags] - Array of tags
 * @property {string} [statusId] - ID of the invoice status
 * @property {string} [paymentTermsId] - ID of the payment terms
 * @property {string} [deliveryMethodId] - ID of the delivery method
 * @property {number} [depositRequired] - Required deposit amount
 */

const CREATE_INVOICE = `
  mutation CreateInvoice($input: InvoiceCreateInput!) {
    invoiceCreate(input: $input) {
      invoice {
        id
        visualId
        customerDueAt
        contact {
          id
          email
          fullName
        }
        status {
          id
          name
          color
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
        paymentTerms {
          id
          name
        }
        deliveryMethod {
          id
          name
        }
        subtotal
        tax
        shipping
        total
        balance
        depositRequired
      }
      errors {
        message
        path
      }
    }
  }
`;

const UPDATE_INVOICE = `
  mutation UpdateInvoice($id: ID!, $input: InvoiceUpdateInput!) {
    invoiceUpdate(id: $id, input: $input) {
      invoice {
        id
        visualId
        customerDueAt
        contact {
          id
          email
          fullName
        }
        status {
          id
          name
          color
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
        paymentTerms {
          id
          name
        }
        deliveryMethod {
          id
          name
        }
        subtotal
        tax
        shipping
        total
        balance
        depositRequired
        depositPaid
      }
      errors {
        message
        path
      }
    }
  }
`;

const DELETE_INVOICE = `
  mutation DeleteInvoice($id: ID!) {
    invoiceDelete(id: $id) {
      success
      errors {
        message
        path
      }
    }
  }
`;

module.exports = {
  CREATE_INVOICE,
  UPDATE_INVOICE,
  DELETE_INVOICE
};
