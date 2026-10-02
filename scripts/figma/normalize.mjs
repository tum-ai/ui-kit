/** Split CSS lists without splitting commas/spaces inside functions or strings. */
export function splitCss(value, delimiter = ",") {
  const parts = [];
  let depth = 0;
  let quote = null;
  let start = 0;
  for (let i = 0; i < value.length; i++) {
    const char = value[i];
    if (quote) {
      if (char === quote && value[i - 1] !== "\\") quote = null;
      continue;
    }
    if (char === '"' || char === "'") {
      quote = char;
      continue;
    }
    if (char === "(") depth++;
    if (char === ")") depth--;
    if (!depth && (delimiter === " " ? /\s/.test(char) : char === delimiter)) {
      if (value.slice(start, i).trim()) parts.push(value.slice(start, i).trim());
      start = i + 1;
    }
  }
  if (value.slice(start).trim()) parts.push(value.slice(start).trim());
  return parts;
}

const number = (value, fallback = 0) =>
  Number.isFinite(Number.parseFloat(value)) ? Number.parseFloat(value) : fallback;
const round = (value) => Math.round(value * 1000) / 1000;

export function solidPaint(value, colors) {
  const color = colors[value];
  if (!color || !color.a) return null;
  const { r, g, b, a } = color;
  return { type: "SOLID", color: { r, g, b }, opacity: a };
}

/** Convert a CSS linear gradient to Figma's normalized inverse paint transform. */
export function linearGradient(value, bounds, colors) {
  if (!value.startsWith("linear-gradient("))
    throw new Error("Only non-repeating linear gradients have an exact native conversion.");
  const parts = splitCss(value.slice(16, -1));
  let direction = parts[0];
  let angle = 180;
  if (/^(to |[-+.\d].*(deg|turn|rad|grad)$)/.test(direction)) {
    parts.shift();
    const directions = { "to top": 0, "to right": 90, "to bottom": 180, "to left": 270 };
    if (direction in directions) angle = directions[direction];
    else if (direction.startsWith("to ")) {
      const dx = direction.includes("right") ? 1 : -1;
      const dy = direction.includes("bottom") ? 1 : -1;
      angle = (Math.atan2(dx * bounds.height, -dy * bounds.width) * 180) / Math.PI;
    } else {
      angle = number(direction);
      if (direction.endsWith("turn")) angle *= 360;
      else if (direction.endsWith("grad")) angle *= 0.9;
      else if (direction.endsWith("rad")) angle *= 180 / Math.PI;
    }
  }
  if (
    direction.includes(" in ") ||
    parts.some((part) => /\bin (oklab|oklch|lab|lch|hsl|hwb|srgb-linear)\b/.test(part))
  )
    throw new Error(
      "CSS gradient interpolation color space differs from Figma's native interpolation.",
    );
  const radians = (angle * Math.PI) / 180;
  const dx = Math.sin(radians);
  const dy = -Math.cos(radians);
  const length = Math.abs(bounds.width * dx) + Math.abs(bounds.height * dy);
  const stops = parts.flatMap((part) => {
    const terms = splitCss(part, " ");
    const color = colors[terms[0]];
    if (!color) throw new Error(`Unsupported gradient color or interpolation: ${terms[0]}`);
    const positions = terms.slice(1);
    if (!positions.length) return [{ color, position: null }];
    return positions.map((position) => {
      if (!/^-?[\d.]+(%|px)?$/.test(position))
        throw new Error(`Unsupported gradient stop ${position}`);
      return {
        color,
        position: position.endsWith("%") ? number(position) / 100 : number(position) / length,
      };
    });
  });
  if (stops.length < 2) throw new Error("A gradient requires at least two color stops.");
  stops[0].position ??= 0;
  stops[stops.length - 1].position ??= 1;
  let previous = 0;
  for (let i = 1; i < stops.length; i++) {
    if (stops[i].position === null) continue;
    stops[i].position = Math.max(stops[previous].position, stops[i].position);
    const step = (stops[i].position - stops[previous].position) / (i - previous);
    for (let j = previous + 1; j < i; j++)
      stops[j].position = stops[previous].position + step * (j - previous);
    previous = i;
  }
  if (stops.some((stop) => stop.position < 0 || stop.position > 1))
    throw new Error("Out-of-box gradient stops require paint-space extension.");
  // CSS premultiplies alpha. Carry adjacent hue into fully transparent stops so
  // Figma's color interpolation cannot introduce a dark fringe into a fade.
  stops.forEach((stop, index) => {
    if (stop.color.a === 0) {
      const adjacent =
        stops.slice(0, index).findLast((candidate) => candidate.color.a > 0) ??
        stops.slice(index + 1).find((candidate) => candidate.color.a > 0);
      if (adjacent) stop.color = { ...adjacent.color, a: 0 };
    }
  });
  // Figma gradientTransform maps normalized node coordinates into paint space.
  const a = (dx * bounds.width) / length;
  const b = (dy * bounds.height) / length;
  const c = 0.5 - (a + b) / 2;
  const perpendicularLength = Math.abs(bounds.width * dy) + Math.abs(bounds.height * dx);
  const d = (-dy * bounds.width) / perpendicularLength;
  const e = (dx * bounds.height) / perpendicularLength;
  return {
    type: "GRADIENT_LINEAR",
    gradientTransform: [
      [a, b, c],
      [d, e, 0.5 - (d + e) / 2],
    ],
    gradientStops: stops,
  };
}

