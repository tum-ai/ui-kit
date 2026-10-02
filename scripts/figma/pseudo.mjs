/** Chromium exposes real generated-content boxes even though DOM Range does not. */
export async function capturePseudoBoxes(page) {
  const session = await page.context().newCDPSession(page);
  try {
    const { root } = await session.send("DOM.getDocument", { depth: -1, pierce: true });
    const pending = [];
    function walk(node, selector) {
      for (const pseudo of node.pseudoElements ?? []) {
        if (["before", "after", "marker"].includes(pseudo.pseudoType))
          pending.push({ nodeId: pseudo.nodeId, selector, pseudo: `::${pseudo.pseudoType}` });
      }
      const elements = (node.children ?? []).filter((child) => child.nodeType === 1);
      elements.forEach((child, index) =>
        walk(
          child,
          `${selector ? `${selector} > ` : ""}${child.localName}:nth-child(${index + 1})`,
        ),
      );
    }
    walk(root, "");
    const boxes = {};
    for (const item of pending) {
      try {
        const { model } = await session.send("DOM.getBoxModel", { nodeId: item.nodeId });
        const xs = model.border.filter((_, index) => index % 2 === 0);
        const ys = model.border.filter((_, index) => index % 2 === 1);
        boxes[`${item.selector}${item.pseudo}`] = {
          x: Math.min(...xs),
          y: Math.min(...ys),
          width: Math.max(...xs) - Math.min(...xs),
          height: Math.max(...ys) - Math.min(...ys),
        };
      } catch {
        /* Non-painted pseudo content has no box; DOM extraction skips it. */
      }
    }
    return boxes;
  } finally {
    await session.detach();
  }
}
