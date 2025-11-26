Here's a quick introduction to concepts that are important in this API and an overview of engagement with AI Platform Services.

# Integration Partner

An *integration partner* interacts with our system on behalf of their own customers through the AI Platform Services API. (In other words, this is you!)

# Company

A *company* represents one of your customers. Configuration that you send on behalf of any one of your customers is scoped to its own company and is not shared between them.

You'll map each of your customers to their own companies using the tenant management endpoints defined in this API.

# Capability

A *capability* is a grouping of analytic features that you manage for each of your companies. As part of becoming an integration partner, you are assigned a set of capabilities you're allowed to give to each of your customers. For example, a company in possession of the `person_analytics` capability will have access to the MCAP person analysis feature and will be able to configure their system to perform person analysis.

# Security Token

*Security tokens* protect resources from unauthorized access. They're required to be provided with every API call in the form of an HTTP `Authorization` header. All security tokens in this header are prefixed with `Bearer ` (as in [RFC 6750](https://datatracker.ietf.org/doc/html/rfc6750)).

There are two types of security tokens:

- *Partner-scoped tokens* are used for the Tenant Management API endpoints.
- *Company-scoped tokens* are issued from the Tenant Management API endpoints and are used for the rest of the endpoints (client/site/view configuration, analytics). (You can alternatively use a partner-scoped token with an `X-Tenant-ID` header; more on that later.)

> info
> You are responsible for storing these tokens securely.

## Company Tokens for Company Endpoints
As an integration partner, you create companies in the platform using your partner-scoped token, and then interact with the API on behalf of the customer. Upon new company creation, the API returns a new company-scoped token your customer can use on behalf of that newly-created company.

## Integration Partner Tokens for Company Endpoints
Another way to perform operations on behalf of one of your customers is to use your *partner-scoped token* but declare in the request header that you are operating on behalf of a specific customer. This is done by setting the `X-Tenant-ID` header in the request to the value of the company ID that was returned to you when the company was created. This ID is the UUID that uniquely identifies the customer company, and using it allows you to assume the identity of the customer on a per-request basis, allowing you to manage any of your customer companies.

In the following example `curl` is used to get a list of sites for a customer using your *partner-scoped token*. The customer's client ID is equal to `myCustomerClient` and the customer company ID equal to `da3610e5-df25-47e7-ba78-b70937349772`:
```
$ curl --request GET \
  --url https://api.calipsa.io/services/integrator/clients/myCustomerClient/sites \
  --header 'Accept: application/vnd.api+json' \
  --header 'Authorization: Bearer <your_partner_scoped_token>' \
  --header 'X-Tenant-ID: da3610e5-df25-47e7-ba78-b70937349772'
```
# Onboarding and Engagement

Here are the steps involved to onboard you as an integration partner.

1. You agree to become an integration partner.
1. We issue you a partner-scoped token that you can use for exploration and testing. This token will both allow you to manage companies and will also allow you to explore functionality of the API in a sandbox environment.
1. You give us feedback about how you plan to use the API and share with us artifacts like call flows, data structure assumptions, and expected SLAs.
1. You create a company for each of your customers using the API. The API will return the company-scoped token as you create each one.
1. You finish integrating with our API by deploying your integration on your production system.
1. After release, you manage your active customer base using the tenant management API endpoints.
1. Over time, you may request further capabilities you want to enable for your customers, and we will add access through your integration partner account.

# Summary

- You are an integration partner.
- You are assigned capabilities (which enable analytic features) that you enable individually for each of your customers through tenant management endpoints.
- You must authenticate to tenant management endpoints using your partner-scoped token.
- You must authenticate to company endpoints using either:
  - the company-scoped token that represents your customer, or
  - your partner-scoped token and `X-Tenant-ID`
- You will work with the AI Platform Services team for a successful rollout of the platform into your product.