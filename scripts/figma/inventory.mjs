/**
 * A Figma specimen is a named, authored story state, not a Cartesian product
 * of every export, tone and screenshot viewport. Shared composite exports map
 * to the same specimen. Responsive stories keep their explicitly authored size.
 */
export function buildCaptureInventory(manifest, { storyIds, width = 1440 } = {}) {
  const byId = new Map();
  for (const entry of manifest.entries ?? []) {
    if (!entry.runtime || entry.nonvisual) continue;
    for (const story of entry.stories ?? []) {
      if (!byId.has(story.id)) byId.set(story.id, { ...story, exports: [], kind: "component" });
      byId.get(story.id).exports.push(entry.identity);
    }
  }
  for (const story of manifest.pages ?? []) {
    if (!byId.has(story.id)) byId.set(story.id, { ...story, exports: [], kind: "example" });
  }
  const requested = storyIds ? new Set(storyIds) : null;
  if (requested) {
    const missing = [...requested].filter((id) => !byId.has(id));
    if (missing.length) throw new Error(`Unknown Figma story IDs: ${missing.join(", ")}`);
  }
  return [...byId.values()]
    .filter((story) => !requested || requested.has(story.id))
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((story) => ({
      ...story,
      family: story.id.split("--")[0],
      exports: [...new Set(story.exports)].sort(),
      width: story.widths?.[0] ?? width,
    }));
}