/** Native ellipse geometry for CSS radial gradients, including off-center spots. */
export function radialGradient(value, bounds, colors) {
  if (!value.startsWith("radial-gradient("))
    throw new Error("Only non-repeating radial gradients have an exact native conversion.");
  const parts = splitCss(value.slice(16, -1));
  let specification = colors[splitCss(parts[0], " ")[0]]
    ? "ellipse farthest-corner"
    : parts.shift();
  const [shape, position = "50% 50%"] = specification.split(/\s+at\s+/);
  const positions = splitCss(position, " ");
  const coordinate = (value, size) => {
    const keywords = { left: 0, top: 0, center: size / 2, right: size, bottom: size };
    if (value in keywords) return keywords[value];
    if (!/^-?[\d.]+(%|px)$/.test(value)) throw new Error(`Unsupported radial position ${value}`);
    return value.endsWith("%") ? (number(value) / 100) * size : number(value);
  };
  const cx = coordinate(positions[0], bounds.width);
  const cy = coordinate(positions[1] ?? "50%", bounds.height);
  specification = shape.replace(/\b(circle|ellipse)\b/g, "").trim() || "farthest-corner";
  const circle = shape.includes("circle");
  const left = Math.abs(cx),
    right = Math.abs(bounds.width - cx),
    top = Math.abs(cy),
    bottom = Math.abs(bounds.height - cy);
  let rx, ry;
  if (
    ["closest-side", "farthest-side", "closest-corner", "farthest-corner"].includes(specification)
  ) {
    const choose = specification.startsWith("closest") ? Math.min : Math.max;
    rx = choose(left, right);
    ry = choose(top, bottom);
    if (circle)
      rx = ry = specification.endsWith("corner")
        ? choose(...[left, right].flatMap((x) => [top, bottom].map((y) => Math.hypot(x, y))))
        : choose(left, right, top, bottom);
    else if (specification.endsWith("corner")) {
      rx *= Math.SQRT2;
      ry *= Math.SQRT2;
    }
  } else {
    const sizes = splitCss(specification, " ");
    rx = coordinate(sizes[0], bounds.width);
    ry = sizes.length === 1 ? rx : coordinate(sizes[1], bounds.height);
  }
  if (!(rx > 0 && ry > 0)) throw new Error("A radial gradient requires positive radii.");
  const stops = linearGradient(
    `linear-gradient(90deg, ${parts.join(", ")})`,
    { width: rx, height: ry },
    colors,
  ).gradientStops;
  return {
    type: "GRADIENT_RADIAL",
    gradientTransform: [
      [bounds.width / (2 * rx), 0, 0.5 - cx / (2 * rx)],
      [0, bounds.height / (2 * ry), 0.5 - cy / (2 * ry)],
    ],
    gradientStops: stops,
  };
}

export function shadowEffects(value, colors) {
  if (!value || value === "none") return [];
  return splitCss(value)
    .map((shadow) => {
      const terms = splitCss(shadow, " ");
      const colorTerm = terms.find((term) => colors[term]);
      if (!colorTerm) throw new Error(`Unsupported shadow color: ${shadow}`);
      const lengths = terms
        .filter((term) => term !== colorTerm && term !== "inset")
        .map((term) => {
          if (!/^-?[\d.]+px$/.test(term) && term !== "0")
            throw new Error(`Unsupported shadow length: ${term}`);
          return number(term);
        });
      const [x, y, radius = 0, spread = 0] = lengths;
      if (lengths.length < 2 || lengths.length > 4)
        throw new Error(`Unsupported shadow: ${shadow}`);
      return {
        type: terms.includes("inset") ? "INNER_SHADOW" : "DROP_SHADOW",
        color: colors[colorTerm],
        offset: { x, y },
        radius,
        spread,
        visible: true,
        blendMode: "NORMAL",
      };
    })
    .filter((effect) => effect.color.a > 0);
}

