## 2025-05-10 - Agency Agents In-Memory Caching
**Learning:** Parsing ~89 Markdown agency agent files with gray-matter synchronously on every request to `/api/agency-agents` slows endpoint latency. Caching the parsed array in memory eliminates repeated file system scans.
**Action:** Always store static or rarely-changing file system metadata in an in-memory cache on express backend endpoints.
