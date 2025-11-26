*Scene change detection* determines if the camera view has significantly changed over time. The current image (when sent to an analysis endpoint) is compared to a set of provided _reference images_ (which represent the "ideal" view of the camera). Detections occur independently for each view.

# View Setup

To run the analysis, the `features` property of the view must contain the `sceneChangeDetection` property. 

Here's an example:
```JSON
{
    "displayName": "Alley Door",
    "features": {
        "sceneChangeDetection": {}
    }
}
```

The platform performs scene change detection when calling the `alarms` endpoint. There are multiple ways to use this analysis:

- On Demand
- Scheduled

# On Demand

*Scene Change On Demand* means that you are in full control of when the analysis occurs. You may want to run other analytics (such as basic object detection) every time you call the `alarms` endpoint but only run the scene change analysis once a day.

Include the `performSceneChangeDetection` property in the `options` part of the `alarms` request. It will behave as follows: 
  - If set to `true`,  scene change will be performed.
  - If set to `false`, scene change will **not** be performed.

Reference images *must* be available. They can either be provided in the `options` part of the request, or they can be configured ahead of time.

## Provided Reference Images

To provide reference images in the request when `performSceneChangeDetection` is `true`, pass an array of URLs using the `sceneChangeReferenceUrls` property. These URLs must be publicly accessible.

Example `options` part:

```JSON
{
  "performSceneChangeDetection": true,
  "sceneChangeReferenceUrls": [
    "https://my-public-image-repo.com/image-day",
    "https://my-public-image-repo.com/image-night",
  ]
}

```

> info
> Note: we suggest securing URLs to your reference images via a pre-signing mechanism (for instance, S3 pre-signed URLs) which have a short expiration period (between 30 seconds and 1 minute). This will provide a level of security to your camera views that would otherwise potentially leak sensitive image data to third parties.

## Configured Reference Images

If `performSceneChangeDetection` is `true` and reference images are *not* provided in the request, the platform will lookup the reference images previously configured for the view. The view should be configured with at least 1 reference image (day or night) or both. See the `/views/{viewId}/dayReferenceImage` and `/views/{viewId}/nightReferenceImage` endpoint documentation for details.

Example `options` part:

```JSON
{
  "performSceneChangeDetection": true
}
```

If the view does not have any reference images defined, the API will return a `400 Bad Request` response.

> info
> If you provide reference images through the `sceneChangeReferenceUrls` property, they will be used instead the configured ones.

# Scheduled

If there is no `performSceneChangeDetection` property provided in the `options` part, scene change detection will be performed approximately twice a day. At least one reference image must be configured for the view for this to occur.

If there isn't a day reference image set and the time the image is received falls within "daytime" (8am-4pm in the timezone of the site), the current image will be set to the day reference image. Likewise, if there isn't a night reference image set and the time the image is received falls within "nighttime" (4pm-8am in the timezone of the site), the current image will be set to the night reference image. Subsequent requests will use these images as reference images.

We recommend (but do not require) intentionally setting reference images through the API.

# Response

## When Performed

If scene change is performed, the `sceneChange` response attribute will contain a `result` property (`valid`, or `not_valid`). A `valid` result indicates that the scene has changed.

In addition, the `sceneChange` response contains a `details` property that describes why the scene changed if the result is `valid`. The value for the `details` property is an object that contains the following boolean values:
* `blur` – indicates that the scene change reason is a blurry image.
* `imageShift` – indicates that image has shifted from the reference image, indicating that the camera may have been moved or obstructed.

If scene change was run on demand, the `sceneChange` response attribute will also contain a `reference` property, containing information about which reference image was used in the detection (the platform dynamically picks the best one to use for the analysis). `reference` is a URL.

Examples:

Response for On Demand Scene Change Detection with configured reference images:
```JSON
{
    "data": {
        "id": "10300193-388f-4e21-bfbd-ac1c1e8ece58",
        "type": "alarm-analysis",
        "attributes": {
            "analytics": {},
            "sceneChange": {
                "result": "valid",
                "details": {
                    "blur": false,
                    "imageShift": true
                },
                "reference": {
                  "url": "/views/53820dfe-7b0c-492c-8969-37b948b696d8/snapshot?refImage=day"
                }
            }
        }
    }
}
```

Response for On Demand Scene Change Detection with provided reference images:
```JSON
{
    "data": {
        "id": "10300193-388f-4e21-bfbd-ac1c1e8ece58",
        "type": "alarm-analysis",
        "attributes": {
            "analytics": {},
            "sceneChange": {
                "result": "valid",
                "details": {
                    "blur": true,
                    "imageShift": false
                },
                "reference": {
                  "url": "https://my-public-image-repo.com/image-day"
                }
            }
        }
    }
}
```


## When Not Performed

If scene change is *not* performed, the `sceneChange` response attribute will contain a `result` property (the value will be `not_performed`), and a `reason` property, with an explanation as to why the detection was not performed. See the API endpoint documentation for details.

Example:
```JSON
{
    "data": {
        "id": "ac0d72e4-80f7-48a5-86cb-e0f9d095ce59",
        "type": "alarm-analysis",
        "attributes": {
            "analytics": {},
            "sceneChange": {
                "result": "not_performed",
                "reason": {
                    "skip": {
                        "periodDetection": {}
                    }
                }
            }
        }
    }
}
```

> info
> Even if scene change is not configured for a view, this section is still present in responses (`not_performed` will always be set).

# Summary

Scene change detection is only supported for full-frame analysis endpoints. It can be configured in a variety of ways:
- On Demand, provided reference images
- On Demand, configured reference images
- Scheduled

The platform will respond with information to tell you if scene change was detected or not detected along with details for a valid detection, or if the analysis was not performed.