/** CSS background images have their own sizing and positioning area. */
export function backgroundTiles(style, bounds, index = 0) {
  const layer = (property, fallback) => {
    const values = splitCss(style[property] || fallback);
    return values[index % values.length];
  };
  const size = layer("background-size", "auto");
  const position = layer("background-position", "0% 0%");
  const repeat = layer("background-repeat", "repeat");
  const dimension = (value, available) => {
    if (value === "auto") return available;
    if (!/^[\d.]+(?:px|%)$/.test(value) && value !== "0")
      throw new Error(`Unsupported background size ${value}`);
    return value.endsWith("%") ? (number(value) / 100) * available : number(value);
  };
  const sizes = splitCss(size, " ");
  const width = dimension(sizes[0], bounds.width);
  const height = dimension(sizes[1] ?? "auto", bounds.height);
  if (!width || !height) return [];
  const coordinates = splitCss(position, " ");
  const offset = (value, available) => {
    const keywords = {
      left: 0,
      top: 0,
      center: available / 2,
      right: available,
      bottom: available,
    };
    if (value in keywords) return keywords[value];
    if (!/^-?[\d.]+(?:px|%)$/.test(value) && value !== "0")
      throw new Error(`Unsupported background position ${value}`);
    return value.endsWith("%") ? (number(value) / 100) * available : number(value);
  };
  const x = offset(coordinates[0], bounds.width - width);
  const y = offset(coordinates[1] ?? "50%", bounds.height - height);
  if (
    ![
      "repeat",
      "no-repeat",
      "repeat-x",
      "repeat-y",
      "repeat no-repeat",
      "no-repeat repeat",
    ].includes(repeat)
  )
    throw new Error(`Unsupported background repeat ${repeat}`);
  const repeatX = ["repeat", "repeat-x", "repeat no-repeat"].includes(repeat);
  const repeatY = ["repeat", "repeat-y", "no-repeat repeat"].includes(repeat);
  const firstX = repeatX ? x - Math.ceil(x / width) * width : x;
  const firstY = repeatY ? y - Math.ceil(y / height) * height : y;
  const countX = repeatX ? Math.ceil((bounds.width - firstX) / width) : 1;
  const countY = repeatY ? Math.ceil((bounds.height - firstY) / height) : 1;
  if (countX * countY > 4096)
    throw new Error(
      "Background needs more than 4096 native tiles; use a declared source image asset.",
    );
  return Array.from({ length: countY }, (_, row) =>
    Array.from({ length: countX }, (_, column) => ({
      x: round(firstX + column * width),
      y: round(firstY + row * height),
      width,
      height,
    })),
  ).flat();
}

function fontStyle(weight, italic) {
  const names = {
    100: "Thin",
    200: "ExtraLight",
    300: "Light",
    400: "Regular",
    500: "Medium",
    600: "SemiBold",
    700: "Bold",
    800: "ExtraBold",
    900: "Black",
  };
  const name = names[Math.round(weight / 100) * 100] ?? "Regular";
  return italic ? (name === "Regular" ? "Italic" : `${name} Italic`) : name;
}

