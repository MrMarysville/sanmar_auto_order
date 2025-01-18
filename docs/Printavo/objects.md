# Objects

Objects in GraphQL represent the resources that you can access. Objects can contain a list of fields, which are specifically typed. For example, the `Repository` object has a field called `name`, which is a `String`.

## Common Objects

Here are some of the common objects you'll encounter in the Printavo API:

-   `Account`: Represents your Printavo account.
-   `Address`: Represents a physical address.
-   `Approval`: Represents an approval.
-   `ApprovalRequest`: Represents a request for approval.
-   `Category`: Represents a category of line items.
-   `Contact`: Represents a customer contact.
-   `Customer`: Represents a customer.
-   `DeliveryMethod`: Represents a delivery method.
-   `EmailMessage`: Represents an email message.
-   `EmailTemplate`: Represents an email template.
-   `Expense`: Represents an expense.
-   `Fee`: Represents a fee.
-   `Imprint`: Represents an imprint on a product.
-   `Inquiry`: Represents a customer inquiry.
-   `Invoice`: Represents an invoice.
-   `LineItem`: Represents a line item on a quote or invoice.
-   `LineItemGroup`: Represents a group of line items.
-   `MerchAddress`: Represents a merch address.
-   `MerchOrder`: Represents a merch order.
-   `MerchStore`: Represents a merch store.
-   `Mockup`: Represents a mockup image.
-   `Payment`: Represents a payment.
-   `PaymentDispute`: Represents a payment dispute.
-   `PaymentRequest`: Represents a payment request.
-   `PaymentTerm`: Represents a payment term.
-   `Personalization`: Represents a personalization option for a line item.
-   `PoLineItem`: Represents a purchase order line item.
-   `PresetTask`: Represents a preset task.
-   `PresetTaskGroup`: Represents a group of preset tasks.
-   `PricingMatrix`: Represents a pricing matrix.
-   `PricingMatrixCell`: Represents a cell in a pricing matrix.
-   `Product`: Represents a product.
-   `ProductionFile`: Represents a production file.
-   `PurchaseOrder`: Represents a purchase order.
-   `Quote`: Represents a quote.
-   `Refund`: Represents a refund.
-   `Return`: Represents a return.
-   `Status`: Represents a status.
-   `Task`: Represents a task.
-   `TextMessage`: Represents a text message.
-   `TransactionDetails`: Represents transaction details.
-   `TypeOfWork`: Represents a type of work.
-   `User`: Represents a user in your Printavo account.
-   `Vendor`: Represents a vendor.
-   `Void`: Represents a voided transaction.

## Fields

Each object has a set of fields that describe its properties. For example, the `Customer` object has fields like `id`, `companyName`, `email`, and `phone`.

## Connections

Many objects are returned as part of a connection. A connection includes:

-   `edges`: A list of edges, each containing a `node` and a `cursor`.
-   `nodes`: A list of nodes, which are the actual objects.
-   `pageInfo`: Information about pagination, including `hasNextPage` and `endCursor`.
-   `totalNodes`: The total number of nodes in the connection.

For more information, see [the GraphQL spec](https://facebook.github.io/graphql/#sec-Objects).
