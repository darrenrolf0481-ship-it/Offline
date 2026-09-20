## 2025-05-18 - Agency Agents API In-Memory Caching

**Learning:** Parsing 129 Markdown files with `gray-matter` synchronously on every `/api/agency-agents` HTTP request blocks the Express event loop for ~37ms per request. In-memory TTL caching reduces endpoint latency to <0.1ms (>99% latency reduction) while preventing event loop blocking and unnecessary disk I/O.
**Action:** Always check backend endpoints that read local file systems for opportunities to apply TTL-based in-memory caching.
