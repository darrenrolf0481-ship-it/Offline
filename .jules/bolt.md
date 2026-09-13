## 2025-05-18 - Memoizing Component Callbacks with React.memo
**Learning:** Avoid custom comparators on React.memo components that omit function props like `onClick`, as it causes stale closure bugs when parent state changes. Default shallow comparison is safer.
**Action:** When wrapping components in React.memo, use standard shallow comparison or ensure all callbacks/props are properly compared.
