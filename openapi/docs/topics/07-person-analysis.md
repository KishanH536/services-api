*Person analysis* provides information about person attributes. This includes information about the person's appearance (gender, child or adult, clothing color, and hair color), as well as more information related to proper use of personal protective equipment (PPE), which consists of hard hat detection and high-visibility clothing detection for determining safety compliance.

Person analysis supports both chip and full-frame images. For full-frame analysis, the platform first performs a persons detection in the image, and each detected person is then analyzed for their attributes. For chip analysis, each chip is assumed to contain a single person, and only the analysis is performed. The API documentation describes the details of these requests.

# Image Considerations

There are some guidelines to consider when providing images for person analysis, which are described below.

## Image Source and Type

Fixed-lens CCTV camera images with good lighting (see below) are generally suitable for full-frame processing. For chip processing, the image should be suitably cropped. Ensure crops are appropriately sized and include the entire person or key areas for analysis (e.g., head to toe, or head and shoulders if facial analysis is a focus, or just the upper half of the person if the lower body is not of interest).

Less ideal situations include highly distorted CCTV images (e.g., extreme wide angle), or images from mobile phones or other consumer cameras. These situations may produce less accurate results. Thermal and IR cameras generally lack the visual detail necessary for most attribute analysis tasks (e.g., clothing), and fisheye cameras introduce extreme distortion, especially at the edges, and can significantly hinder accurate person detection and attribute analysis. While they provide wide coverage, the warped perspective makes it challenging for our algorithms to reliably assess features. If fisheye cameras are your only option, focus analysis on individuals appearing closer to the center of the image where distortion is minimal, or consider providing cropped "chip" images from these central regions.

## Lighting Conditions

Well-lit scenes with even lighting produce the best results. Slightly low-light images may be acceptable, but may decrease accuracy, and strong backlighting, very dark scenes, and strong glare and shadows can result in poor analysis results.

## Image Clarity and Quality

Images with excessive noise, artifacts, or compression can negatively impact the analysis. Providing the cleanest possible images directly from the source without unnecessary manipulation or re-compression will produce the best results. Also, ensure that the subjects are in focus. Out-of-focus images will significantly degrade the quality of the analysis.

## Sublect Size, Distance, and Obstructions

In full CCTV frames, the size of the persons in the image is important. Persons who are very small and far away might be difficult to detect accurately. If the persons of interest are consistently very small in the full frame, consider providing cropped "chip" images if possible. Aim for a resolution where the persons of interest are at least a few dozen pixels in height. Blurry or highly pixelated images make accurate detection and attribute analysis challenging. For chip processing, ensure the person occupies a significant portion of the frame.

Images where the person is significantly obstructed by other objects (e.g., poles, trees, other people) will make it difficult or impossible to analyze the obscured parts. Minor occlusions (e.g., a hand briefly covering part of the face) might be acceptable, but significant or persistent occlusions should be avoided.

## Perspecitve and Angle

The AI models for person analysis are designed to handle various perspectives typical of CCTV footage (e.g., top-down, angled views, frontal, side profiles). Very extreme or unusual angles might sometimes pose challenges for attribute analysis, especially if specific features are heavily distorted or not visible.

## Image Considerations Summary

For the best analysis results, please try to provide images that are:
* Well-lit
* In focus
* Minimally distorted
* Have reasonably sized and clear depictions of the people
* Have minimal obstructions

By adhering to these guidelines, you will significantly improve the accuracy and reliability of the analysis provided by our service.

# View Setup

To run person analysis, the `features` property of the view that produced the
image must contain the `personAnalysis` property.

Here's an example of how to configure the view:
```JSON
{
    "displayName": "Alley Door",
    "features": {
        "personAnalysis": {}
    }
}
```

# Full-Frame Analysis Response

Full-frame analysis operates on full uncropped images, and returns attributes
for detected persons in the frame. The analysis first detects persons in the
image, and assigns a bounding box, which represents a sub-section of the image
containing the detected person. Each detected person is sent for further 
analysis, resulting in a person attributes object, which describes the bounding-box
and the person contained within.

For full-frame analysis, up to 6 JPEG images may be sent in a single request.
The minumum size of each image is 320x240, and each image is processed
independently. 

## Embeddings

If the company (indicated by the authentication token) making the request has the `person_analysis.embedding` capability, an embedding will be included for each person in the response. This applies to both chip and full-frame requests. If the request contains a child company token, the capabilites will be read for the respective child company. If the request contains the integration partner token and an `x-tenant-id` header, the capabilities will be read for the integration partner (see the "1. Basic Concepts - Security Token" section for more details on authentication methods).

## Person Analysis with Full-Frame Face Analysis

If a view is configured with both the person analysis and face detection features
the response will include analysis results for both persons and faces. Each person
element will contain, a `faceIndex` property which refers to the index of the
element ("face") in the face analysis property of the response. 

The response may contain persons without faces, indicated by a `faceIndex` value
of `-1`. The response may also contain faces without people, for which there will
be no person with a corresponding `faceIndex` property.

For requests containing multiple images, both persons and faces are grouped by
image. The `faceIndex` property will reference the array of faces in the same
position as the persons array.

## Person Analysis Response Properties

The result is returned in the `data.attributes.analytics.personAnalysis`
array in the JSON response body, and this array contains one element per image
processed.

Each of these per-image array elements contains an object with a single `persons`
attribute, which is itself an array of persons detected in that image. Each
persons array element contains an object with two attributes, `boundingBox` and
`attributes`. `boundingBox` is an object describing the sub-region of the image
containing this person, and `attributes` is an object describing the person
within the bounding box.

