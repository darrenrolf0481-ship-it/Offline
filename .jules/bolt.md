## 2025-05-18 - Synchronous Agency Agent Markdown Parsing Caching

**Learning:** Endpoint `/api/agency-agents` synchronously traversed the filesystem and parsed 129 markdown files using `gray-matter` on every request. This caused ~18ms-70ms latency per request and unneeded disk I/O. In-memory caching after initial load reduced subsequent request latencies to <0.01ms.

**Action:** Whenever serving static repository content or catalog assets, cache parsed structures in-memory on first fetch rather than performing synchronous disk reads per request.
