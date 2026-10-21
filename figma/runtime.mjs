/**
 * Self-contained Plugin API runtime. The compiler embeds this function verbatim.
 * No module, filesystem, network, storage, or asynchronous image APIs are used in Figma.
 * Creation and binding recipes follow the installed figma-generate-library helpers.
 */
export async function reconcileBatch(figma, input, hash) {
  const { batch, ledger, hashes, receipt, packageName, fileKey, release } = input;
  const result = {
    ok: false,
    receipt,
    ledger,
    createdNodeIds: [],
    mutatedNodeIds: [],
    removedNodeIds: [],
    createdAssetIds: [],
    mutatedAssetIds: [],
    deprecated: [],
    evidence: [],
  };
  const records = ledger.entities;
  const beforeRecords = Object.fromEntries(
    Object.entries(records).map(([key, value]) => [key, JSON.stringify(value)]),
  );
  const created = new Set(),
    mutated = new Set(),
    assetsCreated = new Set(),
    assetsMutated = new Set();
  const objects = new Map(),
    fontsLoaded = new Set();
  const mark = (node) => {
    if (!created.has(node.id)) mutated.add(node.id);
  };
  const add = (node) => {
    created.add(node.id);
    if (node.parent) mark(node.parent);
  };
  const save = (spec, object, kind, extra = {}) => {
    records[spec.key] = {
      ...(records[spec.key] ?? {}),
      id: object.id,
      kind,
      type: spec.type ?? object.type ?? kind,
      name: spec.name,
      ...extra,
    };
    objects.set(spec.key, object);
    return object;
  };
  const fail = (message) => {
    throw new Error(message);
  };
  const loadFont = async (font) => {
    const key = `${font.family}/${font.style}`;
    if (!fontsLoaded.has(key)) {
      await figma.loadFontAsync(font);
      fontsLoaded.add(key);
    }
  };
  const currentFonts = async (node) => {
    if (node.type === "TEXT") {
      const segments = node.getStyledTextSegments(["fontName"]);
      if (segments.length) for (const segment of segments) await loadFont(segment.fontName);
      else if (node.fontName !== figma.mixed) await loadFont(node.fontName);
    }
  };
  const allDescendants = (node) => {
    const out = [];
    for (const child of node.children ?? []) {
      out.push(child);
      if ("children" in child) out.push(...allDescendants(child));
    }
    return out;
  };
  const textSizingMode = (spec) => {
    const source = spec.source;
    // An inline text fragment's captured width is glyph measurement, not a paragraph wrap width.
    const intrinsicInline =
      source?.block === false &&
      source.lineRects?.length === 1 &&
      ["inline", "inline-block", "inline-flex"].includes(source.css?.display) &&
      !/[\r\n\u2028\u2029]/.test(spec.text?.characters ?? "");
    return source?.css?.["white-space"] === "nowrap" || intrinsicInline
      ? "WIDTH_AND_HEIGHT"
      : (spec.text?.textAutoResize ?? "NONE");
  };
  const fingerprint = (spec, object) => {
    const record = records[spec.key],
      kind = record.kind;
    const snapshot = { name: object.name };
    if (kind === "collection")
      snapshot.modes = Object.fromEntries(
        spec.modes.map((name) => [
          record.modeIds[name],
          object.modes.find((m) => m.modeId === record.modeIds[name])?.name,
        ]),
      );
    else if (kind === "variable") {
      snapshot.type = object.resolvedType;
      snapshot.collection = object.variableCollectionId;
      snapshot.scopes = object.scopes;
      snapshot.codeSyntax = object.codeSyntax;
      snapshot.values = Object.fromEntries(
        Object.keys(spec.values).map((mode) => {
          const id = records[spec.collection].modeIds[mode];
          return [id, object.valuesByMode[id]];
        }),
      );
    } else if (kind === "textStyle" || kind === "effectStyle") {
      for (const field of Object.keys(spec))
        if (!["key", "source"].includes(field)) snapshot[field] = object[field];
    } else if (kind === "node") {
      const bound = object.boundVariables ?? {};
      const cleanPaint = (paint) => {
        const value = { ...paint };
        if (value.boundVariables?.color) delete value.color;
        return value;
      };
      // The marker also identifies the previous sizing policy during an in-place migration.
      const textResize = record.textSizingMode ?? spec.text?.textAutoResize;
      const dynamicWidth =
        ["FILL", "HUG"].includes(spec.layoutSizingHorizontal) ||
        textResize === "WIDTH_AND_HEIGHT" ||
        (spec.layout?.primaryAxisSizingMode === "AUTO" && spec.layout.mode === "HORIZONTAL") ||
        (spec.layout?.counterAxisSizingMode === "AUTO" && spec.layout.mode === "VERTICAL");
      const dynamicHeight =
        ["FILL", "HUG"].includes(spec.layoutSizingVertical) ||
        ["HEIGHT", "WIDTH_AND_HEIGHT"].includes(textResize) ||
        (spec.layout?.primaryAxisSizingMode === "AUTO" && spec.layout.mode === "VERTICAL") ||
        (spec.layout?.counterAxisSizingMode === "AUTO" && spec.layout.mode === "HORIZONTAL");
      for (const field of [
        "width",
        "height",
        "opacity",
        "visible",
        "rotation",
        "cornerRadius",
        "topLeftRadius",
        "topRightRadius",
        "bottomLeftRadius",
        "bottomRightRadius",
        "strokeWeight",
        "strokeAlign",
        "strokeTopWeight",
        "strokeRightWeight",
        "strokeBottomWeight",
        "strokeLeftWeight",
        "clipsContent",
        "blendMode",
        "dashPattern",
        "isMask",
        "maskType",
        "layoutPositioning",
        "layoutSizingHorizontal",
        "layoutSizingVertical",
      ])
        if (
          spec[field] !== undefined &&
          !bound[field] &&
          !(field === "width" && dynamicWidth) &&
          !(field === "height" && dynamicHeight)
        )
          snapshot[field] = object[field];
      if (
        object.parent?.type !== "PAGE" &&
        (spec.layoutPositioning === "ABSOLUTE" ||
          !("layoutMode" in object.parent) ||
          object.parent.layoutMode === "NONE")
      ) {
        snapshot.x = object.x;
        snapshot.y = object.y;
      }
      snapshot.bindings = bound;
      if (spec.type !== "SVG") {
        if ("fills" in object)
          snapshot.fills = Array.isArray(object.fills) ? object.fills.map(cleanPaint) : "MIXED";
        if ("strokes" in object)
          snapshot.strokes = Array.isArray(object.strokes)
            ? object.strokes.map(cleanPaint)
            : "MIXED";
      } else
        snapshot.vectors = allDescendants(object)
          .filter((node) => record.ownedDescendantIds.includes(node.id))
          .map((node) => ({
            id: node.id,
            type: node.type,
            width: node.width,
            height: node.height,
            fills: "fills" in node ? node.fills : undefined,
            paths: node.type === "VECTOR" ? node.vectorPaths : undefined,
            ...Object.fromEntries(
              [
                "relativeTransform",
                "x",
                "y",
                "strokes",
                "strokeWeight",
                "opacity",
                "visible",
                "blendMode",
                "isMask",
                "maskType",
              ]
                .filter((field) => field in node)
                .map((field) => [field, node[field]]),
            ),
          }));
      if (spec.effectStyle) snapshot.effectStyleId = object.effectStyleId;
      else if ("effects" in object) snapshot.effects = object.effects;
      if (spec.layout) {
        for (const field of [
          "layoutMode",
          "layoutWrap",
          "itemSpacing",
          "counterAxisSpacing",
          "paddingTop",
          "paddingRight",
          "paddingBottom",
          "paddingLeft",
          "primaryAxisAlignItems",
          "counterAxisAlignItems",
          "primaryAxisSizingMode",
          "counterAxisSizingMode",
        ])
          if (!bound[field]) snapshot[field] = object[field];
      }
      if (spec.text) {
        snapshot.characters = object.characters;
        snapshot.textStyleId = object.textStyleId;
        if (record.textSizingMode) snapshot.textAutoResize = object.textAutoResize;
        for (const field of Object.keys(spec.text))
          if (
            field !== "ranges" &&
            field !== "characters" &&
            (!spec.textStyle ||
              ["textAlignHorizontal", "textAlignVertical", "textAutoResize"].includes(field)) &&
            !bound[field]
          )
            snapshot[field] = object[field];
        if (spec.text.ranges)
          snapshot.ranges = object.getStyledTextSegments([
            "fontName",
            "fontSize",
            "fills",
            "lineHeight",
            "letterSpacing",
            "textDecoration",
            "textCase",
          ]);
      }
      if (spec.propertyReferences) snapshot.propertyReferences = object.componentPropertyReferences;
      if (spec.componentProperties)
        snapshot.properties = Object.fromEntries(
          spec.componentProperties.map((property) => [
            records[property.key].id,
            object.componentPropertyDefinitions[records[property.key].id],
          ]),
        );
      if (spec.variableModes) snapshot.variableModes = object.explicitVariableModes;
    }
    const sorted = (value) =>
      Array.isArray(value)
        ? value.map(sorted)
        : value && typeof value === "object"
          ? Object.fromEntries(
              Object.keys(value)
                .sort()
                .map((key) => [key, sorted(value[key])]),
            )
          : typeof value === "number"
            ? Math.round(value * 1000000) / 1000000
            : value;
    return hash(JSON.stringify(sorted(snapshot)));
  };
  const needsSource = (spec) =>
    records[spec.key]?.hash !== hashes[spec.key] ||
    (!["page", "property"].includes(records[spec.key]?.kind) &&
      (!records[spec.key]?.nativeFingerprint || records[spec.key]?.nativeFingerprintVersion !== 2));
  const needs = (spec) =>
    needsSource(spec) || (spec.text && records[spec.key]?.textSizingMode !== textSizingMode(spec));
  const verifyUnchanged = (spec, object) => {
    const record = records[spec.key];
    // A typography-policy migration must not overwrite manual edits hidden by a new marker.
    if (
      record?.hash === hashes[spec.key] &&
      record.nativeFingerprint &&
      record.nativeFingerprintVersion === 2 &&
      record.nativeFingerprint !== fingerprint(spec, object)
    )
      fail(
        `Managed native content drifted: ${spec.key}. Inspect the canvas before reconciling code-owned properties.`,
      );
  };
  const recordFingerprint = (spec, object) => {
    if (spec.type === "TEXT") records[spec.key].textSizingMode = textSizingMode(spec);
    records[spec.key].nativeFingerprint = fingerprint(spec, object);
    records[spec.key].nativeFingerprintVersion = 2;
  };
  const complete = (spec) => {
    records[spec.key].hash = hashes[spec.key];
    delete records[spec.key].deprecated;
  };
  const uniqueName = (items, spec, kind) => {
    const matches = items.filter((x) => x.name === spec.name);
    if (matches.length)
      fail(
        `Unmapped ${kind} name collision: ${spec.name}. Read the canvas and reconcile the external ledger before retrying.`,
      );
  };
  const getNode = async (spec, parent, desiredParentKey) => {
    const record = records[spec.key];
    if (!record) {
      uniqueName(parent.children ?? [], spec, "node");
      return null;
    }
    const node = await figma.getNodeByIdAsync(record.id);
    if (!node)
      fail(`Managed node ${spec.key} (${record.id}) is missing; refusing to recreate its identity`);
    const type = spec.type === "SVG" ? "FRAME" : spec.type;
    if (node.type !== type || record.type !== spec.type)
      fail(`Type change for ${spec.key} requires an explicit migration`);
    if (node.parent?.id !== parent.id) {
      if (!record.parentKey || record.parentKey === desiredParentKey)
        fail(`Managed node ${spec.key} was moved outside its expected parent`);
      const previous = records[record.parentKey];
      if (!previous || !["page", "node"].includes(previous.kind) || node.parent?.id !== previous.id)
        fail(`Managed node ${spec.key} was moved outside its recorded parent`);
      let ancestor = node.parent,
        owner = previous;
      while (owner.parentKey) {
        const nextOwner = records[owner.parentKey];
        if (!nextOwner || ancestor.parent?.id !== nextOwner.id)
          fail(`Previous owned parent of ${spec.key} was moved outside its recorded ancestry`);
        ancestor = ancestor.parent;
        owner = nextOwner;
      }
      // A changed source parent may move a known node; a designer move never authorizes this path.
      await currentFonts(node);
      for (const text of allDescendants(node).filter((child) => child.type === "TEXT"))
        await currentFonts(text);
      mark(node.parent);
      mark(parent);
      mark(node);
      parent.appendChild(node);
      delete record.hash;
    }
    objects.set(spec.key, node);
    return node;
  };
  const resolveVariable = async (key) => {
    if (objects.has(key)) return objects.get(key);
    const record = records[key];
    if (!record || record.kind !== "variable") fail(`Missing foundation variable ${key}`);
    const variable = await figma.variables.getVariableByIdAsync(record.id);
    if (!variable) fail(`Missing Figma variable ${key}`);
    objects.set(key, variable);
    return variable;
  };
  const decode = (value) => {
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    const output = [];
    let bits = 0,
      buffer = 0;
    for (const c of value) {
      if (c === "=") break;
      buffer = (buffer << 6) | alphabet.indexOf(c);
      bits += 6;
      if (bits >= 8) {
        bits -= 8;
        output.push((buffer >> bits) & 255);
      }
    }
    return new Uint8Array(output);
  };
  const paints = async (items) => {
    const values = [];
    for (const item of items) {
      const paint = { ...item };
      delete paint.variable;
      delete paint.bytesBase64;
      delete paint.mimeType;
      if (item.type === "IMAGE") paint.imageHash = figma.createImage(decode(item.bytesBase64)).hash;
      const bound = item.variable
        ? figma.variables.setBoundVariableForPaint(
            paint,
            "color",
            await resolveVariable(item.variable),
          )
        : paint;
      // Figma's binding helper can replace opacity with the variable's alpha.
      // The scene records the rendered CSS alpha, so retain that explicit paint value.
      if (item.opacity !== undefined) bound.opacity = item.opacity;
      values.push(bound);
    }
    return values;
  };
  const propertyDefinitions = async (spec, node, pageKey) => {
    if (!spec.componentProperties) return;
    // Never read definitions on a variant: its parent set owns them.
    if (
      node.type !== "COMPONENT_SET" &&
      !(node.type === "COMPONENT" && node.parent?.type !== "COMPONENT_SET")
    )
      fail(`Invalid property owner ${spec.key}`);
    const definitions = node.componentPropertyDefinitions;
    for (const property of spec.componentProperties) {
      const record = records[property.key];
      let id = record?.id;
      if (id && !definitions[id]) fail(`Missing component property ${property.key}`);
      if (!id) {
        if (Object.keys(definitions).some((k) => k.split("#")[0] === property.name))
          fail(`Unmapped component property ${property.name}`);
        mark(node);
        id = node.addComponentProperty(property.name, property.type, property.defaultValue);
        records[property.key] = {
          id,
          kind: "property",
          type: property.type,
          name: property.name,
          parentKey: spec.key,
          pageKey,
        };
      } else if (definitions[id].type !== property.type)
        fail(`Component property type change: ${property.key}`);
      else if (
        needs(property) ||
        definitions[id].defaultValue !== property.defaultValue ||
        id.split("#")[0] !== property.name
      ) {
        mark(node);
        id = node.editComponentProperty(id, {
          name: property.name,
          defaultValue: property.defaultValue,
        });
        records[property.key].id = id;
      }
      complete(property);
    }
  };
  const writeNode = async (spec, node, parent, pageKey, parentKey) => {
    const record = records[spec.key];
    const changed = needs(spec);
    verifyUnchanged(spec, node);
    if (needsSource(spec)) {
      await currentFonts(node);
      mark(node);
      // Clear only previously generator-owned bindings that disappeared.
      for (const field of record.boundFields ?? [])
        if (!Object.hasOwn(spec.bindings ?? {}, field)) node.setBoundVariable(field, null);
      node.name = spec.name;
      if (spec.type === "TEXT") {
        await loadFont(spec.text.fontName);
        node.fontName = spec.text.fontName;
        if (!spec.textStyle && record.textStyle) await node.setTextStyleIdAsync("");
        for (const [field, value] of Object.entries(spec.text))
          if (!["ranges", "textAutoResize"].includes(field)) node[field] = value;
        if (spec.textStyle) await node.setTextStyleIdAsync(records[spec.textStyle].id);
      }
      if (spec.layout) {
        node.layoutMode = spec.layout.mode;
        node.layoutWrap = spec.layout.wrap ?? "NO_WRAP";
        node.itemSpacing = spec.layout.gap ?? 0;
        for (const field of [
          "counterAxisSpacing",
          "paddingTop",
          "paddingRight",
          "paddingBottom",
          "paddingLeft",
        ])
          node[field] = spec.layout[field] ?? 0;
        node.primaryAxisAlignItems = spec.layout.primaryAxisAlignItems ?? "MIN";
        node.counterAxisAlignItems = spec.layout.counterAxisAlignItems ?? "MIN";
      } else if (["FRAME", "COMPONENT", "COMPONENT_SET"].includes(node.type))
        node.layoutMode = "NONE";
      if ("fills" in node && spec.type !== "SVG") node.fills = await paints(spec.fills ?? []);
      if ("strokes" in node && spec.type !== "SVG") node.strokes = await paints(spec.strokes ?? []);
      if (spec.type === "TEXT") {
        for (const range of spec.text.ranges ?? []) {
          if (range.fontName) await loadFont(range.fontName);
          for (const [field, value] of Object.entries(range)) {
            if (["start", "end"].includes(field)) continue;
            const method = `setRange${field[0].toUpperCase()}${field.slice(1)}`;
            node[method](range.start, range.end, field === "fills" ? await paints(value) : value);
          }
        }
      }
      if (spec.effectStyle) await node.setEffectStyleIdAsync(records[spec.effectStyle].id);
      else {
        if (record.effectStyle) await node.setEffectStyleIdAsync("");
        if ("effects" in node) node.effects = spec.effects ?? [];
      }
      const defaults = {
        opacity: 1,
        visible: true,
        rotation: 0,
        blendMode: "PASS_THROUGH",
        dashPattern: [],
        isMask: false,
        maskType: "ALPHA",
      };
      for (const field of [
        "strokeWeight",
        "strokeAlign",
        "strokeTopWeight",
        "strokeRightWeight",
        "strokeBottomWeight",
        "strokeLeftWeight",
        "cornerRadius",
        "topLeftRadius",
        "topRightRadius",
        "bottomLeftRadius",
        "bottomRightRadius",
        "clipsContent",
        "opacity",
        "visible",
        "rotation",
        "blendMode",
        "dashPattern",
        "isMask",
        "maskType",
      ]) {
        if (spec[field] !== undefined) node[field] = spec[field];
        else if (record.fields?.includes(field))
          node[field] =
            defaults[field] ??
            (field === "clipsContent" ? false : field === "strokeAlign" ? "INSIDE" : 0);
      }
      if (spec.description !== undefined) node.description = spec.description;
      if (spec.layoutPositioning !== undefined) node.layoutPositioning = spec.layoutPositioning;
      else if (record.fields?.includes("layoutPositioning")) node.layoutPositioning = "AUTO";
      // Resizing resets FILL/HUG, so set sizing only after geometry and parent attachment.
      node.resize(spec.width, spec.height);
      if (spec.layout) {
        node.primaryAxisSizingMode = spec.layout.primaryAxisSizingMode ?? "FIXED";
        node.counterAxisSizingMode = spec.layout.counterAxisSizingMode ?? "FIXED";
      }
      if (spec.layoutSizingHorizontal) node.layoutSizingHorizontal = spec.layoutSizingHorizontal;
      if (spec.layoutSizingVertical) node.layoutSizingVertical = spec.layoutSizingVertical;
      if (!spec.layoutSizingHorizontal && record.fields?.includes("layoutSizingHorizontal"))
        node.layoutSizingHorizontal = "FIXED";
      if (!spec.layoutSizingVertical && record.fields?.includes("layoutSizingVertical"))
        node.layoutSizingVertical = "FIXED";
      if (parent.type === "PAGE" && !record.positioned) {
        const neighbors = parent.children.filter((n) => n.id !== node.id);
        node.x = Math.max(480, ...neighbors.map((n) => n.x + n.width + 160));
        node.y = 80;
        record.positioned = true;
      } else if (
        parent.type !== "PAGE" &&
        (!parent.layoutMode ||
          parent.layoutMode === "NONE" ||
          spec.layoutPositioning === "ABSOLUTE")
      ) {
        node.x = spec.x ?? 0;
        node.y = spec.y ?? 0;
      }
      for (const [field, variableKey] of Object.entries(spec.bindings ?? {}))
        node.setBoundVariable(field, await resolveVariable(variableKey));
      for (const collectionKey of record.modeCollections ?? [])
        if (!Object.hasOwn(spec.variableModes ?? {}, collectionKey)) {
          const collection = await figma.variables.getVariableCollectionByIdAsync(
            records[collectionKey].id,
          );
          node.clearExplicitVariableModeForCollection(collection);
        }
      for (const [collectionKey, mode] of Object.entries(spec.variableModes ?? {})) {
        const collectionRecord = records[collectionKey];
        const collection = await figma.variables.getVariableCollectionByIdAsync(
          collectionRecord.id,
        );
        node.setExplicitVariableModeForCollection(collection, collectionRecord.modeIds[mode]);
      }
      // resize(), layout sizing and font bindings can reset native text autosizing.
      // Apply the final policy after those writes; never widen the containing frame or change glyphs.
      if (spec.type === "TEXT") node.textAutoResize = textSizingMode(spec);
      if (spec.propertyReferences) {
        const references = {};
        for (const [field, key] of Object.entries(spec.propertyReferences))
          references[field] = records[key].id;
        node.componentPropertyReferences = references;
      } else if (record.propertyReferences) node.componentPropertyReferences = null;
      record.boundFields = Object.keys(spec.bindings ?? {});
      record.fields = Object.keys(spec);
      record.textStyle = spec.textStyle;
      record.effectStyle = spec.effectStyle;
      record.propertyReferences = spec.propertyReferences;
      record.modeCollections = Object.keys(spec.variableModes ?? {});
    } else if (changed) {
      // The unchanged source has a verified baseline: migrate only its sizing behavior.
      await currentFonts(node);
      mark(node);
      node.textAutoResize = textSizingMode(spec);
    }
    if (spec.type === "TEXT" && textSizingMode(spec) === "WIDTH_AND_HEIGHT") {
      if (node.textAutoResize !== "WIDTH_AND_HEIGHT")
        fail(`TEXT_SIZING_MISMATCH: ${spec.key} could not preserve native no-wrap text`);
      // Intrinsic text boxes round outward; only painted glyphs prove clipping when available.
      // Preserve captured intentional overflow. Without render bounds, allow one CSS pixel
      // for native intrinsic-size rounding rather than treating a larger box as clipped ink.
      const validBounds = (bounds) =>
        bounds && ["x", "y", "width", "height"].every((field) => Number.isFinite(bounds[field]));
      const painted = node.absoluteRenderBounds;
      const positioned = node.absoluteBoundingBox;
      let captured = validBounds(positioned)
        ? { x: positioned.x, y: positioned.y, width: spec.width, height: spec.height }
        : null;
      const transform = node.absoluteTransform;
      if (
        transform?.length === 2 &&
        transform.every((row) => row.length === 3 && row.every(Number.isFinite))
      ) {
        const points = [
          [0, 0],
          [spec.width, 0],
          [0, spec.height],
          [spec.width, spec.height],
        ].map(([a, b]) => ({
          x: transform[0][0] * a + transform[0][1] * b + transform[0][2],
          y: transform[1][0] * a + transform[1][1] * b + transform[1][2],
        }));
        const left = Math.min(...points.map((p) => p.x)),
          top = Math.min(...points.map((p) => p.y));
        captured = {
          x: left,
          y: top,
          width: Math.max(...points.map((p) => p.x)) - left,
          height: Math.max(...points.map((p) => p.y)) - top,
        };
      }
      const overflow = (rect, clip) => [
        Math.max(0, clip.x - rect.x),
        Math.max(0, clip.y - rect.y),
        Math.max(0, rect.x + rect.width - clip.x - clip.width),
        Math.max(0, rect.y + rect.height - clip.y - clip.height),
      ];
      let x = node.x,
        y = node.y,
        ancestor = parent;
      while (ancestor && ancestor.type !== "PAGE" && ancestor.type !== "DOCUMENT") {
        if (ancestor.clipsContent) {
          const clip = ancestor.absoluteBoundingBox;
          const usePaint = validBounds(painted) && captured && validBounds(clip);
          const container = usePaint
            ? clip
            : { x: 0, y: 0, width: ancestor.width, height: ancestor.height };
          const actual = overflow(
            usePaint ? painted : { x, y, width: node.width, height: node.height },
            container,
          );
          const expected = overflow(
            usePaint ? captured : { x, y, width: spec.width, height: spec.height },
            container,
          );
          if (actual.some((amount, i) => amount > expected[i] + (usePaint ? 0.5 : 1)))
            fail(
              `TEXT_METRICS_OVERFLOW: ${spec.key} needs ${node.width}×${node.height}px in Figma versus ${spec.width}×${spec.height}px captured; native text ${usePaint ? "paint" : "bounds"} would be clipped by ${ancestor.name}`,
            );
        }
        x += ancestor.x;
        y += ancestor.y;
        ancestor = ancestor.parent;
      }
    }
    await propertyDefinitions(spec, node, pageKey);
    if (!input.flat)
      for (const child of spec.children ?? []) await upsertNode(child, node, pageKey, spec.key);
    if (spec.textStyle && node.textStyleId !== records[spec.textStyle].id && !spec.text?.ranges)
      fail(`Text style attachment failed: ${spec.key}`);
    for (const field of ["fills", "strokes"]) {
      const expected = spec[field];
      if (!expected || !(field in node) || !Array.isArray(node[field])) continue;
      for (const [index, paint] of expected.entries())
        if (
          paint.variable &&
          paint.opacity !== undefined &&
          Math.abs((node[field][index]?.opacity ?? 1) - paint.opacity) > 1 / 255 + 0.000001
        )
          fail(
            `BOUND_ALPHA_MISMATCH: ${spec.key}.${field}[${index}] requires a color variable whose per-mode RGBA includes the source opacity modifier`,
          );
    }
    recordFingerprint(spec, node);
    complete(spec);
    record.parentKey = parentKey;
    record.pageKey = pageKey;
    if (result.evidence.length < 5)
      result.evidence.push({
        key: spec.key,
        id: node.id,
        type: node.type,
        width: node.width,
        height: node.height,
        childCount: "children" in node ? node.children.length : 0,
        changed,
        ...(node.type === "TEXT" ? { textStyleId: node.textStyleId } : {}),
      });
    return node;
  };
  const upsertNode = async (spec, parent, pageKey, parentKey) => {
    let node = await getNode(spec, parent, parentKey);
    if (!node && spec.type === "COMPONENT_SET") {
      // Create empty variant components first, combine once, then fill text/properties.
      const variants = [];
      for (const child of spec.children) {
        let variant = await getNode(child, parent, parentKey);
        if (!variant) {
          variant = figma.createComponent();
          add(variant);
          variant.name = child.name;
          parent.appendChild(variant);
          mark(parent);
          save(child, variant, "node", { pageKey });
        }
        variants.push(variant);
      }
      node = figma.combineAsVariants(variants, parent);
      add(node);
      for (const v of variants) mark(v);
      node.name = spec.name;
      save(spec, node, "node", { pageKey, parentKey });
    } else if (!node) {
      if (spec.type === "SVG") node = figma.createNodeFromSvg(spec.svg);
      else if (spec.type === "FRAME") {
        node = figma.createFrame();
        if (spec.layout) node.layoutMode = spec.layout.mode;
      } else if (spec.type === "COMPONENT") node = figma.createComponent();
      else if (spec.type === "TEXT") node = figma.createText();
      else if (spec.type === "RECTANGLE") node = figma.createRectangle();
      else if (spec.type === "ELLIPSE") node = figma.createEllipse();
      add(node);
      save(spec, node, "node", { pageKey, parentKey });
      await currentFonts(node);
      node.name = spec.name;
      parent.appendChild(node);
      mark(parent);
      if (spec.type === "SVG") {
        const children = allDescendants(node);
        for (const n of children) add(n);
        records[spec.key].ownedDescendantIds = children.map((n) => n.id);
        records[spec.key].svgHash = input.svgHashes[spec.key];
      }
    }
    if (spec.type === "SVG" && records[spec.key].svgHash !== input.svgHashes[spec.key]) {
      // Keep the imported root identity. A changed SVG replaces only exact managed vector descendants.
      const owned = new Set(records[spec.key].ownedDescendantIds ?? []);
      const oldChildren = allDescendants(node);
      if (oldChildren.some((n) => !owned.has(n.id) && owned.has(n.parent?.id)))
        fail(`Designer content inside managed SVG geometry ${spec.key}; manual migration required`);
      const imported = figma.createNodeFromSvg(spec.svg);
      add(imported);
      const children = allDescendants(imported);
      for (const child of children) add(child);
      for (const child of [...node.children])
        if (owned.has(child.id)) {
          const removed = [child, ...allDescendants(child)];
          removed.forEach((n) => result.removedNodeIds.push(n.id));
          child.remove();
          mark(node);
        }
      for (const child of [...imported.children]) {
        node.appendChild(child);
        mark(child);
        mark(node);
      }
      imported.remove();
      result.removedNodeIds.push(imported.id);
      records[spec.key].ownedDescendantIds = children.map((n) => n.id);
      records[spec.key].svgHash = input.svgHashes[spec.key];
    }
    return await writeNode(spec, node, parent, pageKey, parentKey);
  };
  try {
    if (figma.editorType !== "figma")
      fail("Native library generation requires a Figma Design file");
    if (figma.fileKey && figma.fileKey !== fileKey)
      fail("Figma fileKey does not match the external ledger target");
    if (ledger.fileKey !== fileKey || ledger.package !== packageName)
      fail("External ledger identity mismatch");
    const available = await figma.listAvailableFontsAsync();
    for (const font of input.fonts) {
      if (
        !available.some((f) => f.fontName.family === font.family && f.fontName.style === font.style)
      )
        fail(`Required font unavailable: ${font.family} ${font.style}`);
      await loadFont(font);
    }
    if (batch.kind === "foundations") {
      const collections = await figma.variables.getLocalVariableCollectionsAsync();
      const variables = await figma.variables.getLocalVariablesAsync();
      const textStyles = await figma.getLocalTextStylesAsync();
      const effectStyles = await figma.getLocalEffectStylesAsync();
      for (const spec of batch.collections) {
        const record = records[spec.key];
        let collection = record ? collections.find((c) => c.id === record.id) : null;
        if (record && !collection) fail(`Managed collection missing: ${spec.key}`);
        if (!collection) {
          uniqueName(collections, spec, "collection");
          collection = figma.variables.createVariableCollection(spec.name);
          assetsCreated.add(collection.id);
          save(spec, collection, "collection", { modeIds: {} });
          collections.push(collection);
        }
        verifyUnchanged(spec, collection);
        if (needs(spec)) {
          if (!assetsCreated.has(collection.id)) assetsMutated.add(collection.id);
          collection.name = spec.name;
          for (const [i, name] of spec.modes.entries()) {
            let mode = collection.modes.find((m) => m.name === name);
            if (!mode && i === 0 && assetsCreated.has(collection.id)) {
              collection.renameMode(collection.defaultModeId, name);
              mode = { modeId: collection.defaultModeId, name };
            }
            if (!mode) mode = { modeId: collection.addMode(name), name };
            records[spec.key].modeIds[name] = mode.modeId;
          }
          for (const mode of collection.modes)
            if (!spec.modes.includes(mode.name))
              result.deprecated.push({
                key: `${spec.key}/mode/${mode.name}`,
                id: mode.modeId,
                type: "mode",
              });
          recordFingerprint(spec, collection);
          complete(spec);
        }
        objects.set(spec.key, collection);
      }
      // Allocate all variables before assigning aliases so order in the input is irrelevant.
      for (const spec of batch.variables) {
        const record = records[spec.key];
        let variable = record ? variables.find((v) => v.id === record.id) : null;
        if (record && !variable) fail(`Managed variable missing: ${spec.key}`);
        const collection =
          objects.get(spec.collection) ??
          (await figma.variables.getVariableCollectionByIdAsync(records[spec.collection].id));
        if (!variable) {
          uniqueName(
            variables.filter((v) => v.variableCollectionId === collection.id),
            spec,
            "variable",
          );
          variable = figma.variables.createVariable(spec.name, collection, spec.type);
          assetsCreated.add(variable.id);
          save(spec, variable, "variable");
          variables.push(variable);
        }
        if (variable.resolvedType !== spec.type || variable.variableCollectionId !== collection.id)
          fail(`Variable migration required: ${spec.key}`);
        if (!batch.allocateOnly) verifyUnchanged(spec, variable);
        objects.set(spec.key, variable);
      }
      for (const spec of batch.variables)
        if (!batch.allocateOnly && needs(spec)) {
          const variable = objects.get(spec.key);
          if (!assetsCreated.has(variable.id)) assetsMutated.add(variable.id);
          variable.name = spec.name;
          variable.scopes = spec.scopes;
          variable.description = spec.description ?? "";
          for (const [platform, syntax] of Object.entries(spec.codeSyntax))
            variable.setVariableCodeSyntax(platform, syntax);
          for (const platform of Object.keys(variable.codeSyntax ?? {}))
            if (!Object.hasOwn(spec.codeSyntax, platform))
              variable.removeVariableCodeSyntax(platform);
          for (const [mode, value] of Object.entries(spec.values))
            variable.setValueForMode(
              records[spec.collection].modeIds[mode],
              value?.alias
                ? { type: "VARIABLE_ALIAS", id: (await resolveVariable(value.alias)).id }
                : value,
            );
          recordFingerprint(spec, variable);
          complete(spec);
        }
      for (const [kind, specs, existing, create] of [
        ["textStyle", batch.textStyles, textStyles, () => figma.createTextStyle()],
        ["effectStyle", batch.effectStyles, effectStyles, () => figma.createEffectStyle()],
      ]) {
        for (const spec of specs) {
          const record = records[spec.key];
          let style = record ? existing.find((s) => s.id === record.id) : null;
          if (record && !style) fail(`Managed style missing: ${spec.key}`);
          if (!style) {
            uniqueName(existing, spec, kind);
            style = create();
            assetsCreated.add(style.id);
            save(spec, style, kind);
            existing.push(style);
          }
          verifyUnchanged(spec, style);
          if (needs(spec)) {
            if (!assetsCreated.has(style.id)) assetsMutated.add(style.id);
            if (kind === "textStyle") {
              await loadFont(style.fontName);
              await loadFont(spec.fontName);
            }
            for (const [field, value] of Object.entries(spec))
              if (!["key", "source"].includes(field)) style[field] = value;
            recordFingerprint(spec, style);
            complete(spec);
          }
        }
      }
    } else {
      const spec = batch.page;
      const record = records[spec.key];
      let page = record ? await figma.getNodeByIdAsync(record.id) : null;
      if (record && (!page || page.type !== "PAGE"))
        fail(`Managed page missing or wrong type: ${spec.key}`);
      if (!page) {
        uniqueName(figma.root.children, spec, "page");
        page = figma.createPage();
        add(page);
        page.name = spec.name;
        save(spec, page, "page");
      }
      await figma.setCurrentPageAsync(page);
      // Loading existing fonts is mandatory before moving/binding any descendant.
      for (const text of page.findAllWithCriteria({ types: ["TEXT"] })) await currentFonts(text);
      if (needs(spec)) {
        if (page.name !== spec.name) {
          page.name = spec.name;
          mark(page);
        }
      }
      if (input.flat) {
        for (const entry of batch.nodes) {
          const parent =
            entry.parentKey === spec.key
              ? page
              : await figma.getNodeByIdAsync(records[entry.parentKey]?.id);
          if (!parent) fail(`Missing parent ${entry.parentKey}`);
          await upsertNode(entry.spec, parent, spec.key, entry.parentKey);
        }
      } else for (const child of spec.children) await upsertNode(child, page, spec.key, spec.key);
      complete(spec);
    }

    ledger.completedBatches[batch.key] = input.batchHash;
    if (input.foundationComplete) ledger.completedBatches.foundations = input.foundationHash;
    if (input.finalBatch) ledger.appliedRelease = release;
    result.ok = true;
  } catch (error) {
    result.error = { message: String(error?.message ?? error), requiresCanvasRead: true };
  }
  result.createdNodeIds = [...created];
  result.mutatedNodeIds = [...mutated].filter((id) => !created.has(id));
  result.createdAssetIds = [...assetsCreated];
  result.mutatedAssetIds = [...assetsMutated];
  result.ledgerPatch = {
    entities: Object.fromEntries(
      Object.entries(records).filter(
        ([key, value]) => beforeRecords[key] !== JSON.stringify(value),
      ),
    ),
    completedBatches: result.ok
      ? {
          [batch.key]: input.batchHash,
          ...(input.foundationComplete ? { foundations: input.foundationHash } : {}),
        }
      : {},
    ...(result.ok && input.finalBatch ? { appliedRelease: release } : {}),
  };
  delete result.ledger;
  return result;
}
