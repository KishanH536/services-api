In the modern world of distributed applications, building APIs to maximize compatibility over time is critical to integration success. Not only does it take cooperation and planning, but it also requires a basic set of assumptions between client and server that often go unwritten. We've attempted to list them so that integration efforts can be smoother and have fewer surprises before (and after) production rollouts.

# Server Assumptions

<table>
  <tr>
   <td><strong>Assumption</strong>
   </td>
   <td><strong>Rationale</strong>
   </td>
  </tr>
  <tr>
   <td>Clients <strong>must</strong> pass an Authorization header of type <code>Bearer</code>, signed and issued by the identity provider the server trusts, for each secured request it makes to the API. Clients must treat this token as opaque, meaning it must <em>not</em> attempt to decode the token and make assumptions about its structure.
   </td>
   <td>Token implementation must be able to change without warning, as a server may need to be able to change identity providers without being tightly coupled to clients.
<p>
Bearer tokens (as defined by the OAuth2 specification) are an industry-standard, widely adopted form of HTTP authentication and should be the primary way that clients make secured calls to servers.
   </td>
  </tr>
  <tr>
   <td>Clients <strong>must</strong> connect to API endpoints via TLS. Clients <strong>should</strong> use the latest version of TLS at the time of construction or after a major revision.
   </td>
   <td>TLS 1.3 is the latest industry standard, and new integrations to APIs should not use old versions of TLS.
<p>
No HTTP server should be exposing non-HTTPS endpoints, as nearly every API request has sensitive information (such as authorization tokens) and these can easily be compromised unless the communication channel is encrypted.
   </td>
  </tr>
  <tr>
   <td>Clients <strong>must</strong> ensure that they trust all root certificates used by domain names related to the API. This includes host names where the API is served from and redirects to host names outside of the direct domain of the API.
   </td>
   <td>Trust chains and root certificates are what make TLS work for the Internet. There are packages (such as Ubuntu’s <code>ca-certificates</code>) that can assist with keeping certificates issued by widely accepted certificate authorities (CAs) up to date.
   </td>
  </tr>
  <tr>
   <td>Clients <strong>must</strong> protect sensitive information under its control (such as Authorization header values and personally identifiable information sent through the API) to ensure that it is not accessible beyond those for whom it was intended.
   </td>
   <td>The server has no mechanism to determine whether secrets or personally identifiable information have been compromised upstream. Securing sensitive data is everyone’s responsibility.
   </td>
  </tr>
  <tr>
   <td>Clients <strong>must</strong> implement the following behaviors when receiving HTTP response codes:
<ol>

<li>Follow redirects when encountering them (i.e., 301/302).

<li>Implement a backoff policy when encountering gateway timeouts (i.e., 503/504) or general 500 errors.

<li>Gracefully handle any unexpected status codes and report them to users as necessary.

<li>When receiving a 400-series response,  avoid retrying the same request immediately. 
<ol>
 
<li>When encountering a 401, it may re-authenticate (or report an authentication error to its users).
 
<li>When encountering a 403, it may change access for the supplied credential in such a way that it believes it will not receive another 403.
 
<li>When encountering a 400, fixing the condition that caused the validation of supplied data to fail.
 
<li>When encountering a 429, understanding how the rate limiting policy applies to recently-made requests and 

<p>
Clients may encounter the above status codes for any request, <em>regardless of whether such a code is documented specifically for a given endpoint.</em>
</li> 
</ol>
</li> 
</ol>
   </td>
   <td>Following standard interpretation of HTTP response codes helps clients be resilient in the face of unexpected situations. Many of these situations are well known in the industry and have documented approaches, so reusing these approaches instead of inventing new ones saves development time and cost.
   </td>
  </tr>
  <tr>
   <td>Clients <strong>must</strong> ignore information in response payloads (such as new properties) that they have not been coded to understand.
   </td>
   <td>This allows the API to evolve at a different pace than the client and service multiple integrators in a scalable way.
   </td>
  </tr>
  <tr>
   <td>Clients <strong>must</strong> be able to handle the relaxing of a restriction with the release of a new service version. (Example: an existing endpoint may only accept up to 6 images for processing, but a future version of the endpoint may accept more).
   </td>
   <td>This allows the API to evolve at a different pace than the client and service multiple integrators in a scalable way.
   </td>
  </tr>
  <tr>
   <td>Clients <strong>must</strong> handle either relative or absolute URLs wherever they are encountered in responses. Examples which include relative URLs may, in reality, be absolute URLs in a production environment (or vice versa).
   </td>
   <td>Following links provided by the server, <em>regardless of the form the address takes</em>, promotes loose coupling and allows the server to make deployment decisions independent of client assumptions.
   </td>
  </tr>
  <tr>
   <td>Clients <strong>must</strong> assume that links will only be provided under the conditions that they are relevant to the response. (Example: a client may not be presented with an <code>edit-form</code> link relation if they do not have permission to edit a resource).
   </td>
   <td>Links provide context. The absence of a link means that there is no meaningful relationship from the resource to the expected target. 
   </td>
  </tr>
