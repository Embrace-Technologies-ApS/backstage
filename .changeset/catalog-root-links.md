---
'@backstage/integration': patch
---

Fixed root-relative links, such as `/catalog-info.yaml`, resolving to the wrong location when the file they are relative to has spaces, `#` or accented characters in its path. They now resolve to the repository root.
