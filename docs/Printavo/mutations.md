# Mutations

Mutations are used to modify data on the server

Example: Update a contact

```graphql
mutation {
  contactUpdate(
    id: 1
    input: { email: ["john.doe@example.com", "jane.doe@example.com"] }
  ) {
    id
    email
  }
}

Example: Update an invoice and its shipping address.

mutation {
  invoiceUpdate(
    id: 123
    input: {
      contact: { id: 456 }
      customerNote: "Extra charge for rush shipping"
      productionNote: "Rush job, make sure this goes out today!"
      customerDueAt: "2023-07-04"
      tags: ["#rush"]
      shippingAddress: {
        companyName: "ACME"
        customerName: "Wile E. Coyote"
        address1: "123 Main Street"
        address2: "Apt. 551"
        city: "Albuquerque"
        stateIso: "NM"
        zipCode: "87121"
      }
    }
  ) {
    id
    contact {
      id
      email
    }
    customerNote
    productionNote
    customerDueAt
    tags
    shippingAddress {
      companyName
      customerName
      address1
      address2
      city
      stateIso
      zipCode
    }
  }
}
Use code with caution.
Graphql
Mutations include, but aren't limited to:

approvalRequestApprove

approvalRequestCreate

approvalRequestRevoke

contactCreate

contactDelete

contactUpdate

customerCreate

customerDelete

customerUpdate

customAddressCreate

customAddressDelete

customAddressUpdates

deliveryMethodArchive

deliveryMethodCreate

deliveryMethodUpdate

emailMessageCreate

feeCreate

feeDelete

feeCreates

feeUpdates

imprintCreate

imprintDelete

imprintCreates

imprintMockupCreate

imprintUpdates

inquiryCreate

inquiryDelete

inquiryUpdate

invoiceDelete

invoiceDuplicate

invoiceUpdate

lineItemCreate

lineItemDelete

lineItemDeletes

lineItemMockupCreate

lineItemMockupCreates

lineItemGroupCreate

lineItemGroupDelete

lineItemGroupUpdates

lineItemUpdates

login

logout

mockupDelete

mockupDeletes

paymentRequestCreate

paymentRequestDelete

paymentTermArchive

paymentTermCreate

paymentTermUpdate

presetTaskCreate

presetTaskDelete

presetTaskGroupApply

presetTaskGroupCreate

presetTaskGroupDelete

presetTaskGroupUpdate

productionFileCreate

productionFileDelete

productionFileCreates

quoteCreate

quoteDelete

quoteDuplicate

quoteUpdate

statusUpdate

taskCreate

taskDelete

threadUpdate

transactionPaymentCreate

transactionPaymentDelete

transactionPaymentUpdate