We're now going to dive into more detailed HTTP semantics. Since this is an API built using a RESTful architectural style, hopefully this doesn't come as a surprise. This section briefly covers the basics around how to send valid HTTP requests and how to interpret responses from the platform. Before we go deep, though, we wanted to point out a few things.

First, we use OpenAPI 3.1 to define the API (this documentation is part of that definition). It describes both what the endpoints are and what the request/response formats can take. You can download the OpenAPI definition to generate client code in the language of your choice right here from this portal.

Second, we follow [semantic versioning](https://semver.org/) when developing this API over time. That means that we are keeping track of compatibility and will update the version number of this API in accordance with the following rules (given a version of `x.y.z`):
- increment the micro number `z` (resulting in `x.y.(z+1)`) when there is only a documentation change
- increment the minor number `y` (resulting in `x.(y+1).0`) when there is a backward-compatible change
- increment the major number `x` (resulting in `(x+1).0.0`) where there is an incompatible change

We will rarely make major version changes. If we do, we will communicate the changes broadly and continue to support the existing version alongside the new one until all clients have migrated.

# Requests

The bodies of most API HTTP requests use the `application/json` media type. So far so good, but let's talk specifically about compatibility of requests.

You may choose to pass properties in many requests that are not specified in the OpenAPI definition, as long as `additionalProperties: false` is not set in the OpenAPI definition for that property. They will be ignored by the service if they aren't recognized, but the request will still validate. This allows you to write forward-compatible integrations in anticipation of new properties being released to the API.

Whenever you see a type defined as an `enum`, accepted values may be added over time without breaking compatibility. For example, consider an `enum` defined in version `1.0` of the API which accepts values from the set `{apple, banana, coconut}`. This means you can pass it one of three values and it will be accepted by the service. If version `1.1` of the API is deployed and it now accepts more values from the set (say, `{apple, banana, coconut, date}`), you can still continue to pass the three values your code knows about and it will continue to work.

> warn
> Note that this is not true for `enum` types in responses. If you have programmed your service to a known sets of `enum` values, and later another one gets added, your service doesn't know what to do with this value and will need to be recoded to account for it. So changing an `enum` in the response is *not* a backward compatible change. We'll avoid doing this.

# Responses

## Success response codes

The HTTP specification defines a series of standard response codes, all defined by various RFCs (some superseding others), all used in different ways. While it may make for entertaining bedtime reading, our goal is to keep you awake while reading our documentation. So let's instead talk about how we use them in the API.

A `200 OK` response code indicates that the request was successful. A response body is included whose format is specified in the OpenAPI definition.

A `201 Created` response code indicates that the request was successful _and a resource was created which is accessible at the `Location` header provided in the response_.  A response body is included whose format is specified in the OpenAPI definition.

A `204 No Content` behaves exactly like a `200 OK` or `201 Created`, but the response does not have a body. This is useful for operations related to resource deletion or image uploading.

## Error response codes

A `400 Bad Request` response code indicates a malformed request, either in the URL or in the request body provided. It may be furnished by an automatic OpenAPI validator, or it may conform to the schema syntactically but not make sense semantically. These are usually a result of coding errors on the client side. Such a request should not be retried without changes.

A `401 Unauthorized` response code indicates an unauthorized request. This response can be expected when the `Authorization` header value is invalid, expired or missing. The request should not be retried with the same `Authorization` header value.

A `403 Forbidden` response code indicates a forbidden request. The provided `Authorization` header value is valid but the request is prohibited due to other permission restrictions (e.g., missing scopes or organizational settings). The request should not be retried unless the platform has been changed such that access has been granted.

A `404 Not Found` response code indicates that the resource cannot be found.

A `405 Method Not Allowed` response code indicates that the HTTP method being used (e.g., `GET` `PUT` `POST` `PATCH` `DELETE`) is not supported by the API at this endpoint. The request should not be retried without changes.

A `409 Conflict` response code indicates a conflict, caused by concurrent operations, that resulted in a situation where the requested operation could not be performed simultaneously with another operation. The request can be retried without changes but will most likely result in another error response code.

A `410 Gone` response code indicates that the resource was there at one time but is no longer accessible. _There is no guarantee that any previously-accessible resource will return `410 Gone`._ It will only be available for certain endpoints (as documented in the API) and only for a short duration.

Any kind of 5xx-series response code (e.g., `500` `502` `504`) means that something went wrong internally with the service, or (possibly) that the service was unreachable. You can consider trying the request again, though we recommend implementing a backoff policy before completely giving up.

## Response bodies

The bodies of most HTTP responses use the `application/vnd-api+json` media type. This is structurally and syntactically a lot like JSON (in fact, it's a superset), but it has more constraints. [JSON:API](https://jsonapi.org/) provides conventions for API interactions not found with a plain JSON format. This includes specifying relationships, links to external / supplementary resources, and conventions for operation exploration implied by the inclusion / exclusion of that metadata. We have chosen to conform to the JSON:API v1.1 specification. (The JSON:API specification is *slightly* more entertaining bedtime reading than the HTTP specification, but we'll still tell you what you need to know here).

All successful API response bodies (having a response code 2xx) will contain a `data` object where the actual results of the request can be found, per the JSON:API specification.

In case of a unsuccessful response, the response body will contain an `errors` array, _if it comes from us_. (An intermediate server may be the one issuing the error response, in which case there's no guarantee of the format.) Note that there is an `id` field in the `errors` array which uniquely identifies this HTTP request and can be useful to us if we are helping you troubleshoot an issue you're having.

# Relations

You'll see [link relations](https://en.wikipedia.org/wiki/Link_relation) in some HTTP responses. There's a designated place for them in the JSON:API spec.

A *link relation* relates one resource to another by:

- assigning the relationship a known identifier which has an agreed upon meaning, and
- providing a URL to the related resource.

For example, a resource providing information about the book *Pride and Prejudice* might also provide a link relation named `author` whose URL points to the Wikipedia page for Jane Austen (i.e., the book's author).

Link relations are represented as name-value pairs in a section that is separate from the rest of the resource. In this example, information about the book is located within the `data.attributes` section, but the links are located in the `data.links` section.

```json
{
     "data": {
          "id": "1",
          "type": "book",
          "attributes": {
               "numberOfWords": 122189,
               "originalLanguage": "en",
               "subjects": ["Pride","Prejudice"]
          },
          "links": {
               "self": "/catalog/books/1",
               "author": "https://en.wikipedia.org/Jane_Austen"
          }
     }
}
```

## Purpose

Link relations included with resources are *context specific*, meaning they are only relevant if a resource with that relation to the current resource exists. 

For example, consider retrieving list of resources which each represent a book on a particular library shelf. The API may only return 10 books at a time, giving you the ability to step through the results incrementally. Rather than needing to know and understand the detailed mechanics for how to page with the API (which can vary and can surprisingly be somewhat complex), you can simply look to see if a `next` link relation is present on the response returned to you and follow whatever link is there to get the next set of results.

Not only is following a link easier to integrate with, it also allows paging mechanisms themselves to change over time without breaking the integration.

## Usage

As a user of the API, your job is to:

* understand the meaning of the link relation name being presented
* follow the link that the relation provides to retrieve the related resource

The link may either be a relative or absolute URL. If it is a relative URL, it is relative to the *fully-qualified domain name* of the request that was just made.

In the example above, if the request that produced that response were from the URL `https://mybookshelf.com/shelves/101`, in order to retrieve the resource referred to by the `self` relation name, you would follow this link: `https://mybookshelf.com/catalog/books/1`.

## Link Relations for this API

Link relations such as `self`, `next`, or `prev` are standard, and their meaning can be found in the [official registry of link relations](https://www.iana.org/assignments/link-relations/link-relations.xhtml) (more bedtime reading). However, not all relations are standard. For any cases in which a custom link relation might arise, the AI Platform would use URLs for the link relation name (in compliance with [RFC8288](https://www.rfc-editor.org/rfc/rfc8288.html#section-2.1.2)). Even though the link relation name is a URL, it is only used as an identifier (though its location can be used to document the meaning of the relation). Just like any link relation, you can follow the link to retrieve the related resource.

Here's an example of a Links object that is returned with a custom link relation. It has two relations: `self` (which is a standard relation) and `https://relations.mcap.motorolasolutions.com/legacy-site` (which is a custom relation).

```json
"links": {
  "self":
       "/services/sites/19ec0d4f-3bb0-4787-969c-ab9ba9046e6c",
  "http://relations.mcap.motorolasolutions.com/legacy-site":
       "https://api.mcap.motorolasolutions.com/legacy-services/site/67890"
}
```

At this time, MCAP does not have any custom link relations, though we may create some in the future.

# Summary

The platform attempts to make interfacing with the API as consistent as possible by:
- using OpenAPI and semantic versioning
- using JSON for requests
- using JSON:API for responses
- using typical HTTP response codes
- providing link relations to describe other resources
