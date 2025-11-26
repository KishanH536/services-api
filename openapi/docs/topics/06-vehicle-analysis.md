*Vehicle analysis* provides information about license plates and vehicle attributes detected in images. It supports both chip and full-frame images. Vehicle attributes are returned in English and are meant to be displayed to a person (and not coded to).

For chip analysis, each image is assumed to have been pre-filtered to be either a vehicle or a license plate. Use the `/chips` endpoint.

For full-frame analysis, all vehicles and license plates in view are first detected then analyzed for their attributes. Use the `/alarms` endpoint.

# View Setup

To run the analysis, the `features` property of the view must contain the `vehicleAnalysis` property. Additionally, if processing chips, you have to tell the platform what kind of chip you are sending:
- For license plate chips, the `chipsType` attribute should be set to `plates`
- For vehicle attribute chips, the `chipsType` attribute should be set to `vehicles`

Here's an example of how to configure the view for vehicle attribute chip processing:
```JSON
{
    "displayName": "Alley Door",
    "features": {
        "vehicleAnalysis": { "chipsType": "vehicles" }
    }
}
```

If you are only requesting full-frame analysis, the feature can be configured this way (you can still pass the `chipsType` property but it will be ignored):
```JSON
{
    "displayName": "Alley Door",
    "features": {
        "vehicleAnalysis": {}
    }
}
```

Note that the company to which the View belongs must be setup with the `vehicle_analytics` capability to be able to configure Views for vehicle analysis. See "Tenant Management" section
of the API documentation for details.

# Chip Analysis Response

For chip analysis, you can send up to 6 JPEG images in a single request. Each image should have been cropped in advance to contain only a single vehicle or plate. The result is returned in the `data.attributes.analytics.vehicleAnalysis` array in the JSON response body. Each image is independently analyzed.

This array contains one element per image processed. The results will either be
all vehicles or all plates depending on the View configuration. Each of these
per-image array elements contains an object with the following attributes:

* For `vehicles`
  * `vehicleType` (`string`) – type of vehicle
  * `color` (array of `string`) – colors detected for the vehicle
  * `makeModel` (`string`) – make and model of the vehicle
* For `plates`
  * `quality` (`string`) – quality of plate, either "readable" or "unreadable"
  * `text` (`string`) – the text of the plate
  * `state` (`string`) – the issuing state of the plate

Here's an example response to a license plate analysis request for two chip images:

```JSON
{
    "data": {
        "id": "1b0717bd-5e18-43c3-ae9f-e7ba5d895ad6",
        "type": "alarm-analysis",
        "attributes": {
            "analytics": {
                "resultSummary": "valid",
                "vehicleAnalysis": {
                    "plates": [
                        {
                            "quality": "readable",
                            "text": "2U4355",
                            "state": "SD"
                        },
                        {
                            "quality": "readable",
                            "text": "6XSU832",
                            "state": "VT"
                        }
                    ]
                }
            }
        }
    }
}
```


## Full-Frame Analysis Response

For full-frame analysis, you can send up to 6 JPEG images in a single request, and
the minumum size of the images is 320x240. The result is returned in the
`data.attributes.analytics.vehicleAnalysis` array in the JSON response body.

This array contains one element per image processed. Each of these per-image
array elements contains an object with `vehicles` and `plates` attributes, which
are themselves arrays of vehicles and plates detected in that image respectively.
Each `vehicles` and `plates` array element contains a bounding box and the
following list of attributes:

* For `vehicles`
  * `objectLabel` (`string`) – label of the object detected
  * `attributes` (`object`) – contains detected vehicle attributes
    * `vehicleType` (`string`) – type of vehicle
    * `color` (array of `string`) – colors detected for the vehicle
    * `makeModel` (`string`) – make and model of the vehicle
* For `plates`
  * `vehicleId` (`int`) – the (zero-based) index of the vehicle in the vehicles array associated with this plate
  * `attributes` (`object`) – contains detected license plate attributes
    * `quality` (`string`) – quality of plate, either "readable" or "unreadable"
    * `text` (`string`) – the text of the plate
    * `state` (`string`) – the issuing state of the plate

The following is an example response to a vehicle analysis request for a single
image with one vehicle and one plate in the image.

```JSON
{
    "data": {
        "id": "1d23526d-c7ee-471d-9c7d-417c80d09ca7",
        "type": "alarm-analysis",
        "attributes": {
            "analytics": {
                "resultSummary": "valid",
                "resultSummaries": {
                    "vehicleAnalysis": {
                        "detectionResult": "valid"
                    }
                },
                "vehicleAnalysis": [
                    {
                        "vehicles": [
                            {
                                "boundingBox": {
                                    "x1": 0.01698,
                                    "y1": 0.54844,
                                    "x2": 0.36779,
                                    "y2": 0.93047
                                },
                                "objectLabel": "car",
                                "attributes": {
                                    "vehicleType": "sedan",
                                    "makeModel": "Tesla Model X",
                                    "color": [
                                        "white"
                                    ]
                                }
                            }
                        ],
                        "plates": [
                            {
                                "boundingBox": {
                                    "x1": 0.07858,
                                    "y1": 0.69219,
                                    "x2": 0.13717,
                                    "y2": 0.75
                                },
                                "attributes": {
                                    "quality": "readable",
                                    "text": "1BUBALE",
                                    "state": "WA"
                                },
                                "vehicleId": 0
                            }
                        ]
                    }
                ]
            }
        }
    }
}
```

