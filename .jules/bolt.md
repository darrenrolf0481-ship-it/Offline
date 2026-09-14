## 2025-05-18 - Component Memoization in Monolithic React Hubs
**Learning:** Shared UI components (`SidebarItem`, `StatCard`) in monolithic React apps re-render on every state change (e.g. typing in inputs or timer ticks) unless memoized with `React.memo`.
**Action:** Wrap purely presentational shared components in `React.memo` to prevent redundant DOM re-renders across state updates.
