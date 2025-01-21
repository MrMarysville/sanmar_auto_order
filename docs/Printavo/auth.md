# Authentication

Requests to Printavo API v2.0 are made to the following endpoint:

`www.printavo.com/api/v2`

Authentication Headers:
Use code with caution.
Markdown
const headers = {
'Content-Type': 'application/json',
'email': 'sales@kingclothing.com',
'token': 'uyZXl2kWJNSXwR_MXMuNWQ'
};

To use this API you would need to include the following headers to any request you make.
`Content-Type` is `application/json` and your `email` and `token`
Rate Limiting: Maximum of 10 requests for every 5 seconds per user email or IP address.