## 2025-03-29 - Fixed Interval Effect Teardown and Keystroke Churn

**Learning:** Interval-based metrics driven by state dependencies in `useEffect` can be torn down and executed on every single keystroke, pushing duplicate data points and triggering redundant component re-renders.

**Action:** Use `useMemo` for derived metric calculations and `useRef` to supply latest state values to stable `setInterval` callbacks.
