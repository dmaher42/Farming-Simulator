## 2025-12-20 - [Keyboard Accessibility for Grid Games]
**Learning:** Custom interactive grids (like farm plots using `div`) are completely invisible to keyboard users without `tabindex="0"` and `role="button"`. Adding these attributes plus a simple `keydown` listener for Enter/Space instantly makes the core loop accessible without changing the visual design.
**Action:** When creating custom interactive elements that aren't native buttons, always add `tabindex="0"`, `role="button"`, and key listeners immediately.
