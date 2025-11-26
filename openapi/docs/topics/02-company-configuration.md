Each company has its own set of [*HTTP resources*](https://devblast.com/b/what-are-http-resources) available to it. In this section, we'll go over the details about how these resources work together to enable image analytics for your product.

# Client, Site, View (resources)

A *client* is a grouping of sites. You may choose to group sites by a particular attribute, or you may choose to put all sites for a given customer into one large client. You can think of a client as a big box to put sites in. A site must be associated with exactly one client.

A *site* represents a physical location where one or more views are located. A site may only be located in one time zone, and a view may only be associated with one site at a time.

A *view* (sometimes called a *camera* or even a *camera view*) represents the fixed scene of an image source over time. This is often a camera pointing in a specific, fixed direction. It's important for a view to be fixed upon the same scene, otherwise certain analytics and functionality will be unavailable (or produce incorrect conclusions).

> info
> Cameras do not usually configure themselves as views directly to the platform. More than likely, they will go through your product (and possibly through other components, such as their own on-premises VMS).

# Feature (property)

A *feature* is an analysis that is configured for a *view* resource. Examples include:

- basic object-in-motion detection (for people or vehicles)
- visible firearm detection
- vehicle analysis (license plate recognition and vehicle attributes)

You must first configure a view with *features* before you can request analysis of images. This is so the platform knows which analysis to run when it receives images. To configure a *view* with a particular feature, the company performing the configuration must be configured with the corresponding *capability*. For example, to configure a *view* with the `personAnalysis` feature, the configuring company must possess the `person_analytics` capability.

# Mask (property)

A *mask* is an exclusion zone applied to a specific view. Analytics will not be performed in any sections of the view which are covered by the mask. More than one mask may be defined for a given view; zero-to-many masks can be applied to a given view at a time.

## Mask Definition

To add masks to a *view*, the `masks` array in the request body object must be set. The `masks` array is a list (array) of all of the masks defined for the given *view*, with each mask represented by an array of points. These points are themselves two-element arrays, [x, y], each two-element array representing a coordinate point on a plane whose values are expressed in relative percentage of the given width/height – 0 for the first value indicates the leftmost position; 0 for the second value indicates the topmost position (and likewise, 1 for the first value indicates the rightmost position; 1 for the second value indicates the bottommost position).

The ordering of these points is important, as this ordering directly affects the shape of the mask, and the same set of points in a different order will produce a very different mask shape. This is due to the way the edges of the mask polygon are defined. The edges of the mask polygon, which is defined by these points, consist of the set of line segments between adjacent points in the list, with the last point in the list forming a final closing line segment with the first point in the list. Reordering the list changes point adjacencies, changing the resulting line segments and mask shape.

The area within this mask polygon is the exclusion zone defined by the mask, and no analytics processing will take place within the area of the mask polygon.

## Mask Example

In the following image, we have defined a single mask (upper left of image) that excludes an arbitrary shaped area from processing. The interior of the mask, where analysis will not take place, is shown with a red tint.

![Masked River Walk](../images/RiverwalkMask.png)

The initial point in the mask array is the upper left of the mask polygon, and is indicated by a red circle around the point. The final point in the mask array is the lower-left point, and is indicated by a green circle. The other points in the mask array are indicated by blue circles. As can be seen in the image, the mask polygon is created by connecting these points in order, with the last and first points forming the final closing polygon edge.

The `masks` array in the *view* create/update request would look as follows:
```JSON
{
  "masks": [
    [
      [ 0.0067, 0.0089 ],
      [ 0.26, 0.0089 ],
      [ 0.23, 0.52 ],
      [ 0.30, 0.58 ],
      [ 0.0050, 0.72 ]
    ]
  ]
}
```
In this particular example, the points are orderd in clockwise fashion, starting in the upper left and working around to the lower left. The same polygon could have been defined in other ways – for example in counter-clockwise fashion starting in the lower right and ending in the lower left. The starting and ending points are not important, but the ordering is, as the mask polygon segments are defined by adjacent points in the array.

More than one mask may be defined by simply adding arrays of points to the `masks` array.

# Analysis (resource)

After defining and configuring clients, sites, and views, you can start sending images to the platform for analysis.

Each analysis endpoint takes a series of images (known as an *image array*) that represents a short moment in time. It can receive up to 6 JPEGs per request. The images are attached to the request. PNGs are also supported, though not they are not preferred.

For example, if you want to configure a camera that detects motion to also be able to detect people and vehicles, the camera view should be configured with object detection enabled. Then, when the camera detects motion, 6 JPEGs from its video feed, attach them to a multipart message, and send them to one of the analysis endpoints. The analysis endpoints will then evaluate if the condition defined in the advanced analytic has been met and return the result in the response.

The next sections will help you determine which analysis endpoint to use.

## Full frame analysis

The _full-frame analysis_ endpoints (`/views/{viewId}/alarms` and `/integrator/views/{cameraIntegratorId}/alarms`) expect images which represent the entire fixed view of the image source (a.k.a. the full frame). We prefer you to use this endpoint for all analysis requests, as we can perform more sophisticated analyses with the broader frame context. Masks, scene change, and several other analyses are only available using these endpoints.

Since all images should be from the same scene, we expect all of the image formats and sizes to match each other in a given request. If subsequent images do not match the format or size of the first image, we do not define what happens. (Currently, as implemented, they will be dropped from the response silently, but we reserve the right to change this behavior in the future.)

You can adjust the analytic behavior by including an `options` part in this request. For further information, see the documentation at the API endpoint.

> info
> You might be wondering about the word `alarms` in the URL. Historically, this analytics engine powering the AI Platform was used exclusively for false alarm filtering. The endpoint still gives an overall binary disposition (i.e., `valid` or `not_valid` responses) but provides much more information about the context of the analysis itself (e.g., bounding boxes, object facets, etc.) The JSON:API type is, for this reason, referred to as an `alarm-analysis`.

## Chip analysis

 The _chip analysis_ endpoints (`/views/{viewId}/chips` and `/integrator/views/{viewId}/chips`) take a focused crop of the fixed scene for specific processing. You would want to use this endpoint if:
 
 - you have technical limitations where you can't pass the entire source view upon an event that triggers an analysis request, or
 - the analysis capability you need isn't yet offered at the alarms endpoint (visible firearm detection, for instance).

 This endpoint does not support masks, scene change, or advanced analytics with trends (i.e., loitering, crowd forming, and watch lists). The JSON:API type, even though the structure is a little different, is also referred to as an `alarm-analysis`.

# Platform vs. Integrator endpoints

 There are two styles of interacting with resources: _platform ID_ style and _integrator ID_ style. Let's explain the difference between the two and why you might want to choose one over the other (or potentially mix and match).

## Platform endpoints

These endpoints use UUIDs generated by the platform when created. Since the platform is solely responsible for generating IDs, you are responsible for storing these identifiers and mapping them to your own product's concepts.

Here is the basic flow of creating, replacing, and deleting a resource using a platform ID:

1. You can create a new resource by issuing a `POST` request to its collection endpoint. The returned location of the resource should be stored by you for future use.
    - Example: `POST /clients`
    - Returns a `201 Created` with a `Location` header set to `/clients/f0bb5fd6-0452-4fbc-9aa1-ec3373268216`
1. You can then issue a `GET` request to this location to retrieve the resource.
    - Example: `GET /clients/f0bb5fd6-0452-4fbc-9aa1-ec3373268216`
    - Returns a JSON:API representation of this client
1. You can replace the resource by issuing `PUT` request to this same location.
    - Example: `PUT /clients/f0bb5fd6-0452-4fbc-9aa1-ec3373268216`
    - Returns a JSON:API resource representation of this client that you just replaced
1. You can delete the resource by issuing a `DELETE` request to this same location.
    - Example: `DELETE /clients/f0bb5fd6-0452-4fbc-9aa1-ec3373268216`
    - Returns a `204 No Content` or `404 Not Found` if successful

> info
> This is a common pattern often found in REST APIs.

## Integrator endpoints

These endpoints allow you to specify the IDs you want to use (with certain restrictions and limitations).

Here is the basic flow of creating, replacing, and deleting a resource using an integrator ID:

- You can create a new resource _or replace an existing one_ by issuing a `PUT` request to its desired location.
    - Example: `PUT /integrator/clients/Rafael%20Hardware`
    - Returns a JSON:API resource representation of the client with an integrator ID of `Rafael Hardware`
    - If created, returns a `201 Created` with `Location` header set to `/clients/f0bb5fd6-0452-4fbc-9aa1-ec3373268216`.
    - If replaced, returns a `200 OK`.
- You can then issue a `GET` request to the same location to retrieve the resource.
    - Example: `GET /integrator/clients/Rafael%20Hardware`
    - Returns a JSON:API resource representation of this client
- You can delete the resource by issuing a `DELETE` request to this same location.
    - Example: `DELETE /integrator/clients/Rafael%20Hardware`
    - Returns a `204 No Content` or `404 Not Found` if successful

## Things to consider when choosing

- All resources created will have platform IDs (even if you don't use them). This means that you can create resources with integrator IDs but use platform ID endpoints on them (if that's something you want to do).
- Only resources created with integrator IDs will have integrator IDs (the property may appear but will be `null` if they are created through its platform ID endpoint).
- Integrator IDs, like platform IDs, are immutable. You cannot change their value once the resource is created.
- Integrator IDs can (but don't have to be) UUIDs. They can be a series of any URL-encodable values (limit of 100 characters).
- Per company, the pair of integrator client ID and integrator site ID together must be unique.
- Per company, a camera integrator ID is unique (regardless of the client/site pair it's associated with).
- A camera integrator ID that currently exists at Site A but is being `PUT` to Site B will cause the camera view to be moved to Site B.
- A client, site, and camera view can be created with one `PUT` request:
    - Example: `PUT /integrator/clients/Rafael%20Hardware/sites/HQ/views/FrontDoor`
    - Creates/updates a camera view named `FrontDoor` for the site named `HQ` under the client named `Rafael Hardware`
    - If there is no client named `Rafael Hardware`, it will be created.
    - If there is no site named `HQ`, it will be created as a site under `Rafael Hardware`.
    
> warn
> A site created implicitly as part of a `PUT` request to a view will use a default time zone. *This may alter certain behavior around the scene change feature if the site does not reside in that time zone*, so it's advised for you to separately create/replace sites in cases where you are using that feature.

# Summary

- Views are the main resource you will configure for image analysis. They are organized like this:
    - each company has one or more clients,
    - each client has one or more sites, and
    - each site has one or more views.
- Analytics are configured per view:
   - using features enabled by capabilities (required), and
   - using masks (optional).
- Image arrays are passed to the platform using one of the following endpoints:
    - the `alarms` endpoint (when the images are full frame), or
    - the `chips` endpoint (when the images are crops).
- There are two ways of addressing resources:
    - using platform IDs (generated by the platform), and
    - using integrator IDs (provided by you).
