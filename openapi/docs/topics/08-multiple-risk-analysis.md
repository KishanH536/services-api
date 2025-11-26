*Mutiple risk analysis* examines full-frame images and determines whether there are any
security risks or environmental hazards present.

# View Setup

To run the analysis, the `features` property of the view must contain the `multipleRiskAnalysis` property.

Here's an example of how to configure the view:
```JSON
{
    "displayName": "Alley Door",
    "features": {
        "multipleRiskAnalysis": {}
    }
}
```

## Response

Up to 6 JPEG images may be sent in a single request, and the minumum size of the images is 320x240.
The result is returned in the `data.attributes.analytics.multipleRiskAnalysis` section. The service
will collectively determine if any security risks or environmental hazards were detected in any of the images,
along with a description of the images.

The service can return `valid`, `not_valid`, or `not_performed` in any of the following fields:

- `data.attributes.analytics.multipleRiskAnalysis.securityRisks`: if a security risk was detected
- `data.attributes.analytics.multipleRiskAnalysis.environmentalHazards`: if an environmental hazard was detected
- `data.attributes.analytics.multipleRiskAnalysis.riskDetected`: if any risks were detected
- `data.attributes.analytics.resultSummaries.multipleRiskAnalysis.detectionResult`: valid if any risks were detected
- `data.attributes.analytics.resultSummary`: valid if any analyses returned `valid` (multiple types of analyses can be run in parallel)

The following is an example response to an image that was submitted with a single backpack left unattended on a counter.
It was deemed to be a security risk but not an environmental hazard.

```JSON
{
    "data": {
        "id": "01972343-dcc1-7379-a098-87df02e8bebe",
        "type": "alarm-analysis",
        "attributes": {
            "analytics": {
                "resultSummary": "valid",
                "resultSummaries": {
                    "multipleRiskAnalysis": {
                        "detectionResult": "valid"
                    }
                },
                "multipleRiskAnalysis": {
                    "riskDetected": "valid",
                    "securityRisks": {
                        "risk": "valid",
                        "description": "A black backpack is left unattended on the counter.",
                        "categories": {
                            "unattendedBaggage": {}
                    },
                    "environmentalHazards": {
                        "hazard": "not_valid",
                        "description": "No environmental hazards were detected."
                    }
                }
            }
        }
    }
}
```
