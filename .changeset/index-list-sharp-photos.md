---
"@tum.ai/ui-kit": patch
---

`IndexList` photos are no longer soft. The sticky preview (4:5) and the thumbnail (square) crop a landscape photo with `object-cover`, so it draws wider than the frame, but `sizes` named only the frame width and the browser fetched too small a file. A 3:2 photo in the preview now asks for about 1.9 times the frame width. Pass the photo's `width` and `height` on `image` to size it to its own aspect ratio; without them a 3:2 landscape is assumed.
