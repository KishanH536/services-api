---
stoplight-id: d7v1s3ru7opha
---

*Gun Detection* provides information about whether or not there is a gun being held by a person in the chips passed in the request. The result indicates the presence of a brandished gun or not, and is spelled out in detail in the API spec. Since gun detection is a chip analysis, each image is assumed to have been pre-filtered to contain a crop of a person potentially in posession of a brandished gun. Chips will be checked by the service to make sure they are of a minumum acceptable size for accurate analysis. These size restrictions are specified in the API spec.

# View Setup

To run the analysis, the `features` property of the view must contain the `gunDetection` attribute along with a `name` and `integratorId` in the `features.advancedRules` property of the view's attributes. The `integratorId` attribute of the gun chips advanced rule is simply a name chosen by the client to refer to this rule.

Here's an example of how to configure the view for gun detection chip processing:
```JSON
{
    "displayName": "Gun Chips Test",
    "features": {
        "advancedRules": [
            {
                "integratorId": "xyz",
                "name": "gun rule",
                "gunDetection": {}
            }
        ]
    }
}
```

Note that the company to which the View belongs must be setup with the `detect_gun` capability to be able to configure Views for gun detection. See "Tenant Management" section
of the API documentation for details.

# Chip Analysis Response

For chip analysis, you can send up to 6 JPEG images in a single request. Each image should have been cropped in advance to contain only a single instance of a person. The result is returned in the `data.attributes.analytics.gunDetection` object in the JSON response body. If multiple images are sent, the result is an aggregate, indicating that at least one of the images shows a person brandishing a gun. The result is a boolean `isGun` in the `data.attributes.analytics.gunDetection` object. A `true` value for `isGun` indicates that one or more of the chip images sent contains a gun.

Here's an example response to a gun detection request:

```JSON
{
    "data": {
        "id": "01983e12-0ec6-72d1-96e7-9a6776b2d90d",
        "type": "alarm-analysis",
        "attributes": {
            "analytics": {
                "resultSummary": "valid",
                "gunDetection": {
                    "isGun": true
                }
            }
        }
    }
}
```




