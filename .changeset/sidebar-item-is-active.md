---
'@backstage/core-components': patch
---

Added an optional `isActive` prop to `SidebarItem` and `SidebarSubmenuItem`. When set, it decides whether the item is highlighted, so sidebar shortcuts that share a path but differ by query string can highlight independently. When omitted, items keep highlighting by route match as before.
