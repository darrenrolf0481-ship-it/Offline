## 2025-05-18 - Agency Agents Endpoint Synchronous Disk I/O Caching

**Learning:** `/api/agency-agents` synchronously scans directories, reads 89+ markdown files, and parses YAML frontmatter using `gray-matter` on every HTTP GET request. This blocked the Node.js event loop for ~40ms per request.

**Action:** Cache parsed agency agents in memory (`agencyAgentsCache`) on initial load to serve subsequent requests in <0.1ms without disk reads.
