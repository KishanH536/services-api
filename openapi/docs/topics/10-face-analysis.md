*Face Detection* provides information about a face (chip requests) or faces (full frame requests). 

For face chip analysis each image is assumed to have been pre-filtered to contain a crop of a face. Chips will be checked by the service to make sure they are of a minumum acceptable size for accurate analysis. These size restrictions are specified in the API spec.

For full frame face analysis the image is first analysed to detect faces, then each face is analyzed to determine its attributes.

For both chip and full frame analysis, up to 6 JPEG images may be sent in a single request. The response format for both are detailed in the API spec.

# View Setup

To run the analysis, the `features` property of the view must contain the `faceDetection` attribute along with a `name` and `integratorId` in the `features.advancedRules` property of the view's attributes. The `integratorId` attribute of the face chips advanced rule is specified by the integrator and may be used to reference the rule in future requests.

Here's an example of how to configure the view for face detection processing:
```JSON
{
    "displayName": "Face Chips Test",
    "features": {
        "advancedRules": [
            {
                "integratorId": "xyz",
                "name": "face rule",
                "faceDetection": {}
            }
        ]
    }
}
```

Note that the company to which the View belongs must be setup with the `detect_face` capability to be able to configure Views for face analysis. See "Tenant Management" section of the API documentation for details.

# Response Properties

For chip analysis, the result is returned in the `data.attributes.analytics.faceDetection` object in the JSON response body. For full-frame analysis, the result is returned in the `data.attributes.analytics.faceAnalysis` object. Each face in the analytics result contains the following properties:

* `acceptability` (`number`) – An assessment of the likelihood of a real human face in the bounding box
* `quality` (`number`) - An assessment of how good the face is for face recognition and matching purposes
* `box` (`object`) - The coordinates of the bounding box the contains the face in the image
* `embedding` (array of `number`) - the embedding representing the face

Here's an example response to a face chip detection request:

```JSON
{
    "data": {
        "id": "019935a5-a1ad-705b-8d31-afd81450d61a",
        "type": "alarm-analysis",
        "attributes": {
            "analytics": {
                "resultSummary": "valid",
                "faceDetection": {
                    "faces": [
                        [
                            {
                                "acceptability": 1,
                                "quality": 0.84,
                                "box": {
                                    "x1": 0.2352,
                                    "y1": 0.16649,
                                    "x2": 0.6906,
                                    "y2": 0.78229
                                },
                                "embedding": [
                                    -0.08704357324483471,
                                    0.030776382044240113,
                                    -0.0068944224157310285,
                                    0.062129492234059676
                                ]
                            }
                        ]
                    ],
                    "paravisionVersion": "5"
                }
            }
        }
    }
}
```

Here's an example response to a full-frame face analysis request:

```JSON
{
    "data": {
        "id": "019935a4-e88f-71ec-8dc3-b81be2c140c9",
        "type": "alarm-analysis",
        "attributes": {
            "analytics": {
                "resultSummary": "valid",
                "resultSummaries": {
                    "faceAnalysis": {
                        "detectionResult": "valid"
                    }
                },
                "faceAnalysis": {
                    "faces": [
                        [
                            {
                                "acceptability": 0.89,
                                "quality": 0.68,
                                "box": {
                                    "x1": 0.67355,
                                    "y1": 0.33507,
                                    "x2": 0.73677,
                                    "y2": 0.45355
                                },
                                "embedding": [
                                    0.03552443953121946,
                                    -0.07052102848012291,
                                    0.02706200927572529
                                ]
                            },
                            {
                                "acceptability": 0.88,
                                "quality": 0.8,
                                "box": {
                                    "x1": 0.19968,
                                    "y1": 0.43149,
                                    "x2": 0.28993,
                                    "y2": 0.59456
                                },
                                "embedding": [
                                    0.03643466741165144,
                                    -0.014370859410821005,
                                    0.041518330720130094
                                ]
                            }
                        ]
                    ],
                    "paravisionVersion": "6"
                }
            }
        }
    }
}
```