/** Normalize measured DOM primitives into the versioned Figma scene contract. */
export function normalizeCapture(
  raw,
  story,
  { assets = new Map(), variableKeys = new Set() } = {},
) {
  const diagnostics = [...raw.diagnostics];
  const issue = (item, code, message, severity = "error") =>
    diagnostics.push({ severity, code, nodeKey: item.key, message });
  function paints(item, { text = false } = {}) {
    const style = item.style;
    const fills = [];
    const gradientText = style["background-clip"] === "text";
    const backgroundImage = style["background-image"];
    if ((text && gradientText) || (!text && !gradientText)) {
      for (const [index, background] of splitCss(backgroundImage ?? "none").entries()) {
        if (background === "none") continue;
        const imageUrl = background.match(/^url\(["']?(.*?)["']?\)$/)?.[1];
        if (imageUrl) {
          const asset = assets.get(imageUrl);
          if (!asset?.bytesBase64)
            issue(item, "BACKGROUND_IMAGE", "Background image asset is unavailable.");
          else if (
            style["background-repeat"] === "repeat" &&
            style["background-size"] === "auto" &&
            style["background-position"] === "0% 0%"
          )
            fills.push({
              type: "IMAGE",
              bytesBase64: asset.bytesBase64,
              mimeType: asset.mimeType,
              scaleMode: "TILE",
              scalingFactor: 1,
            });
          else
            issue(
              item,
              "BACKGROUND_IMAGE_GEOMETRY",
              "Background image sizing, repeat or position needs an explicit native mapping.",
            );
          continue;
        }
        try {
          const tiles = backgroundTiles(style, item.bounds, index);
          if (!tiles.length) continue;
          const full =
            tiles.length === 1 &&
            tiles[0].x === 0 &&
            tiles[0].y === 0 &&
            tiles[0].width === item.bounds.width &&
            tiles[0].height === item.bounds.height;
          if (!full) {
            if (text && gradientText)
              issue(
                item,
                "BACKGROUND_TEXT_GEOMETRY",
                "Sized gradient text backgrounds need a native glyph mask.",
              );
            continue;
          }
        } catch (error) {
          issue(item, "BACKGROUND_GEOMETRY", error.message);
          continue;
        }
        try {
          fills.push(
            background.startsWith("radial-gradient(")
              ? radialGradient(background, item.bounds, raw.colors)
              : linearGradient(background, item.bounds, raw.colors),
          );
        } catch (error) {
          issue(item, "BACKGROUND_PAINT", error.message);
        }
      }
    }
    const solid = solidPaint(style[text ? "color" : "background-color"], raw.colors);
    if (solid && !(text && gradientText)) fills.push(solid);
    const property = text ? "color" : "background-color";
    const binding = item.source?.tokenBindings?.find((binding) => binding.property === property);
    if (
      binding &&
      fills.length === 1 &&
      fills[0].type === "SOLID" &&
      variableKeys.has(`css:${binding.cssVariable}`)
    )
      fills[0].variable = `css:${binding.cssVariable}`;
    return fills;
  }
  function effectList(item) {
    const style = item.style;
    let effects = [];
    try {
      effects = shadowEffects(style["box-shadow"], raw.colors);
    } catch (error) {
      issue(item, "BOX_SHADOW", error.message);
    }
    for (const [property, type] of [
      ["filter", "LAYER_BLUR"],
      ["backdrop-filter", "BACKGROUND_BLUR"],
    ]) {
      if (!style[property] || style[property] === "none") continue;
      if (
        property === "filter" &&
        item.image &&
        assets.get(item.image.assetKey ?? item.image.url)?.filterApplied
      )
        continue;
      const match = style[property].match(/^blur\(([\d.]+)px\)$/);
      if (match) effects.push({ type, radius: number(match[1]), visible: true });
      else if (
        property === "backdrop-filter" &&
        /^blur\([\d.]+px\) saturate\([\d.]+\)$/.test(style[property])
      ) {
        effects.push({ type, radius: number(style[property].slice(5)), visible: true });
        issue(
          item,
          "EFFECT_APPROXIMATION",
          "Figma preserves the measured background blur; CSS backdrop saturation has no native equivalent and remains in source metadata.",
          "warning",
        );
      } else issue(item, "CSS_FILTER", `${property}: ${style[property]} has no native converter.`);
    }
    return effects;
  }
  function fidelity(item) {
    const style = item.style;
    if (style["clip-path"] && style["clip-path"] !== "none")
      issue(item, "CSS_MASK", `clip-path: ${style["clip-path"]} is unsupported.`);
    if (
      style["mix-blend-mode"] &&
      ![
        "normal",
        "multiply",
        "screen",
        "overlay",
        "darken",
        "lighten",
        "color-dodge",
        "color-burn",
        "hard-light",
        "soft-light",
        "difference",
        "exclusion",
        "hue",
        "saturation",
        "color",
        "luminosity",
      ].includes(style["mix-blend-mode"])
    )
      issue(item, "CSS_BLEND", `mix-blend-mode: ${style["mix-blend-mode"]} is unsupported.`);
    if (style["writing-mode"] && style["writing-mode"] !== "horizontal-tb")
      issue(item, "TEXT_WRITING_MODE", `writing-mode: ${style["writing-mode"]} is unsupported.`);
    if (style.direction === "rtl")
      issue(item, "RTL_TEXT", "RTL text needs a native shaping/geometry validator.");
    if (style.transform && style.transform !== "none") {
      const match = style.transform.match(/^matrix\(([^)]+)\)$/);
      const matrix = match?.[1].split(",").map(Number);
      if (!matrix || matrix[0] !== 1 || matrix[1] !== 0 || matrix[2] !== 0 || matrix[3] !== 1)
        issue(
          item,
          "CSS_TRANSFORM",
          `Measured bounding boxes do not preserve rotation, skew or scale: ${style.transform}`,
        );
    }
    if (
      style.rotate &&
      style.rotate !== "none" &&
      style.rotate !== "0deg" &&
      !(item.svg && style.rotate === "180deg")
    )
      issue(item, "CSS_ROTATE", `Individual rotation ${style.rotate} is unsupported.`);
    if (style.scale && style.scale !== "none" && style.scale !== "1")
      issue(item, "CSS_SCALE", `Individual scale ${style.scale} is unsupported.`);
    if (style["text-shadow"] && style["text-shadow"] !== "none")
      issue(item, "TEXT_SHADOW", "Text shadow needs a native text effect converter.");
    if (item.source?.marker)
      issue(
        item,
        "NATIVE_LIST_MARKER",
        "List marker uses a native glyph in Chromium's measured marker box; glyph appearance requires visual comparison.",
        "warning",
      );
  }
  function node(item, parentBounds) {
    fidelity(item);
    const style = item.style;
    const base = {
      key: item.key,
      name: `${item.name ?? item.tag} · ${item.key.split("/").at(-1)}`,
      type: "FRAME",
      x: round(item.bounds.x - parentBounds.x),
      y: round(item.bounds.y - parentBounds.y),
      width: Math.max(0.01, item.bounds.width),
      height: Math.max(0.01, item.bounds.height),
      opacity: number(style.opacity, 1),
      blendMode:
        style["mix-blend-mode"] && style["mix-blend-mode"] !== "normal"
          ? style["mix-blend-mode"].toUpperCase().replaceAll("-", "_")
          : "NORMAL",
      fills: paints(item),
      effects: item.text === undefined ? effectList(item) : [],
      source: { ...item.source, bounds: item.bounds, css: style },
    };
    const modes = {};
    if (variableKeys.has("css:--tone-canvas") && item.source?.tone)
      modes["collection:tones"] = item.source.tone;
    if (variableKeys.has("css:--text-display-xl"))
      modes["collection:viewport"] = String(story.width);
    if (Object.keys(modes).length) base.variableModes = modes;
    if (item.text !== undefined) {
      base.source.textRanges = (item.ranges ?? []).map((range) => ({
        start: range.start,
        end: range.end,
        ...range.source,
      }));
      const weight = number(style["font-weight"], 400);
      const family = splitCss(style["font-family"])[0].replace(/^["']|["']$/g, "");
      const lineHeight = number(
        style["line-height"],
        item.source.firstLineHeight ?? item.bounds.height,
      );
      const characters =
        style["text-transform"] === "uppercase"
          ? item.text.toUpperCase()
          : style["text-transform"] === "lowercase"
            ? item.text.toLowerCase()
            : item.text;
      if (style["text-transform"] === "capitalize")
        issue(item, "TEXT_CAPITALIZE", "CSS capitalize requires language-aware word segmentation.");
      if (style["font-variation-settings"] && style["font-variation-settings"] !== "normal")
        issue(
          item,
          "FONT_VARIATIONS",
          `Custom variable font axes ${style["font-variation-settings"]} need a native mapping.`,
        );
      if (
        style["text-decoration-style"] &&
        style["text-decoration-style"] !== "solid" &&
        style["text-decoration-line"] !== "none"
      )
        issue(item, "TEXT_DECORATION", "Only solid native text decoration is supported.");
      const decorations = style["text-decoration-line"] ?? "none";
      return {
        ...base,
        type: "TEXT",
        opacity: 1,
        blendMode: "NORMAL",
        name: `${characters.trim().slice(0, 64)} · ${item.key.split("/").at(-1)}`,
        y: round(base.y - (lineHeight - (item.source.firstLineHeight ?? item.bounds.height)) / 2),
        height: Math.max(lineHeight, base.height),
        width: Math.max(0.01, base.width + 0.5),
        fills: paints(item, { text: true }),
        effects: [],
        text: {
          characters,
          fontName: { family, style: fontStyle(weight, style["font-style"] === "italic") },
          fontSize: number(style["font-size"], 16),
          lineHeight: { unit: "PIXELS", value: lineHeight },
          letterSpacing: { unit: "PIXELS", value: number(style["letter-spacing"]) },
          textAlignHorizontal: item.source.block
            ? ({ center: "CENTER", right: "RIGHT", end: "RIGHT", justify: "JUSTIFIED" }[
                style["text-align"]
              ] ?? "LEFT")
            : "LEFT",
          textAutoResize: "HEIGHT",
          textDecoration: decorations.includes("underline")
            ? "UNDERLINE"
            : decorations.includes("line-through")
              ? "STRIKETHROUGH"
              : "NONE",
          ranges: (item.ranges ?? []).map((range) => ({
            start: range.start,
            end: range.end,
            fontName: {
              family: splitCss(range.style["font-family"])[0].replace(/^["']|["']$/g, ""),
              style: fontStyle(
                number(range.style["font-weight"], 400),
                range.style["font-style"] === "italic",
              ),
            },
            fontSize: number(range.style["font-size"], 16),
            lineHeight: { unit: "PIXELS", value: number(range.style["line-height"], lineHeight) },
            letterSpacing: { unit: "PIXELS", value: number(range.style["letter-spacing"]) },
            fills: paints(
              { ...item, style: range.style, source: range.source, bounds: range.source.bounds },
              { text: true },
            ),
            textDecoration: range.style["text-decoration-line"].includes("underline")
              ? "UNDERLINE"
              : range.style["text-decoration-line"].includes("line-through")
                ? "STRIKETHROUGH"
                : "NONE",
          })),
        },
      };
    }
    if (item.svg) return { ...base, type: "SVG", fills: [], svg: item.svg };
    if (item.image) {
      const asset = assets.get(item.image.assetKey ?? item.image.url);
      if (!asset)
        issue(item, "IMAGE_ASSET_MISSING", `Image asset is unavailable: ${item.image.url}`);
      if (asset?.svg) {
        const { naturalWidth, naturalHeight } = item.image;
        const fit = style["object-fit"];
        let scaleX = base.width / naturalWidth;
        let scaleY = base.height / naturalHeight;
        if (fit === "cover") scaleX = scaleY = Math.max(scaleX, scaleY);
        if (fit === "contain") scaleX = scaleY = Math.min(scaleX, scaleY);
        if (fit === "none") scaleX = scaleY = 1;
        if (fit === "scale-down") scaleX = scaleY = Math.min(1, scaleX, scaleY);
        const position = splitCss(style["object-position"], " ");
        if (position.some((value) => !value.endsWith("%")))
          issue(
            item,
            "IMAGE_POSITION",
            "Only percentage object positions currently have an exact native mapping.",
          );
        const width = naturalWidth * scaleX;
        const height = naturalHeight * scaleY;
        return {
          ...base,
          clipsContent: true,
          children: [
            {
              key: `${item.key}/vector`,
              name: item.image.alt || "Image vector",
              type: "SVG",
              x: round(((base.width - width) * number(position[0], 50)) / 100),
              y: round(((base.height - height) * number(position[1], 50)) / 100),
              width,
              height,
              svg: asset.svg,
            },
          ],
        };
      }
      if (style["object-position"] !== "50% 50%")
        issue(item, "IMAGE_POSITION", "Raster image object position requires a crop transform.");
      return {
        ...base,
        type: "RECTANGLE",
        fills: asset
          ? [
              {
                type: "IMAGE",
                bytesBase64: asset.bytesBase64,
                mimeType: asset.mimeType,
                scaleMode:
                  style["object-fit"] === "contain"
                    ? "FIT"
                    : style["object-fit"] === "fill"
                      ? "CROP"
                      : "FILL",
              },
            ]
          : [],
      };
    }
    const radii = ["top-left", "top-right", "bottom-right", "bottom-left"].map((corner) => {
      const value = style[`border-${corner}-radius`] ?? "0px";
      if (value.includes(" ") || value.includes("%"))
        issue(item, "ELLIPTICAL_RADIUS", `Radius ${value} requires elliptical corner support.`);
      return Math.min(number(value), base.width / 2, base.height / 2);
    });
    [base.topLeftRadius, base.topRightRadius, base.bottomRightRadius, base.bottomLeftRadius] =
      radii;
    const sides = ["top", "right", "bottom", "left"];
    const widths = sides.map((side) => number(style[`border-${side}-width`]));
    const borderPaints = sides.map((side) => solidPaint(style[`border-${side}-color`], raw.colors));
    const visibleSides = sides.filter((side, i) => widths[i] && borderPaints[i]);
    if (visibleSides.length) {
      const first = sides.indexOf(visibleSides[0]);
      if (
        visibleSides.some(
          (side) =>
            JSON.stringify(borderPaints[sides.indexOf(side)]) !==
            JSON.stringify(borderPaints[first]),
        )
      )
        issue(item, "BORDER_COLORS", "Per-edge border colors need separate native rectangles.");
      if (
        visibleSides.every((side) => style[`border-${side}-style`] === "dashed") &&
        new Set(widths).size === 1
      ) {
        base.dashPattern = [widths[first] * 3, widths[first] * 3];
        issue(
          item,
          "DASH_DISTRIBUTION",
          "Native dashed stroke preserves dash proportions; browser corner dash distribution requires visual comparison.",
          "warning",
        );
      } else if (
        visibleSides.some((side) => !["solid", "none"].includes(style[`border-${side}-style`]))
      )
        issue(item, "BORDER_STYLE", "Border style needs an explicit native mapping.");
      base.strokes = [borderPaints[first]];
      base.strokeAlign = "INSIDE";
      [
        base.strokeTopWeight,
        base.strokeRightWeight,
        base.strokeBottomWeight,
        base.strokeLeftWeight,
      ] = widths;
    }
    base.clipsContent =
      ["hidden", "clip", "scroll", "auto"].includes(style["overflow-x"]) ||
      ["hidden", "clip", "scroll", "auto"].includes(style["overflow-y"]);
    base.children = (item.children ?? []).map((child) => node(child, item.bounds));
    if (style["background-clip"] !== "text") {
      const backgrounds = [];
      for (const [index, background] of splitCss(style["background-image"] ?? "none").entries()) {
        if (!/^(linear|radial)-gradient\(/.test(background)) continue;
        try {
          const tiles = backgroundTiles(style, item.bounds, index);
          const full =
            tiles.length === 1 &&
            tiles[0].x === 0 &&
            tiles[0].y === 0 &&
            tiles[0].width === base.width &&
            tiles[0].height === base.height;
          if (!tiles.length || full) continue;
          if (widths.some((width) => width > 0)) {
            issue(
              item,
              "BACKGROUND_ORIGIN",
              "Sized gradient backgrounds on bordered boxes need an explicit padding-box mapping.",
            );
            continue;
          }
          backgrounds.unshift({
            key: `${item.key}/background-${index}`,
            name: `Background ${index + 1}`,
            type: "FRAME",
            x: 0,
            y: 0,
            width: base.width,
            height: base.height,
            fills: [],
            clipsContent: true,
            topLeftRadius: radii[0],
            topRightRadius: radii[1],
            bottomRightRadius: radii[2],
            bottomLeftRadius: radii[3],
            source: { nativeRole: "background-tiles" },
            children: tiles.map((tile, tileIndex) => ({
              key: `${item.key}/background-${index}/tile-${tileIndex}`,
              name: `Tile ${tileIndex + 1}`,
              type: "RECTANGLE",
              ...tile,
              fills: [
                background.startsWith("radial-gradient(")
                  ? radialGradient(background, tile, raw.colors)
                  : linearGradient(background, tile, raw.colors),
              ],
            })),
          });
        } catch (error) {
          issue(item, "BACKGROUND_GEOMETRY", error.message);
        }
      }
      base.children.unshift(...backgrounds);
    }
    const mask = style["mask-image"];
    if (mask && mask !== "none") {
      const masks = splitCss(mask);
      const ring =
        masks.length === 2 &&
        ["exclude", "xor"].some((mode) => style["mask-composite"]?.includes(mode)) &&
        style["mask-clip"]?.includes("content-box");
      if (
        ring &&
        !base.children.length &&
        sides.every((side) => number(style[`padding-${side}`]) === number(style["padding-top"]))
      ) {
        base.strokes = base.fills;
        base.fills = [];
        base.strokeWeight = number(style["padding-top"]);
        base.strokeAlign = "INSIDE";
      } else if (
        masks.length === 1 &&
        masks[0].startsWith("linear-gradient(") &&
        (style["mask-composite"] === "add" || !style["mask-composite"])
      ) {
        try {
          const paint = linearGradient(mask, item.bounds, raw.colors);
          base.children.unshift({
            key: `${item.key}/mask`,
            name: "Alpha mask",
            type: "RECTANGLE",
            x: 0,
            y: 0,
            width: base.width,
            height: base.height,
            fills: [paint],
            isMask: true,
            maskType: "ALPHA",
          });
          // Masks belong inside this frame so following scene siblings are safe.
          if (base.fills.length) {
            base.children.splice(1, 0, {
              key: `${item.key}/background`,
              name: "Masked background",
              type: "RECTANGLE",
              x: 0,
              y: 0,
              width: base.width,
              height: base.height,
              fills: base.fills,
            });
            base.fills = [];
          }
        } catch (error) {
          issue(item, "CSS_MASK", error.message);
        }
      } else
        issue(
          item,
          "CSS_MASK",
          `mask-image: ${mask} with composite ${style["mask-composite"]} is unsupported.`,
        );
    }
    const isFlex = ["flex", "inline-flex"].includes(style.display);
    const simpleFlex =
      isFlex &&
      (!mask || mask === "none") &&
      !style["flex-direction"].includes("reverse") &&
      style["flex-wrap"] === "nowrap" &&
      item.children.every((child) =>
        ["top", "right", "bottom", "left"].every(
          (side) => number(child.style[`margin-${side}`]) === 0,
        ),
      );
    if (simpleFlex) {
      const vertical = style["flex-direction"] === "column";
      const primary = {
        "flex-start": "MIN",
        start: "MIN",
        normal: "MIN",
        "flex-end": "MAX",
        end: "MAX",
        center: "CENTER",
        "space-between": "SPACE_BETWEEN",
      }[style["justify-content"]];
      const counter = {
        "flex-start": "MIN",
        start: "MIN",
        normal: "MIN",
        stretch: "MIN",
        "flex-end": "MAX",
        end: "MAX",
        center: "CENTER",
        baseline: "BASELINE",
      }[style["align-items"]];
      base.layout = {
        mode: vertical ? "VERTICAL" : "HORIZONTAL",
        gap: number(style[vertical ? "row-gap" : "column-gap"]),
        paddingTop: number(style["padding-top"]) + widths[0],
        paddingRight: number(style["padding-right"]) + widths[1],
        paddingBottom: number(style["padding-bottom"]) + widths[2],
        paddingLeft: number(style["padding-left"]) + widths[3],
        primaryAxisAlignItems: primary ?? "MIN",
        counterAxisAlignItems: counter ?? "MIN",
      };
      base.children.forEach((child) => {
        const original = item.children.find((candidate) => candidate.key === child.key);
        if (!original || ["absolute", "fixed"].includes(original.style.position))
          child.layoutPositioning = "ABSOLUTE";
      });
      if (!primary || !counter) {
        delete base.layout;
        base.children.forEach((child) => {
          delete child.layoutPositioning;
        });
        issue(
          item,
          "LAYOUT_GEOMETRY",
          `CSS flex alignment ${style["justify-content"]}/${style["align-items"]} is retained as editable fixed geometry.`,
          "warning",
        );
      }
    } else if (isFlex || style.display === "grid" || style.display === "inline-grid") {
      issue(
        item,
        "LAYOUT_GEOMETRY",
        `CSS ${style.display} geometry is editable and fixed; its browser reflow algorithm is retained in source metadata.`,
        "warning",
      );
    }
    // CSS outlines paint outside an element's own overflow clip. Figma clips
    // child rectangles, so an outward outline needs an unclipped outer frame
    // around the original clipped box; relaxing the content clip would leak
    // overflowing child media and alter the component's actual semantics.
    if (number(style["outline-width"]) && style["outline-style"] !== "none") {
      if (style["outline-style"] !== "solid")
        issue(item, "OUTLINE_STYLE", "Only solid outlines are supported.");
      const width = number(style["outline-width"]);
      const offset = number(style["outline-offset"]) + width;
      const paint = solidPaint(style["outline-color"], raw.colors);
      if (paint) {
        const outline = {
          key: `${item.key}/outline`,
          name: "Outline",
          type: "RECTANGLE",
          x: -offset,
          y: -offset,
          width: Math.max(0.01, base.width + 2 * offset),
          height: Math.max(0.01, base.height + 2 * offset),
          fills: [],
          strokes: [paint],
          strokeWeight: width,
          strokeAlign: "INSIDE",
          topLeftRadius: Math.max(0, radii[0] + offset),
          topRightRadius: Math.max(0, radii[1] + offset),
          bottomRightRadius: Math.max(0, radii[2] + offset),
          bottomLeftRadius: Math.max(0, radii[3] + offset),
          ...(base.layout ? { layoutPositioning: "ABSOLUTE" } : {}),
        };
        if (base.clipsContent && offset > 0) {
          const content = {
            ...base,
            key: `${item.key}/content-clip`,
            name: "Clipped content",
            x: 0,
            y: 0,
            opacity: 1,
            blendMode: "NORMAL",
            layoutSizingHorizontal: "FILL",
            layoutSizingVertical: "FILL",
            source: { ...base.source, nativeRole: "outline-content-clip" },
          };
          return {
            key: base.key,
            name: base.name,
            type: base.type,
            x: base.x,
            y: base.y,
            width: base.width,
            height: base.height,
            opacity: base.opacity,
            blendMode: base.blendMode,
            fills: [],
            effects: [],
            clipsContent: false,
            layout: {
              mode: "VERTICAL",
              gap: 0,
              paddingTop: 0,
              paddingRight: 0,
              paddingBottom: 0,
              paddingLeft: 0,
              primaryAxisAlignItems: "MIN",
              counterAxisAlignItems: "MIN",
            },
            ...(base.variableModes ? { variableModes: base.variableModes } : {}),
            source: { ...base.source, nativeRole: "outline-container" },
            children: [content, { ...outline, layoutPositioning: "ABSOLUTE" }],
          };
        }
        base.children.push(outline);
      }
    }
    return base;
  }
  const root = {
    key: `story:${story.id}`,
    name: `${story.family ?? story.id.split("--")[0]} / ${story.name}`,
    type: story.kind === "example" ? "FRAME" : "COMPONENT",
    x: 0,
    y: 0,
    width: raw.bounds.width,
    height: raw.bounds.height,
    fills: [solidPaint(raw.background["background-color"], raw.colors)].filter(Boolean),
    clipsContent: false,
    children: raw.children.map((child) => node(child, raw.bounds)),
    source: {
      storyId: story.id,
      family: story.family,
      rootTag: raw.children.length === 1 ? raw.children[0].tag : null,
      rootRole: raw.children.length === 1 ? raw.children[0].source?.role : null,
      exports: story.exports,
      args: story.args,
      viewport: { width: story.width, height: 1000 },
      hasPortal: raw.hasPortal,
      fontFaces: raw.fontFaces,
    },
  };
  if (!raw.hasPortal && root.children.length === 1) {
    const child = root.children[0];
    if (child.type === "FRAME") {
      return {
        node: {
          ...child,
          key: root.key,
          name: root.name,
          type: root.type,
          x: 0,
          y: 0,
          source: { ...child.source, ...root.source },
        },
        diagnostics,
      };
    }
    root.width = child.width;
    root.height = child.height;
    child.x = child.y = 0;
    root.fills = [];
  }
  return { node: root, diagnostics };
}
