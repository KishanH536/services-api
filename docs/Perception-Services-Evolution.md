# Perception Services: Overview of Changes to the API

## Summary

This document outlines key differences between [**Perception Services**](openapi/perception.json) (specifically designed for MCAP) and [**Platform Services**](openapi/index.json) (originally built to support Calipsa adapters). **Perception Services** is the next major release of this API (version 2.x) and is intended to bring clarity and simplicity to MCAP integration partners.


| Aspect | Perception Services | Platform Services (legacy) |
|--------|----|----|
| **Version** | 2.x | 1.x |
| **Focus** | On-demand analysis | Resource configuration and analysis |
| **Endpoint Style** | Bring-your-own IDs only | Platform-issued and bring-your-own IDs |
| **File** | `openapi/perception.json` | `openapi/index.json` |
| **Base Context Path** | `/perception` | `/services` |


---

## 1. Key Changes

### Single-step Analysis Workflow

In **Perception Services**, all analysis configuration and context is provided in each request; there is no prerequisite setup step for view configuration. This differs from **Platform Services** which required the view to be configured in a separate, preliminary step before requesting analysis.

### Consolidated Analysis Endpoints

Perception Services has **two main analysis endpoints**:

**`POST /analyzer/frames`** for full-frame analysis. This replaces:
- `POST /views/{viewId}/alarms`
- `POST /integrator/views/{cameraIntegratorId}/alarms`
- `POST /integrator/views/{cameraIntegratorId}/analyses`

**`POST /analyzer/chips`** for chip analysis. This replaces:
- `POST /views/{viewId}/chips`
- `POST /integrator/views/{cameraIntegratorId}/chips`

### Terminology Changes
The following terms replace older ones:


| Perception Services | Platform Services (legacy) |
|----|----|
| *analysis* | analysis, alarm (used interchangeably) |
| *view* | camera, view, camera view |
| *project* | client |
| *external ID* | integrator-style ID, bring-your-own ID |

Therefore:
- `clientIntegratorId` becomes `projectExternalId`
- `siteIntegratorId` becomes `siteExternalId`
- `cameraIntegratorId` becomes `viewExternalId`

---

## 2. Detailed Payload Changes

### Context Object

Perception Services introduces a new [`AnalysisContext`](../openapi/schemas/v2/AnalysisContext.json) object. It provides a way for the service to associate integration-partner-supplied metadata with the analysis. Unlike in Platform Services, these IDs are not used to look up configuration.

The following pseudo-JSON illustrates what this object can look like:
```json
{
  "projectExternalId": "string",    // required, 100-character max
  "siteExternalId": "string",       // required, 100-character max
  "viewExternalId": "string",       // required, 100-character max
  "daysToRetainData": 0-30          // required (0 = no storage)
}
```

### Full-Frame Analysis Requests

 #### Workflow
 
 The `analytics` object (defined in [`FullFrameAnalysisOptions`](../openapi/schemas/v2/FullFrameAnalysisOptions.json)) tells the service which analyses to perform, overriding any configuration that might have been defined for this view using the old API. Both `analytics` and `context` are required for analysis requests.

The following example instructs the service to perform vehicle analysis, person analysis, and scene change detection on the images provided/referenced in the request.
```json
{
    "analytics": {
        "vehicleAnalysis": {},
        "personAnalysis": {},
        "sceneChangeDetection": {
            "referenceUrls": [
                "https://example.com/image5/daytime-ref",
                "https://example.com/image5/nighttime-ref"
            ]
        }
    },
    "context": {
        "projectExternalId": "Default Project",
        "siteExternalId": "HQ",
        "viewExternalId": "Alleyway 5",
        "daysToRetainData": 7
    }
}
```

#### Platform Services workflow (legacy)

To achieve the same result using the old API, an integration partner would need to complete the following three steps:

1. Configure the company with desired capabilities and a 7-day retention policy (since the default retention is not 7 days):
```json
{
    "displayName": "My Example Company",
    "daysToRetainData": 7,
    "capabilities": [
        "detect_scene_change",
        "vehicle_analytics",
        "person_analytics"
    ]
}
```

2. Configure the target view for that company:
```json
{
    "features": {
        "vehicleAnalysis": {},
        "personAnalysis": {},
        "sceneChangeDetection": {}
    }
}
```
3. Perform scene change detection (along with vehicle and person analysis) by attaching an `options` part (defined in [`AlarmOptions`](../openapi/schemas/AlarmOptions.json)) to the request body:
```json
{
    "performSceneChangeDetection": true,
    "sceneChangeReferenceUrls": [
        "https://example.com/image5/daytime-ref",
        "https://example.com/image5/nighttime-ref"
    ]
}
```

#### Key differences in Perception Services

