---
"@tum.ai/ui-kit": minor
---

Tighten the published types and docs under stricter TypeScript and lint rules. `DayRuler` has its TSDoc description again, and API reference links now name their target.

**Breaking (types only):** `LogoTileProps` no longer accepts `aspectRatio`. A tile never read it; only `LogoWall`'s `strip` layout does. Migration: remove `aspectRatio` from `<LogoTile>`, and keep it on the `LogoItem`s you pass to `LogoWall`.
