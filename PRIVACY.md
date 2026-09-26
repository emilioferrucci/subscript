# Privacy — Subscript 0.1.0

Subscript operates only on `https://chatgpt.com/*`. It inspects the prompt
editor's text replacements and formatting marks in page memory to identify
automatic underscore-to-italic conversions. It does not persist prompt text,
copy conversations, record browsing history, or collect or transmit telemetry.
There are no runtime network requests, remote services, or external runtime
dependencies. No storage permission is requested.

The page-world guard accesses the editor controller through its owning React
component and wraps the editor's transaction dispatch. The isolated status
script sends only composer attachment states to the extension popup, not text.
Page-world code can be interfered with by the website; this extension is a
usability tool, not a security boundary.

The manifest declares no data collection. Its ChatGPT host permission is needed
to run the guard and query its status. These statements describe this source
version only. They do not make ChatGPT, Firefox, other extensions, or modified
copies private, and are not an independent security audit.

If reporting an issue, use invented sample text and reproduction steps. Do not
publish private chats, account details, cookies, tokens, or other sensitive data.
See the [README disclaimers](README.md#disclaimers--read-before-installing) and
[MIT license](LICENSE).
