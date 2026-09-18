## 2025-05-18 - Decoupling interval sampling from state updates
**Learning:** Re-computing derived metrics like `phiValue` inside state-bound `useEffect` hooks recreates interval timers on every state update (e.g. note typing or model selection), causing unnecessary interval tear-down/setup and unintended rapid state updates.
**Action:** Use `React.useMemo` for derived metric calculations and a `useRef` to hold the latest value for periodic sampling `useEffect` hooks with empty dependency arrays.
