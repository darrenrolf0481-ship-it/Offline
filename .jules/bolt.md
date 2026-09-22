## 2025-05-18 - Decoupling React Interval Timers from High-Frequency State Updates

**Learning:** Including high-frequency React state dependencies (like `notes` updated per keystroke) in a `useEffect` interval dependency array causes the interval to tear down and re-run synchronously on every keystroke, forcing state updates (`setPhiHistory`) and heavy downstream re-renders (e.g. Recharts SVG charts).
**Action:** Use `useRef` to store latest state values for background interval calculations, keeping the `useEffect` interval dependency array empty so interval execution remains predictable and isolated from typing/editing events.