- There is only one endpoint that can be called to perform a full-frame analysis.
- It now requires both a `FullFrameAnalysisOptions` object and an `AnalysisContext` object.

### Chip Analysis Requests

#### Workflow

The `type` object (defined in [`ChipAnalysisOptions`](../openapi/schemas/v2/ChipAnalysisOptions.json)) describes the nature of the chip itself rather than what analyses to perform, therefore requiring exactly one property specifying which type. Both `type` and `context` are required for analysis requests.

The following example indicates that the chip provided is a face chip:
```json
{
  "type": {
    "face": {}
  },
  "context": {
    "projectExternalId": "Default Project",
    "siteExternalId": "HQ",
    "viewExternalId": "Entry Camera 1",
    "daysToRetainData": 7
  }
}
```

#### Platform Services workflow (legacy)

To achieve the same result using the old API, an integration partner would need to complete the following three steps:

1. Configure the company with desired capabilities and a 7-day retention policy (since the default retention is not 7 days):
```json
{
    "displayName": "My Example Company",
    "daysToRetainData": 7,
    "capabilities": [
        "detect_face"
    ]
}
```

2. Configure the target view for that company:
```json
{
    "features": {
        "faceDetection": {}
    }
}
```

3. Send the chip to the analysis endpoint. No options were provided in the request body (defined in [`ChipsOptions`](../openapi/schemas/ChipsOptions.json)), as all configuration was retrieved from the view.

#### Key differences in Perception Services

- It now requires both a `ChipAnalysisOptions` object and an `AnalysisContext` object.
- **oneOf constraint**: Exactly one chip type must be specified.
- `lpr` is now distinct from `vehicle` (previously both were under `vehicleAnalysis` with a `chipsType` discriminator).


---

## 3. Other Notable Changes

### Response Structure
- **Mostly unchanged**: Perception Services uses the same `AlarmAnalysis.json` and `ChipAnalysis.json` schemas as Platform Services. This lets integration partners transition seamlessly between the old API and the new one.
- Analytics included in response still depend on what was requested.
- The JSON:API type used in the response object is still `alarm-analysis`, even though the term *alarm* isn't used elsewhere in Perception Services.

### Authentication
- **New token type**: `IntegrationPartnerTokenWithTenantId`
  - Uses `X-Tenant-Integrator-ID` header
  - Creates company automatically if not exists
  - Allows analytics without pre-creating company

### Image Limits
- **Full-frame**: 8 images in Perception Services (was 6 in Platform Services)
- **Chips**: 8 images in Perception Services (was 6 via form, 8 via URLs in Platform Services)
- Minimum dimensions are unchanged (320x240 for frames, varies for chips)

### Error Responses
- Perception Services adds explicit `401 (Unauthorized)`, `500 (Internal Server Error)`, and `503 (Service Unavailable)` responses in its API definition.
- JSON:API is still the main response content type being returned: `application/vnd.api+json`

### Tenant Management
- **Perception Services**: Companies are the only managed resources.
  - It can still support capabilities and data retention configuration, but:
  - all company configuration is now optional if integration partners use the token issued them directly in conjunction with the `X-Tenant-Integrator-ID` header.
- **Platform Services (legacy)**: Full 3-level hierarchy (clients → sites → views resources) with separate, always required tenant management step.


---

## 4. Migration Guide

### Test Workflow Comparison

**Perception Services:**
```
1. Create company → 2. Analyze (config in request)
```

**Platform Services (legacy):**
```
1. Create client → 2. Create site → 3. Create view → 4. Configure view → 5. Analyze
```

### Request Construction

**Perception Services:**
```http
POST /perception/analyzer/frames
Content-Type: multipart/form-data

options: {
  "analytics": { "vehicleAnalysis": {}, "personAnalysis": {} },
  "context": {
    "projectExternalId": "project1",
    "siteExternalId": "site1",
    "viewExternalId": "camera1",
    "daysToRetainData": 30
  }
}
images: [binary, binary, ...]
```

**Platform Services (legacy):**
```http
POST /services/views/{viewId}/alarms
Content-Type: multipart/form-data

options: { "performSceneChangeDetection": true }
alarmImages: [binary, binary, ...]
```

### Testing Considerations

1. **Context Validation**: Test missing/invalid context fields → 400
2. **Analytics Selection**: 
   - Full-frame: Multiple analytics simultaneously
   - Chips: Exactly one analytics type (oneOf constraint)
3. **Company Management**: Test creation, updates, auto-provisioning
4. **Results Retrieval**: Query by time range, retrieve by ID, add annotations
5. **Image Limits**: Test 1-8 images for full-frame
6. **Data Retention**: Test `daysToRetainData` = 0 (no storage) vs 30 (max)

### Response Validation

