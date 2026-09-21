## 2025-05-18 - React.memo on Frequently Re-rendered Shared UI Components
**Learning:** Shared UI components like `SidebarItem` and `StatCard` in `src/components/Shared.tsx` re-render whenever high-frequency interval updates (such as the 5s `calculateSentinel` timer or neural state changes in `App`) trigger `setState` at the root component level.
**Action:** Wrap shared pure UI components with `React.memo` to skip render phase when props have not changed.
