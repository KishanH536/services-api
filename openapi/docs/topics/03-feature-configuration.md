A company may only assign features to views that are provided by the capabilities granted to it. For example, you are not allowed to assign the `vehicleAnalytics` feature to a view if the company token you're using does not have the `vehicle_analytics` capability assigned to it (via the tenant management API). See the capabilities catalog for how each capability
maps to one or more features. (Generally speaking, one capability maps to one feature, but that is not always the case.)

# Capabilities Catalog

Here is a list of capabilities and the corresponding features each capability unlocks. The names in the table are the names defined in the API.

| Capability                  | Feature                               |
| --------------------------- | ------------------------------------- |
| `detect_face`               | `advancedRules.faceDetection`         |
| `detect_gun`                | `advancedRules.gunDetection`          |
| `forensic_search`           | `forensic`                            |
| `detect_scene_change`       | `sceneChangeDetection`                |
| `vehicle_analytics`         | `vehicleAnalysis`                     |
| `person_analytics`          | `personAnalysis`                      |
| `multiple_risk_analysis`    | `multipleRiskAnalysis`                |
| `scene_classification`      | `sceneClassification`                 |

Attempting to add a feature to a view when the company's capability that provides the feature is not present will result in a `403 Forbidden` response from the API.

# Configure a View with Features

Send a `PUT` request to the view resource endpoint you want to configure whose body has the `features` property. (You can also do this with a `POST` request if you are creating the view for the first time using a platform-style endpoint). Only the features that you explicitly list/send in the features property will be enabled, and any previous configuration on the view will be replaced with what you send.

> info
> Note that `displayName` is always required.

For example, to enable only scene change detection for this view, send:

```JSON
{
    "displayName": "Alley Door",
    "features": {
        "sceneChangeDetection": {}
    }
}
```

To enable person analysis, vehicle analysis, and scene change for this view, send:

```JSON
{
    "displayName": "Alley Door",
    "features": {
        "personAnalysis": {},
        "vehicleAnalysis": {},
        "sceneChangeDetection": {}
    }
}
```

To turn off all analytics (without deleting the view), send:

```JSON
{
    "displayName": "Alley Door",
    "features": {}
}
```

# Feature Defaults

The default configuration for a view (when the `features` property is absent) is to enable object detection for both people and vehicles.

The following three view configurations, therefore, are equivalent:

```JSON
{
    "displayName": "Alley Door",
}
```

```JSON
{
    "displayName": "Alley Door",
    "features": {
        "objectDetection": {}
    }
}
```

```JSON
{
    "displayName": "Alley Door",
    "features": {
        "objectDetection": {
            "humanDetection": true,
            "vehicleDetection": true
        }
    }
}
```

> warn
> Unfortunately, due to the nature of ever-evolving APIs and their software legacies, these defaults no longer make sense for MCAP integration partners to use, as the `objectDetection` feature is not available. Attempting to use it will result in a runtime error. Instead, use the respective `personAnalysis` and/or `vehicleAnalysis` features.

# Summary

There are many ways to configure features on a view, but:
- what you pass in the `features` property enables those features and disables all others,
- including `"features": {}` turns off all analytics for that view, and
- there are some defaults in every type of feature.