---
"@tum.ai/ui-kit": patch
---

On iPhone Safari, the bars above and below the open header menu now match the menu instead of staying brand black. While a fullscreen `DialogContent` is open, its backdrop takes the dialog's `tone` at 65 % and, with `shell.css`, the root canvas takes that tone too. These are the two things Safari tints its status bar and toolbar from. Both revert as soon as closing starts, so the closing fade is still the brand-black scrim. The popup now also carries `data-variant` (`modal` or `fullscreen`). On tablets, where the menu is a side sheet, the page behind it dims with the menu's tone.
