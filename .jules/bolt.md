# Bolt's Journal - Critical Learnings

## 2025-05-20 - Unnecessary State Updates and Repeated Array Filtering
**Learning:** In large single-component React applications, deriving values inside `useEffect` or inside nested JSX maps (like `files.filter` per folder or `phiValue` updates on every keystroke) causes double re-renders and O(N*M) frame drops during user typing.
**Action:** Use `useMemo` to pre-group arrays into maps for O(1) lookups during render, and compute purely derived values inline with `useMemo` rather than triggering state updates inside `useEffect`.