The bounding box is a normalized portion of the image represented by `x1` and `y1`,
which is the upper-left of the bounding box, and `x2` and `y2`, which is the 
lower-right of the bounding box. The full image is represented by `x1` = 0.0,
`y1` = 0.0, `x2` = 1.0, and `y2` = 1.0.

All bounding box coordinates are fractional values less than 1.

The following list of attributes is contained in the `attributes` object:

* `child` (`boolean`) – is the person a child
* `gender` (`enum`) – one of "male", "female", or "nonbinary"
* `wearingHardHat` (`boolean`) – is the person wearing a hard hat
* `highlyVisible` (`boolean`) – is the person wearing highly-visible clothing (e.g., construction vest)
* `hairColor` (array of `string`) – persons hair color
* `clothesUpperBody` (aray of `string`) – colors present on the persons upper-body
* `clothesLowerBody` (aray of `string`) – colors present on the persons lower-body
* `faceIndex` (`number`) - the index of the face in the face analysis result array
* `embedding` (array of `number`) - the embedding representing the person

The following is an example response to a persons analysis request for a single
image with two detected persons in the image:

```JSON
{
    "data": {
        "id": "ea41beff-7555-4a82-9aaa-57c080c1cae2",
        "type": "alarm-analysis",
        "attributes": {
            "analytics": {
                "resultSummary": "valid",
                "resultSummaries": {
                    "personAnalysis": {
                        "detectionResult": "valid"
                    }
                },                
                "personAnalysis": [
                    {
                        "persons": [
                            {
                                "boundingBox": {
                                    "x1": 0.62787,
                                    "y1": 0.44667,
                                    "x2": 0.68372,
                                    "y2": 0.74357
                                },
                                "faceIndex": -1,
                                "attributes": {
                                    "child": false,
                                    "gender": "male",
                                    "wearingHardHat": false,
                                    "highlyVisible": false,
                                    "hairColor": [
                                        "black"
                                    ],
                                    "clothesUpperBodyColor": [
                                        "blue"
                                    ],
                                    "clothesLowerBodyColor": [
                                        "white"
                                    ],
                                    "embedding": [
                                      0.0000,
                                      0.0000,
                                      0.0000
                                    ]
                                }
                            },
                            {
                                "boundingBox": {
                                    "x1": 0.29572,
                                    "y1": 0.4611,
                                    "x2": 0.35546,
                                    "y2": 0.62395
                                },
                                "faceIndex": 0,
                                "attributes": {
                                    "child": false,
                                    "gender": "female",
                                    "wearingHardHat": false,
                                    "highlyVisible": false,
                                    "hairColor": [
                                        "black"
                                    ],
                                    "clothesUpperBodyColor": [
                                        "blue"
                                    ],
                                    "clothesLowerBodyColor": []
                                }
                            }
                        ]
                    }
                ],
                "faceAnalysis": {
                  "paravisionVersion": 6,
                  "faces": [
                    [{
                      "acceptability": 0.9,
                      "quality": 0.9,
                      "box": {
                          "x1": 0.29972,
                          "y1": 0.4611,
                          "x2": 0.33546,
                          "y2": 0.50395
                      },
                      "embedding": [
                        0.0000,
                        0.0000,
                        0.0000,
                      ]
                    }]
                  ]
                }
            }
        }
    }
}
```

# Chip Analysis Response

For chip analysis, up to 6 JPEG images may be sent in a single request. Each
image should have been cropped in advance to contain only a single person.

## Response Properties

The result is returned in the`data.attributes.analytics.personAnalysis` array in
the JSON response body. Each image is independently analyzed.

This array contains one element per image processed. Each of these per-image
array elements contains an object with the following attributes:

* `child` (`boolean`) – is the person a child
* `gender` ('enum`) – one of "male", "female", or "nonbinary"
* `wearingHardHat` (`boolean`) – is the person wearing a hard hat
* `highlyVisible` (`boolean`) – is the person wearing highly-visible clothing (e.g., construction vest)
* `hairColor` (array of `string`) – persons hair color
* `clothesUpperBody` (array of `string`) – colors present on the persons upper-body
* `clothesLowerBody` (aray of `string`) – colors present on the persons lower-body
* `embedding` (array of `number`) - the embedding representing the person

Here's an example response to a person analysis request for three chip images:

```JSON
{
    "data": {
        "id": "66f50c9a-78a3-4d96-bb9a-451236bee813",
        "type": "alarm-analysis",
        "attributes": {
            "analytics": {
                "resultSummary": "valid",
                "personAnalysis": [
                    {
                        "child": false,
                        "gender": "male",
                        "wearingHardHat": false,
                        "highlyVisible": false,
                        "hairColor": [],
                        "clothesUpperBodyColor": [
                            "green"
                        ],
                        "clothesLowerBodyColor": [
                            "gray"
                        ],
                        "embedding": [
                          0.0000,
                          0.0000,
                          0.0000
                        ]
                    },
                    {
                        "child": false,
                        "gender": "male",
                        "wearingHardHat": false,
                        "highlyVisible": false,
                        "hairColor": [],
                        "clothesUpperBodyColor": [
                            "green"
                        ],
                        "clothesLowerBodyColor": [
                            "gray"
                        ],
                        "embedding": [
                          0.0000,
                          0.0000,
                          0.0000
                        ]
                    },
                    {
                        "child": false,
                        "gender": "male",
                        "wearingHardHat": false,
                        "highlyVisible": false,
                        "hairColor": [
                            "black"
                        ],
                        "clothesUpperBodyColor": [
                            "gray"
                        ],
                        "clothesLowerBodyColor": [],
                        "embedding": [
                          0.0000,
                          0.0000,
                          0.0000
                        ]
                    }
                ]
            }
        }
    }
}
```

