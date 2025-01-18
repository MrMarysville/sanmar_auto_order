# SanMar Purchase Order Integration Guide v21.9

## Authentication
- Use your existing SanMar username kingcl and password candis21.
- Setup separate web user accounts at [SanMar Webuser Signup](https://www.sanmar.com/signup/webuser).
- Contact **sanmarintegrations@sanmar.com** for EDEV setup or integration requests.

## Integration Overview
SanMar supports FTP and SOAP-based Web Service integration for automated order processing.

### Supported Web Services
1. **getPreSubmitInfo**: Confirms inventory availability from the closest warehouse.
2. **submitPO**: Submits purchase orders for processing.
3. **PromoStandards SendPO**: For detailed and configurable purchase orders.

## File-Based FTP Order Integration
FTP integration uses three required files:
1. **CustInfo.txt**: Shipping information.
2. **Details.txt**: Product information.
3. **Release.txt**: Authorizes processing.

### File Naming Convention
Files must include:
- Date in MM-DD-YYYY format.
- Batch number for the day.
- File type (e.g., `CustInfo`, `Details`, or `Release`).

Example:
```
06-07-2022-1CustInfo.txt
06-07-2022-1Details.txt
06-07-2022-1Release.txt
```

### File Submission Timing
- Upload `CustInfo.txt` and `Details.txt` first.
- Add a timing delay before submitting the corresponding `Release.txt`.

### CustInfo.txt Format
| Field Name         | Description                             | Required |
|--------------------|-----------------------------------------|----------|
| PONUM             | Purchase Order Number                  | Yes      |
| Address 1         | Street Address                         | Yes      |
| City              | City Name                              | Yes      |
| State             | 2-Character State Code                 | Yes      |
| ZIP Code          | 5-9 Digit Zip Code                     | Yes      |
| Email             | Shipping Notification Email            | Yes      |
| Shipping Method   | UPS or USPS                            | Yes      |
| Residence         | `Y` or `N`                             | Yes      |

### Details.txt Format
| Field Name         | Description                             | Required |
|--------------------|-----------------------------------------|----------|
| PONUM             | Purchase Order Number                  | Yes      |
| Inventory Key     | Product Identifier from SanMar Database | Yes      |
| Quantity          | Quantity Ordered                       | Yes      |
| Size Index        | Product Size Identifier                | Yes      |
| Warehouse Number  | Leave Blank or Specify (Optional)      | No       |

### Release.txt Format
| Field Name | Description              | Required |
|------------|--------------------------|----------|
| PONUM     | Purchase Order Number   | Yes      |

Example:
```
FX34689
```

### Holding.txt File
- Contains order acknowledgments, including:
  - Warehouse availability (`Y` or `N`).
  - Product details (style, color, size).

### Folder Structure
- `In` and `Release`: For incoming files.
- `Holding`: For acknowledgments.
- `Done`: Processed files.
- `ErrorFiles`: For invalid files.

## Web Service Integration

### getPreSubmitInfo
Confirms inventory availability. Key parameters:
- **poNum**: Purchase Order Number.
- **shipAddress1**, **shipCity**, **shipState**, **shipZip**: Shipping details.
- **style**, **color**, **size**: Product details.
- **quantity**: Requested quantity.

Response example:
```xml
<webServicePoDetailList>
  <message>Requested Quantity is confirmed and available in warehouse '1'.</message>
  <whseNo>1</whseNo>
</webServicePoDetailList>
```

### submitPO
Submits a purchase order for processing. Key parameters:
- **poNum**: Purchase Order Number.
- **shipTo**, **shipAddress1**, **shipCity**, **shipState**, **shipZip**: Shipping details.
- **style**, **color**, **size**, **quantity**: Product details.

Request example:
```xml
<soapenv:Envelope>
  <soapenv:Body>
    <web:submitPO>
      <poNum>Integration Test Order</poNum>
      <shipTo>SanMar Corporation</shipTo>
      <webServicePoDetailList>
        <style>K420</style>
        <color>Black</color>
        <size>S</size>
        <quantity>10</quantity>
      </webServicePoDetailList>
    </web:submitPO>
  </soapenv:Body>
</soapenv:Envelope>
```

Response example:
```xml
<message>PO Submission successful</message>
```

### PromoStandards SendPO
Used for configurable and detailed orders. Key parameters:
- **orderType**: Type of order (e.g., Blank, Sample).
- **orderNumber**: PO Number.
- **carrier**: Shipping method (e.g., UPS Ground).

Request example:
```xml
<soapenv:Envelope>
  <soapenv:Body>
    <ns:SendPORequest>
      <ns:orderType>Blank</ns:orderType>
      <ns:orderNumber>TEST01</ns:orderNumber>
      <ns:carrier>UPS</ns:carrier>
      <ns:service>Ground</ns:service>
    </ns:SendPORequest>
  </soapenv:Body>
</soapenv:Envelope>
```

Response example:
```xml
<transactionId>TEST01-p-5877</transactionId>
```

## Additional Notes
- Contact **sanmarintegrations@sanmar.com** for assistance.
- Setup testing in the EDEV environment before production.
- Avoid duplicate line items in order submissions to prevent errors.

---

This Markdown file retains only essential details while removing repetitive or unnecessary information. You can save this under `docs/sanmar_integration.md` in your codebase.