Validate: requested analytics present, non-requested absent, retention per `daysToRetainData`

---

## 5. Known Issues / Notes

1. **Response type**: Both chip and full-frame responses use type `"alarm-analysis"` even though "alarm" terminology being deprecated
2. **Scene change**: In Perception Services part of analytics selection; in Platform Services (legacy) part of options

---

## 6. Appendix: Request/Response Examples

### Example 1: Full-Frame Analysis with Multiple Analytics

**Request:**
```http
POST /perception/analyzer/frames HTTP/1.1
Host: api.mcap-us-01.motorolasolutions.com
Authorization: Bearer {CompanyToken}
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary

------WebKitFormBoundary
Content-Disposition: form-data; name="options"
Content-Type: application/json

{
  "analytics": {
    "vehicleAnalysis": {},
    "personAnalysis": {},
    "faceDetection": {}
  },
  "context": {
    "projectExternalId": "Default Project",
    "siteExternalId": "HQ",
    "viewExternalId": "Parking Lot Camera 3",
    "daysToRetainData": 30
  }
}
------WebKitFormBoundary
Content-Disposition: form-data; name="images"; filename="frame1.jpg"
Content-Type: image/jpeg

<binary image data>
------WebKitFormBoundary--
```

**Response:**
```json
{
  "data": {
    "id": "a7f23e1c-9b4d-4f5a-8c2e-1d3f5a6b7c8d",
    "type": "alarm-analysis",
    "attributes": {
      "analytics": {
        "resultSummary": "valid",
        "resultSummaries": {
          "vehicleAnalysis": "valid",
          "personAnalysis": "valid",
          "faceDetection": "not_valid"
        },
        "objectDetection": { "boundingBoxes": [...] },
        "vehicleAnalysis": [{ "vehicles": [...], "plates": [] }],
        "personAnalysis": [{ "persons": [...] }],
        "faceAnalysis": { "paravisionVersion": "6", "faces": [[]] }
      }
    }
  },
  "links": {
    "http://calipsa.io/relation/originalimages": "https://..."
  }
}
```

### Example 2: Chip Analysis (Face)

**Request:**
```http
POST /perception/analyzer/chips HTTP/1.1
Authorization: Bearer {CompanyToken}
Content-Type: multipart/form-data

options: {
  "type": { "face": {} },
  "context": {
    "projectExternalId": "Default Project",
    "siteExternalId": "HQ",
    "viewExternalId": "Entry Camera 1",
    "daysToRetainData": 30
  }
}
images: [binary data]
```

**Response:**
```json
{
  "data": {
    "id": "b8e34f2d-0c5e-5g6b-9d3f-2e4g6b7d8e9f",
    "type": "alarm-analysis",
    "attributes": {
      "analytics": {
        "resultSummary": "valid",
        "faceDetection": {
          "paravisionVersion": "6",
          "faces": [[{ "acceptability": 0.95, "quality": 0.87, ... }]]
        }
      }
    }
  }
}
```

### Example 3: Company Creation

**Request:**
```http
POST /perception/companies HTTP/1.1
Authorization: Bearer {IntegrationPartnerToken}
Content-Type: application/json

{
  "displayName": "Acme Security Corp",
  "capabilities": ["detect_face", "detect_vehicle", "detect_person"],
  "daysToRetainData": 30
}
```

**Response:**
```json
{
  "data": {
    "id": "c9f45g3e-1d6f-6h7c-0e4g-3f5h7c8f9g0h",
    "type": "company",
    "attributes": {
      "displayName": "Acme Security Corp",
      "capabilities": ["detect_face", "detect_vehicle", "detect_person"],
      "daysToRetainData": 30
    },
    "relationships": {
      "token": { "data": { "type": "token", "id": "..." } }
    }
  },
  "included": [{
    "type": "token",
    "id": "...",
    "attributes": { "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." }
  }]
}
```

---

**Document Version**: 2.1  
**Last Updated**: 2025-10-24  
**Source Branch**: `jonathan/api-20-exploration`  
**Comparison**: Platform Services (origin/main) vs Perception Services (current branch)

**Changelog**:
- v2.1 (2025-10-24): Enhanced request payload examples to show full workflow comparison
  - Added dedicated Context Object section
  - Restructured Full-Frame and Chip Analysis sections with workflow subsections
  - Added complete 3-step Platform Services workflow examples (company config, view config, analysis)
  - Updated ChipAnalysisOptions examples to use `"type"` field (schema change)
  - Standardized section styling for consistency
- v2.0 (2025-10-23): Major restructure for conciseness - reduced from 14 sections to 6
- v1.1 (2025-10-23): Removed reference to `viewExternalId` typo (fixed in schema)
- v1.0 (2025-10-22): Initial version
