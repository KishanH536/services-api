# Details about Data Formats

Here are some details about common data formats you'll see throughout the API. Sometimes their allowed values are difficult (or even impossible) to express using syntax validation alone, so we thought it would help to explain it here.

## Formats

Properties that refer to specific points in time (`date-time`) are compliant with [RFC-3339](https://www.rfc-editor.org/rfc/rfc3339).

## Time zones

Properties which represent time zones are documented in the [IANA Time Zone Database](https://www.iana.org/time-zones). Examples include:

- `America/New_York`
- `Europe/London`
