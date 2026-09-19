## 2025-02-23 - Workspace Explorer Array Filtering Bottleneck
**Learning:** Rendering flat lists of files in nested React components using `.filter(file => file.folderId === folder.id)` causes $O(N_{folders} \times N_{files})$ array scans on every render frame.
**Action:** Pre-group files by `folderId` into a `Map<string | null, VFile[]>` using `useMemo` for $O(1)$ lookups per folder during render.
