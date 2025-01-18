# Mutations

Mutations are used to modify data stored on the server. They are analogous to HTTP verbs such as `POST`, `PATCH`, and `DELETE`. Like queries, mutations require arguments and return only the requested fields.

## Example Mutation: Update a Contact

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
```

In the above query, the `input` is being passed in one field, `email`, which is an array of strings. The `email` field on the `Contact` type will return a single string, so the response from the server would look like this, after the update was put into effect:

```json
{
  "data": {
    "contactUpdate": {
      "id": "1",
      "email": "john.doe@example.com, jane.doe@example.com"
    }
  }
}
```

## Example Mutation: Update an Invoice and its Shipping Address

For a more complex example, let's look at an `InvoiceUpdate` to add customer notes, production notes, tags, a new date, and a new shipping address.

```graphql
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
```

In the above request, the user is passing multiple fields into the `input`, each with their own arguments. The response from the server would include all of the newly-updated fields:

```json
{
  "data": {
    "invoiceUpdate": {
      "id": "123",
      "contact": {
        "id": "456",
        "email": "wily.e.coyote@acme.com, road.runner@acme.com"
      },
      "customerNote": "Extra charge for rush shipping",
      "productionNote": "Rush job, make sure this goes out today!",
      "customerDueAt": "2023-07-04",
      "tags": [
        "#rush"
      ],
      "shippingAddress": {
        "companyName": "ACME",
        "customerName": "Wile E. Coyote",
        "address1": "123 Main Street",
        "address2": "Apt. 551",
        "city": "Albuquerque",
        "stateIso": "NM",
        "zipCode": "87121"
      }
    }
  }
}
```

While it is not mandatory for a request to ask for all of the modified fields to be included in the response, it is generally good practice to do so, as it allows the user to verify that their input has been processed as expected.

## Available Mutations

Here are some of the mutations available in the Printavo API:

-   `approvalRequestApprove`
-   `approvalRequestRevoke`
-   `approvalRequestUnapprove`
-   `contactCreate`
-   `contactDelete`
-   `contactUpdate`
-   `customerCreate`
-   `customerDelete`
-   `customerUpdate`
-   `deliveryMethodArchive`
-   `deliveryMethodCreate`
-   `deliveryMethodUpdate`
-   `emailMessageCreate`
-   `feeCreate`
-   `feeDeletes`
-   `feeUpdate`
-   `feeUpdates`
-   `imprintCreate`
-   `imprintDeletes`
-   `imprintMockupCreate`
-   `imprintUpdates`
-   `inquiryCreate`
-   `inquiryDelete`
-   `inquiryUpdate`
-   `invoiceDuplicate`
-   `invoiceDelete`
-   `invoiceUpdate`
-   `lineItemCreate`
-   `lineItemDelete`
-   `lineItemDeletes`
-   `lineItemMockupCreate`
-   `lineItemUpdate`
-   `lineItemUpdates`
-   `lineItemGroupCreate`
-   `lineItemGroupDelete`
-   `lineItemGroupUpdate`
-   `lineItemGroupUpdates`
-   `logout`
-   `mockupDelete`
-   `paymentTermArchive`
-   `paymentTermCreate`
-   `paymentTermUpdate`
-   `presetTaskCreate`
-   `presetTaskDelete`
-   `presetTaskGroupApply`
-   `presetTaskGroupCreate`
-   `presetTaskGroupDelete`
-   `presetTaskGroupUpdate`
-   `presetTaskUpdate`
-   `productionFileCreate`
-   `productionFileDeletes`
-   `productionFileCreates`
-   `quoteCreate`
-   `quoteDelete`
-   `quoteDuplicate`
-   `quoteUpdate`
-   `statusUpdate`
-   `taskCreate`
-   `taskDelete`
-   `taskUpdate`
-   `threadUpdate`
-   `transactionPaymentCreate`
-   `transactionPaymentDelete`
-   `transactionPaymentUpdate`
