/** Runs entirely inside Chromium. Keep this function closure-free for page.evaluate. */
export function extractRenderedDom({ storyId, tokenNames = [], pseudoBoxes = {} }) {
  const round = (value) => Math.round(value * 1000) / 1000;
  const rect = (value) => ({
    x: round(value.x),
    y: round(value.y),
    width: round(value.width),
    height: round(value.height),
  });
  const diagnostics = [];
  const colors = {};
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 1;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  function color(value) {
    if (!value || !CSS.supports("color", value)) return;
    if (!(value in colors)) {
      ctx.clearRect(0, 0, 1, 1);
      ctx.fillStyle = value;
      ctx.fillRect(0, 0, 1, 1);
      const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
      colors[value] = { r: r / 255, g: g / 255, b: b / 255, a: a / 255 };
    }
  }
  function collectColors(value) {
    color(value);
    color("transparent");
    for (let i = 0; i < value.length; i++) {
      if (!/[a-z]/i.test(value[i]) || (i > 0 && /[\w-]/.test(value[i - 1]))) continue;
      const start = i;
      while (/[\w-]/.test(value[i] ?? "")) i++;
      if (value[i] === "(") {
        let depth = 1;
        const inside = ++i;
        while (i < value.length && depth) {
          if (value[i] === "(") depth++;
          if (value[i] === ")") depth--;
          i++;
        }
        const expression = value.slice(start, i);
        if (CSS.supports("color", expression)) color(expression);
        else collectColors(value.slice(inside, i - 1));
        i--;
      } else {
        color(value.slice(start, i));
        i--;
      }
    }
  }
  const properties = [
    "display",
    "visibility",
    "opacity",
    "position",
    "z-index",
    "isolation",
    "overflow-x",
    "overflow-y",
    "background-color",
    "background-image",
    "background-size",
    "background-position",
    "background-repeat",
    "background-clip",
    "border-top-width",
    "border-right-width",
    "border-bottom-width",
    "border-left-width",
    "border-top-color",
    "border-right-color",
    "border-bottom-color",
    "border-left-color",
    "border-top-style",
    "border-right-style",
    "border-bottom-style",
    "border-left-style",
    "border-top-left-radius",
    "border-top-right-radius",
    "border-bottom-right-radius",
    "border-bottom-left-radius",
    "box-shadow",
    "text-shadow",
    "outline-width",
    "outline-style",
    "outline-color",
    "outline-offset",
    "color",
    "font-family",
    "font-size",
    "font-weight",
    "font-style",
    "font-stretch",
    "font-variation-settings",
    "line-height",
    "letter-spacing",
    "text-align",
    "text-transform",
    "text-decoration-line",
    "text-decoration-style",
    "text-decoration-color",
    "text-indent",
    "white-space",
    "word-spacing",
    "writing-mode",
    "direction",
    "flex-direction",
    "flex-wrap",
    "align-items",
    "align-self",
    "justify-content",
    "column-gap",
    "row-gap",
    "padding-top",
    "padding-right",
    "padding-bottom",
    "padding-left",
    "margin-top",
    "margin-right",
    "margin-bottom",
    "margin-left",
    "transform",
    "translate",
    "rotate",
    "scale",
    "transform-origin",
    "filter",
    "backdrop-filter",
    "mix-blend-mode",
    "clip-path",
    "mask-image",
    "mask-composite",
    "mask-clip",
    "mask-origin",
    "object-fit",
    "object-position",
    "list-style-type",
    "list-style-position",
    "content",
  ];
  function styleSnapshot(element, pseudo = null) {
    const computed = getComputedStyle(element, pseudo);
    const result = Object.fromEntries(
      properties.map((name) => [name, computed.getPropertyValue(name)]),
    );
    for (const property of [
      "color",
      "background-color",
      "background-image",
      "mask-image",
      "box-shadow",
      "text-shadow",
      "outline-color",
      "border-top-color",
      "border-right-color",
      "border-bottom-color",
      "border-left-color",
    ])
      collectColors(result[property]);
    return result;
  }
  // Candidate rules are only a search accelerator. A live computed-value probe
  // below proves dependency; selector coincidence or matching RGB does not.
  const tokenProperties = [
    "color",
    "background-color",
    "font-size",
    "border-radius",
    "border-top-left-radius",
    "column-gap",
    "row-gap",
    "padding-top",
    "padding-right",
    "padding-bottom",
    "padding-left",
  ];
  const rules = [];
  function visitRules(ruleList) {
    for (const rule of ruleList) {
      if (rule.type === CSSRule.MEDIA_RULE && !matchMedia(rule.conditionText).matches) continue;
      if (rule.type === CSSRule.SUPPORTS_RULE && !CSS.supports(rule.conditionText)) continue;
      if (rule.selectorText && rule.style) {
        const declarations = tokenProperties.flatMap((property) => {
          const value = rule.style.getPropertyValue(property).trim();
          const match = value.match(/^var\((--[\w-]+)(?:,[^)]*)?\)$/);
          return match && tokenNames.includes(match[1]) ? [{ property, variable: match[1] }] : [];
        });
        if (declarations.length) rules.push({ selector: rule.selectorText, declarations });
      }
      if (rule.cssRules) visitRules(rule.cssRules);
    }
  }
  for (const sheet of document.styleSheets) {
    try {
      visitRules(sheet.cssRules);
    } catch {
      diagnostics.push({
        severity: "error",
        code: "STYLESHEET_UNREADABLE",
        message: "A stylesheet cannot be inspected for token provenance.",
      });
    }
  }
  function tokenBindings(element) {
    const candidates = new Map();
    for (const rule of rules) {
      try {
        if (element.matches(rule.selector))
          for (const declaration of rule.declarations)
            candidates.set(`${declaration.property}:${declaration.variable}`, declaration);
      } catch {
        /* CSS nesting/pseudo-element selectors cannot match an element. */
      }
    }
    const bindings = [];
    for (const { property, variable } of candidates.values()) {
      const computed = getComputedStyle(element);
      const original = computed.getPropertyValue(property);
      const value = computed.getPropertyValue(variable).trim();
      const saved = element.style.getPropertyValue(variable);
      const priority = element.style.getPropertyPriority(variable);
      element.style.setProperty(
        variable,
        property.includes("color") ? "rgb(1, 2, 3)" : "137px",
        "important",
      );
      const changed = getComputedStyle(element).getPropertyValue(property);
      if (saved) element.style.setProperty(variable, saved, priority);
      else element.style.removeProperty(variable);
      if (changed !== original)
        bindings.push({
          property,
          cssVariable: variable,
          value,
          proof: "computed-style-perturbation",
        });
    }
    return bindings;
  }
  function svgMarkup(element) {
    const clone = element.cloneNode(true);
    const originals = [element, ...element.querySelectorAll("*")];
    const copies = [clone, ...clone.querySelectorAll("*")];
    const presentation = [
      "fill",
      "fill-opacity",
      "fill-rule",
      "stroke",
      "stroke-width",
      "stroke-opacity",
      "stroke-linecap",
      "stroke-linejoin",
      "stroke-dasharray",
      "stroke-dashoffset",
      "opacity",
      "color",
      "stop-color",
      "stop-opacity",
      "clip-rule",
    ];
    originals.forEach((original, index) => {
      const computed = getComputedStyle(original);
      for (const name of presentation) {
        const value = computed.getPropertyValue(name);
        if (value && !value.includes("url(")) copies[index].setAttribute(name, value);
      }
      copies[index].removeAttribute("class");
      copies[index].removeAttribute("style");
    });
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    // Root opacity is represented by the outer scene node exactly once.
    clone.setAttribute("opacity", "1");
    // An icon turned with CSS `rotate` (a flipped chevron, an arrow that turns on
    // hover or focus) is drawn turned inside its own viewBox, around its centre.
    const angle = /^(-?[\d.]+)deg$/.exec(getComputedStyle(element).rotate)?.[1];
    if (angle && Number(angle) % 360 !== 0) {
      const viewBox = element.viewBox.baseVal;
      const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
      group.setAttribute(
        "transform",
        `rotate(${angle} ${viewBox.x + viewBox.width / 2} ${viewBox.y + viewBox.height / 2})`,
      );
      while (clone.firstChild) group.append(clone.firstChild);
      clone.append(group);
      // The node takes the turned element's bounding box, which grows with the
      // angle; widen the viewBox by as much so the icon keeps its size.
      const box = element.getBoundingClientRect();
      const width = parseFloat(getComputedStyle(element).width) || box.width;
      const height = parseFloat(getComputedStyle(element).height) || box.height;
      const scaleX = box.width / width;
      const scaleY = box.height / height;
      const viewWidth = viewBox.width * scaleX;
      const viewHeight = viewBox.height * scaleY;
      clone.setAttribute(
        "viewBox",
        `${viewBox.x + (viewBox.width - viewWidth) / 2} ${viewBox.y + (viewBox.height - viewHeight) / 2} ${viewWidth} ${viewHeight}`,
      );
    }
    return new XMLSerializer().serializeToString(clone);
  }
  const inlineTags = new Set([
    "SPAN",
    "STRONG",
    "EM",
    "I",
    "B",
    "A",
    "SMALL",
    "MARK",
    "BR",
    "CODE",
    "S",
    "U",
  ]);
  function canCombineText(element) {
    return [...element.children].every((child) => {
      if (!inlineTags.has(child.tagName)) return false;
      const style = getComputedStyle(child);
      if (!["inline", "inline-block", "contents"].includes(style.display)) return false;
      if (Number(style.opacity) !== 1 || style.position === "absolute") return false;
      if (
        (style.backgroundColor !== "rgba(0, 0, 0, 0)" || style.backgroundImage !== "none") &&
        style.backgroundClip !== "text"
      )
        return false;
      if (Number.parseFloat(style.borderTopWidth) || Number.parseFloat(style.borderBottomWidth))
        return false;
      return canCombineText(child);
    });
  }
  function textBlock(nodes, parent, key, wholeElement = false) {
    let characters = "";
    const ranges = [];
    const lineRects = [];
    function append(node, owner) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        if (node.tagName === "BR") {
          characters += "\n";
          return;
        }
        [...node.childNodes].forEach((child) => append(child, node));
        return;
      }
      if (node.nodeType !== Node.TEXT_NODE || !node.textContent) return;
      const style = styleSnapshot(owner);
      const preserve = ["pre", "pre-wrap", "break-spaces"].includes(style["white-space"]);
      let text = preserve ? node.textContent : node.textContent.replace(/\s+/g, " ");
      if (!preserve && (!characters || characters.endsWith(" "))) text = text.replace(/^ /, "");
      if (style["text-transform"] === "uppercase") text = text.toUpperCase();
      if (style["text-transform"] === "lowercase") text = text.toLowerCase();
      if (!text) return;
      const start = characters.length;
      characters += text;
      const range = document.createRange();
      range.selectNodeContents(node);
      const measured = [...range.getClientRects()].map(rect);
      lineRects.push(...measured);
      ranges.push({
        start,
        end: characters.length,
        style,
        source: {
          tokenBindings: tokenBindings(owner),
          bounds: rect(range.getBoundingClientRect()),
          tone: owner.closest("[data-tone]")?.getAttribute("data-tone") ?? "paper",
        },
      });
    }
    nodes.forEach((child) => append(child, parent));
    characters = characters.trimEnd();
    for (const range of ranges) range.end = Math.min(range.end, characters.length);
    if (!characters.trim() || !lineRects.length) return null;
    const style = styleSnapshot(parent);
    const parentRect = parent.getBoundingClientRect();
    const first = lineRects[0];
    const left = Math.min(...lineRects.map((r) => r.x));
    const top = Math.min(...lineRects.map((r) => r.y));
    const right = Math.max(...lineRects.map((r) => r.x + r.width));
    const bottom = Math.max(...lineRects.map((r) => r.y + r.height));
    const contentWidth =
      parentRect.width -
      Number.parseFloat(style["padding-left"]) -
      Number.parseFloat(style["padding-right"]) -
      Number.parseFloat(style["border-left-width"]) -
      Number.parseFloat(style["border-right-width"]);
    const block = wholeElement && ["block", "flow-root", "list-item"].includes(style.display);
    return {
      key,
      tag: "#text",
      text: characters,
      bounds: {
        x: round(
          block
            ? parentRect.x +
                Number.parseFloat(style["padding-left"]) +
                Number.parseFloat(style["border-left-width"])
            : left,
        ),
        y: round(top),
        width: round(block ? contentWidth : right - left),
        height: round(bottom - top),
      },
      style,
      ranges: ranges.filter((range) => range.end > range.start),
      source: {
        domPath: key,
        lineRects,
        firstLineHeight: first.height,
        block,
        tokenBindings: tokenBindings(parent),
        tone: parent.closest("[data-tone]")?.getAttribute("data-tone") ?? "paper",
      },
    };
  }
  function pseudo(element, name, key, parentBounds) {
    const style = styleSnapshot(element, name);
    if (["none", "normal"].includes(style.content) || style.display === "none") return null;
    const exact = pseudoBoxes[`${domSelector(element)}${name}`];
    if (exact?.width && exact?.height)
      return {
        key,
        tag: name,
        bounds: rect(exact),
        style,
        children: [],
        source: { domPath: key, pseudo: name, geometry: "chromium-box-model" },
      };
    if (style.position !== "absolute" && style.position !== "fixed") {
      diagnostics.push({
        severity: "error",
        code: "PSEUDO_FLOW",
        nodeKey: key,
        message: `${name} is in normal flow; its generated content needs explicit geometry support.`,
      });
      return null;
    }
    const probe = document.createElement("span");
    const computed = getComputedStyle(element, name);
    for (const property of computed)
      probe.style.setProperty(property, computed.getPropertyValue(property));
    probe.style.setProperty("content", "normal");
    probe.setAttribute("data-figma-probe", "true");
    const text = /^(["']).*\1$/.test(style.content) ? style.content.slice(1, -1) : "";
    probe.textContent = text;
    element.append(probe);
    const bounds = rect(probe.getBoundingClientRect());
    probe.remove();
    if (!bounds.width || !bounds.height) return null;
    return {
      key,
      tag: name,
      bounds,
      style,
      children: [],
      source: { domPath: key, pseudo: name, parentBounds },
    };
  }
  const excluded = new Set(["SCRIPT", "STYLE", "LINK", "META", "NOSCRIPT", "TEMPLATE"]);
  function domSelector(element) {
    const parts = [];
    while (element?.nodeType === Node.ELEMENT_NODE) {
      parts.unshift(
        `${element.localName}:nth-child(${[...element.parentNode.children].indexOf(element) + 1})`,
      );
      element = element.parentElement;
    }
    return parts.join(" > ");
  }
  function walk(element, key) {
    if (excluded.has(element.tagName) || element.hasAttribute("data-figma-probe")) return null;
    const style = styleSnapshot(element);
    if (style.display === "none" || style.visibility === "hidden" || Number(style.opacity) === 0)
      return null;
    const bounds = rect(element.getBoundingClientRect());
    if ((!bounds.width || !bounds.height) && !element.children.length) return null;
    // Accessibility-only text and focus sentinels are intentionally not painted.
    const clip = getComputedStyle(element).clip;
    if (
      clip === "rect(0px, 0px, 0px, 0px)" ||
      (style["clip-path"] === "inset(50%)" && bounds.width <= 1 && bounds.height <= 1)
    )
      return null;
    const source = {
      domPath: key,
      tag: element.tagName.toLowerCase(),
      className: element.getAttribute("class") ?? "",
      role: element.getAttribute("role"),
      tone: element.closest("[data-tone]")?.getAttribute("data-tone") ?? "paper",
      tokenBindings: tokenBindings(element),
    };
    const result = {
      key,
      tag: source.tag,
      name: element.getAttribute("aria-label") || element.getAttribute("data-slot") || source.tag,
      bounds,
      style,
      source,
      children: [],
    };
    if (element instanceof SVGElement && element.tagName.toLowerCase() === "svg") {
      result.svg = svgMarkup(element);
      return result;
    }
    if (element instanceof HTMLImageElement) {
      result.image = {
        url: element.currentSrc || element.src,
        naturalWidth: element.naturalWidth,
        naturalHeight: element.naturalHeight,
        alt: element.alt,
      };
      return result;
    }
    if (["CANVAS", "VIDEO", "IFRAME", "OBJECT", "EMBED"].includes(element.tagName))
      diagnostics.push({
        severity: "error",
        code: "UNSUPPORTED_ELEMENT",
        nodeKey: key,
        message: `${element.tagName} has no editable native representation.`,
      });
    const before = pseudo(element, "::before", `${key}/before`, bounds);
    if (before) result.children.push(before);
    if (canCombineText(element) && element.textContent?.trim()) {
      const text = textBlock([...element.childNodes], element, `${key}/text`, true);
      if (text) result.children.push(text);
    } else {
      [...element.childNodes].forEach((child, index) => {
        if (child.nodeType === Node.TEXT_NODE) {
          const text = textBlock([child], element, `${key}/text-${index}`);
          if (text) result.children.push(text);
        }
        if (child.nodeType === Node.ELEMENT_NODE) {
          const captured = walk(child, `${key}/${child.tagName.toLowerCase()}-${index}`);
          if (captured) result.children.push(captured);
        }
      });
    }
    const after = pseudo(element, "::after", `${key}/after`, bounds);
    if (after) result.children.push(after);
    if (style.display === "list-item" && style["list-style-type"] !== "none") {
      const markerBounds = pseudoBoxes[`${domSelector(element)}::marker`];
      if (markerBounds) {
        const markerStyle = styleSnapshot(element, "::marker");
        const markers = { disc: "•", circle: "◦", square: "▪" };
        const markerText = markers[style["list-style-type"]];
        if (markerText)
          result.children.push({
            key: `${key}/marker`,
            tag: "#text",
            text: markerText,
            bounds: rect(markerBounds),
            style: markerStyle,
            source: {
              domPath: `${key}/marker`,
              firstLineHeight: markerBounds.height,
              geometry: "chromium-box-model",
              marker: true,
            },
            ranges: [],
          });
        else
          diagnostics.push({
            severity: "error",
            code: "LIST_MARKER",
            nodeKey: key,
            message: `Unsupported generated list marker ${style["list-style-type"]}.`,
          });
      } else
        diagnostics.push({
          severity: "error",
          code: "LIST_MARKER",
          nodeKey: key,
          message: "Chromium did not expose the painted list marker box.",
        });
    }
    if (!bounds.width || !bounds.height) {
      if (!result.children.length) return null;
      const left = Math.min(...result.children.map((child) => child.bounds.x));
      const top = Math.min(...result.children.map((child) => child.bounds.y));
      result.bounds = {
        x: left,
        y: top,
        width:
          Math.max(...result.children.map((child) => child.bounds.x + child.bounds.width)) - left,
        height:
          Math.max(...result.children.map((child) => child.bounds.y + child.bounds.height)) - top,
      };
    }
    // Preserve CSS stacking within a common stacking context, including negative
    // z decorative layers beneath ordinary content. Source DOM order breaks ties.
    result.children.sort(
      (a, b) => (Number(a.style["z-index"]) || 0) - (Number(b.style["z-index"]) || 0),
    );
    return result;
  }
  const app = document.querySelector("#app-root");
  const root = document.querySelector("#storybook-root");
  if (!app || !root) throw new Error("Storybook #app-root and #storybook-root are required.");
  const children = [];
  [...app.children].forEach((element, index) => {
    const child = walk(element, `${storyId}/root/${element.tagName.toLowerCase()}-${index}`);
    if (child) children.push(child);
  });
  // Base UI portals sit outside both Storybook root and app-root. Capture body
  // siblings deliberately: filtering aria-hidden/inert would discard the scrim
  // and background that are visibly present in an open modal.
  [...document.body.children].forEach((element, index) => {
    if (
      element === root ||
      element.contains(app) ||
      element.classList.contains("sb-preparing-story") ||
      element.id.startsWith("storybook-")
    )
      return;
    const child = walk(element, `${storyId}/portal/${element.tagName.toLowerCase()}-${index}`);
    if (child) children.push(child);
  });
  const background = styleSnapshot(app);
  const hasPortal = children.some((child) => child.key.includes("/portal/"));
  const appBounds = app.getBoundingClientRect();
  const bounds = hasPortal
    ? { x: 0, y: 0, width: innerWidth, height: innerHeight }
    : {
        x: appBounds.x,
        y: appBounds.y,
        width: appBounds.width,
        height:
          Math.max(
            1,
            ...children.map((child) => child.bounds.y + child.bounds.height - appBounds.y),
          ) + Number.parseFloat(background["padding-bottom"]),
      };
  return {
    storyId,
    bounds: rect(bounds),
    background,
    colors,
    children,
    diagnostics,
    fontFaces: [...document.fonts].map((font) => ({
      family: font.family,
      style: font.style,
      weight: font.weight,
      status: font.status,
    })),
    hasPortal,
  };
}
