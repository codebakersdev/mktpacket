## mktpacket - v0.8.28

`mktpacket` is a JavaScript utility for collecting and managing various types of data from a web page. This script offers a comprehensive set of features for capturing page, client, user, and marketing data, as well as integrating with third-party services like Google Analytics and OneTrust.

To navigate thru the data, access mktpacket.data object.

### Features

- **Page Data Collection**:
  - **Page Load Time**: Measures and records the time it takes for the page to load.
  - **Page Status**: Captures the HTTP status code of the page.
  - **Page URL and Title**: Stores the current page URL and title.
  - **Page Language**: Detects and records the language of the page.
  - **Page Referrer**: Tracks and saves the referring URL, with persistent storage across sessions.
  - **Page Parameters**: Collects and stores query parameters from the page URL.
  - **Page Colors**: Analyzes and counts unique colors used on the page.

- **Client Data Collection**:
  - **Device Detection**: Identifies if the client device is a touchscreen or mobile device.
  - **Platform Identification**: Detects the client’s operating system (e.g., Android, iOS, Windows).
  - **Browser Detection**: Identifies the browser being used by the client.
  - **Browser Language**: Captures the language settings of the client’s browser.
  - **Timezone Detection**: Records the client’s timezone.

- **User Data Collection**:
  - **Bot Detection**: Identifies whether the user is a bot based on various criteria.
  - **Adblock Detection**: Detects if the user has an adblocker enabled.
  - **First Page Tracking**: Stores and tracks the first page visited globally and within the current session.

- **Marketing Data Collection**:
  - **Ad Click Tracking**: Detects and records advertising click identifiers (e.g., `gclid`, `fbclid`).
  - **AB Tasty Integration**: Retrieves and stores A/B testing data if AB Tasty is present on the page.

- **Integration with Google Analytics**:
  - **Client ID & Session ID**: Retrieves and stores the Google Analytics Client ID and Session ID if `gtag` is used.

- **OneTrust Integration**:
  - **Consent Management**: Collects data from OneTrust’s consent management if available.

- **API Integration**:
  - **User IP Retrieval**: Retrieves the user’s IP address via a custom API.
  - **Unique User ID**: Retrieves and stores a unique user ID with persistent storage.

- **Observer Functions**:
  - **URL Change Observer**: Tracks and responds to changes in the page URL dynamically.
  - **Google Tag Observer**: Monitors and triggers actions when Google Tag (`gtag`) becomes available.

- **Auxiliary Functions**:
  - **Data Merge**: Merges API response data with existing data structures.
  - **Event Triggering**: Pushes custom events (`mktpacket_ready`) to the data layer.

### License

This project is licensed under a Custom License. Please see the [LICENSE](LICENSE) file for more details.

## Installation

To use this script, simply include it in your project:

```html
<script src="https://cdn.jsdelivr.net/gh/codebakers/mktpacket@master/main.js" key="free-version" gtag=""></script>
