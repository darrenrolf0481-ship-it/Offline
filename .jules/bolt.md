## 2025-05-18 - Synchronous File Parsing in API Route Handlers

**Learning:** Endpoints like `/api/agency-agents` synchronously traversed 120+ markdown files on disk and parsed YAML frontmatter with `gray-matter` on every request. This caused ~38ms of synchronous event loop blocking per request.
**Action:** Always cache static file parsing in memory for backend API endpoints that read local repository content on every invocation.
