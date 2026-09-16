## 2025-05-18 - Response caching for synchronous file parsing endpoints
**Learning:** Endpoints like `/api/agency-agents` that parse markdown files synchronously with `gray-matter` block the event loop and incur repeated I/O costs on every request. Caching parsed objects in memory reduces response times from ~14ms to <0.01ms.
**Action:** Always check server endpoints that parse local repository files or run heavy file I/O synchronously, and introduce in-memory caching where appropriate.
