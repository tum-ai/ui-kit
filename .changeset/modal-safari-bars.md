---
"@tum.ai/ui-kit": patch
---

Dialog: a modal dialog no longer uses fixed layers. Its portal is absolute at the scroll position the dialog opened at, so iPhone Safari keeps its status bar and toolbar translucent over the dimmed page instead of painting them near black.