</table>



# Client Assumptions


<table>
  <tr>
   <td><strong>Assumption</strong>
   </td>
   <td><strong>Rationale</strong>
   </td>
  </tr>
  <tr>
   <td>Servers <strong>must</strong> implement all required portions of the HTTP 1.1 specification, including:
<ol>

<li>Semantics for safety / idempotency of operations follows the method being used (i.e., GET is safe, PUT/DELETE are idempotent, POST/PATCH is neither)

<li>Standard interpretation of <code>Accept</code> and <code>Content-Type</code> headers.

<li>The appropriate use of HTTP response headers in appropriate contexts (e.g., providing a <code>Location</code> header when returning a 201)
</li>
</ol>
   </td>
   <td>This helps clients and servers be loosely coupled to each other, which has been and will continue to be critical for the evolution of Internet-connected systems.
   </td>
  </tr>
  <tr>
   <td>The server <strong>must</strong> use default values for clients that do not pass a value for data which is optional for a given request / resource definition. Defaults <strong>must</strong> be documented in the API and <strong>should</strong> be compatible with previous versions within the same major version.
   </td>
   <td>This allows the API to evolve at a different pace than the client and serve multiple integrators in a scalable way.
<p>
Note that the default value may be different than a null value.
   </td>
  </tr>
  <tr>
   <td>If browser support is expected, the server <strong>must </strong>configure cross-origin resource sharing (CORS)  and include support for preflight requests.
   </td>
   <td>Supporting CORS is widely expected to be provided by modern API services. This allows those services to be called from a variety of known browser-based apps.
   </td>
  </tr>
  <tr>
   <td>Servers <strong>must</strong> protect sensitive information passed to it (such as <code>Authorization</code> header values and personally identifiable information sent through the API) to ensure that it is not accessible beyond those for whom it was intended.
   </td>
   <td>The client has no mechanism to determine whether secrets or personally identifiable information have been compromised downstream. Securing sensitive data is everyone’s responsibility.
   </td>
  </tr>
  <tr>
   <td>Servers <strong>must</strong> follow <a href="https://semver.org/spec/v2.0.0.html">Semantic Versioning</a> when communicating new version releases to integrators.
   </td>
   <td>Semantic versioning clearly communicates whether a new version is previously compatible to an existing one and is crucial for compatibility discussions.
   </td>
  </tr>
  <tr>
   <td>Servers <strong>must</strong> publish their API specification using industry standards like OpenAPI, AsyncAPI, and JSON Schema. Servers <strong>should</strong> use the latest versions of these specifications at the time of construction or after a major revision.
   </td>
   <td>Using standard specification languages allows for easier code generation and validation, increasing the speed of adoption.
<p>
OpenAPI 3.1 is the latest standard for describing synchronous HTTP APIs and is highly recommended for new API development. It fully supports integrated JSON Schema definitions, which have been the standard way to describe expected JSON formats for some time.
   </td>
  </tr>
  <tr>
   <td>Servers <strong>should</strong> publish a Developer Guide to assist in integrating with the API. Examples should be illustrative and conform to the specification (though they are not necessarily exhaustive of all possibilities).
   </td>
   <td>Developer guides help integrators with basic flow patterns and expectations that may not otherwise be evident in API documentation by itself.
   </td>
  </tr>
  <tr>
   <td>Servers <strong>must</strong> document all HTTP schemes and host names it may potentially redirect to (or otherwise refer to).
   </td>
   <td>Some clients may be deployed behind a firewall and may need to know ahead of time which addresses to register with their proxy.
   </td>
  </tr>
  <tr>
   <td>Servers <strong>must</strong> require an authorization token to be passed with every authenticated HTTP request.
   </td>
   <td>HTTP is a stateless protocol by nature, and sessions attempt to impose an interpreted state that is difficult to manage. Using an authorization token with expiry circumvents this problem by using standard HTTP re-authentication patterns.
<p>
This means that the concept of login and logout do not exist and so must be managed instead by storing / removing authorization tokens on the client.
   </td>
  </tr>
</table>

# Summary

The platform makes assumptions about how you code your HTTP clients, and likewise you can make assumptions about how we've used the HTTP specification to craft the API.