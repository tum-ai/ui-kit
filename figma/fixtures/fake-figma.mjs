/** Minimal stateful Plugin API adapter for reconciliation invariants, not visual/API proof. */
export function fakeFigma(fileKey = "test-file") {
  let serial = 0,
    failAfter = Infinity;
  const nodes = new Map(),
    collections = [],
    variables = [],
    textStyles = [],
    effectStyles = [],
    loaded = new Set();
  const api = { editorType: "figma", fileKey, mixed: Symbol("mixed"), writes: 0 };
  const write = () => {
    api.writes++;
    if (--failAfter === 0) {
      failAfter = Infinity;
      throw new Error("Injected mutation failure");
    }
  };
  api.failAfter = (count) => {
    failAfter = count;
  };
  const id = () => `0:${++serial}`;
  class Node {
    constructor(type) {
      this.id = id();
      this.type = type;
      this.name = type;
      this.width = 100;
      this.height = 100;
      this.x = 0;
      this.y = 0;
      this.parent = null;
      this.children = [];
      this.layoutMode = "NONE";
      this.fills = [];
      this.strokes = [];
      this.effects = [];
      this.boundVariables = {};
      this.definitions = {};
      this.explicitModes = {};
      if (type === "TEXT") {
        this.fontName = { family: "Inter", style: "Regular" };
        this.characters = "";
        this.textStyleId = "";
      }
      nodes.set(this.id, this);
    }
    appendChild(child) {
      write();
      if (child.parent) child.parent.children = child.parent.children.filter((c) => c !== child);
      child.parent = this;
      this.children.push(child);
    }
    insertChild(index, child) {
      write();
      if (child.parent) child.parent.children = child.parent.children.filter((c) => c !== child);
      child.parent = this;
      this.children.splice(index, 0, child);
    }
    resize(width, height) {
      write();
      this.width = width;
      this.height = height;
      this.layoutSizingHorizontal = "FIXED";
      this.layoutSizingVertical = "FIXED";
    }
    findAllWithCriteria({ types }) {
      return this.children.flatMap((n) => [
        ...(types.includes(n.type) ? [n] : []),
        ...n.findAllWithCriteria({ types }),
      ]);
    }
    getStyledTextSegments() {
      return this.characters ? [{ fontName: this.fontName }] : [];
    }
    setBoundVariable(field, variable) {
      write();
      if (variable) this.boundVariables[field] = { type: "VARIABLE_ALIAS", id: variable.id };
      else delete this.boundVariables[field];
    }
    setExplicitVariableModeForCollection(collection, mode) {
      write();
      this.explicitModes[collection.id] = mode;
    }
    clearExplicitVariableModeForCollection(collection) {
      write();
      delete this.explicitModes[collection.id];
    }
    async setTextStyleIdAsync(styleId) {
      write();
      this.textStyleId = styleId;
    }
    async setEffectStyleIdAsync(styleId) {
      write();
      this.effectStyleId = styleId;
    }
    get componentPropertyDefinitions() {
      if (this.type === "COMPONENT" && this.parent?.type === "COMPONENT_SET")
        throw new Error("Variant property owner getter");
      return this.definitions;
    }
    addComponentProperty(name, type, defaultValue) {
      write();
      const prop = `${name}#${id()}`;
      this.definitions[prop] = { type, defaultValue };
      return prop;
    }
    editComponentProperty(prop, value) {
      write();
      this.definitions[prop] = { ...this.definitions[prop], ...value };
      return prop;
    }
    remove() {
      write();
      if (this.parent) this.parent.children = this.parent.children.filter((c) => c !== this);
      for (const child of [...this.children]) child.remove();
      nodes.delete(this.id);
    }
  }
  for (const field of [
    "FontName",
    "FontSize",
    "LineHeight",
    "LetterSpacing",
    "Fills",
    "TextDecoration",
    "TextCase",
  ])
    Node.prototype[`setRange${field}`] = function (start, end, value) {
      write();
      (this.ranges ??= []).push({ start, end, field, value });
    };
  api.root = new Node("DOCUMENT");
  api.currentPage = new Node("PAGE");
  api.root.appendChild(api.currentPage);
  const createNode = (type) => {
    write();
    const node = new Node(type);
    (type === "PAGE" ? api.root : api.currentPage).appendChild(node);
    return node;
  };
  Object.assign(api, {
    createPage: () => createNode("PAGE"),
    createFrame: () => createNode("FRAME"),
    createAutoLayout: (mode) => {
      const n = createNode("FRAME");
      n.layoutMode = mode;
      return n;
    },
    createComponent: () => createNode("COMPONENT"),
    createRectangle: () => createNode("RECTANGLE"),
    createEllipse: () => createNode("ELLIPSE"),
    createText: () => createNode("TEXT"),
    createNodeFromSvg: () => {
      const root = createNode("FRAME");
      root.appendChild(createNode("VECTOR"));
      return root;
    },
    createImage: () => ({ hash: "image-hash" }),
    combineAsVariants: (variants, parent) => {
      const set = createNode("COMPONENT_SET");
      parent.appendChild(set);
      variants.forEach((v) => set.appendChild(v));
      return set;
    },
    setCurrentPageAsync: async (page) => {
      api.currentPage = page;
    },
    getNodeByIdAsync: async (nodeId) => nodes.get(nodeId) ?? null,
    listAvailableFontsAsync: async () =>
      ["Regular", "SemiBold", "Light", "Medium"].map((style) => ({
        fontName: { family: "Manrope", style },
      })),
    loadFontAsync: async (font) => {
      loaded.add(`${font.family}/${font.style}`);
    },
  });
  api.variables = {
    getLocalVariableCollectionsAsync: async () => [...collections],
    getLocalVariablesAsync: async () => [...variables],
    getVariableByIdAsync: async (value) => variables.find((v) => v.id === value) ?? null,
    getVariableCollectionByIdAsync: async (value) =>
      collections.find((v) => v.id === value) ?? null,
    createVariableCollection: (name) => {
      write();
      const modeId = id();
      const c = {
        id: id(),
        name,
        modes: [{ modeId, name: "Mode 1" }],
        defaultModeId: modeId,
        renameMode: (mode, name) => {
          write();
          c.modes.find((m) => m.modeId === mode).name = name;
        },
        addMode: (name) => {
          write();
          const modeId = id();
          c.modes.push({ modeId, name });
          return modeId;
        },
      };
      collections.push(c);
      return c;
    },
    createVariable: (name, collection, type) => {
      write();
      const v = {
        id: id(),
        name,
        resolvedType: type,
        variableCollectionId: collection.id,
        valuesByMode: {},
        codeSyntax: {},
        setVariableCodeSyntax: (platform, value) => {
          write();
          v.codeSyntax[platform] = value;
        },
        removeVariableCodeSyntax: (platform) => {
          write();
          delete v.codeSyntax[platform];
        },
        setValueForMode: (mode, value) => {
          write();
          v.valuesByMode[mode] = value;
        },
      };
      variables.push(v);
      return v;
    },
    setBoundVariableForPaint: (paint, field, variable) => ({
      ...paint,
      boundVariables: { [field]: { type: "VARIABLE_ALIAS", id: variable.id } },
    }),
  };
  const style = (type, items) => {
    write();
    const s = { id: id(), type, fontName: { family: "Inter", style: "Regular" } };
    items.push(s);
    return s;
  };
  api.getLocalTextStylesAsync = async () => [...textStyles];
  api.getLocalEffectStylesAsync = async () => [...effectStyles];
  api.createTextStyle = () => style("TEXT", textStyles);
  api.createEffectStyle = () => style("EFFECT", effectStyles);
  api.snapshot = () => ({ nodes, collections, variables, textStyles, effectStyles, loaded });
  api.writes = 0;
  return api;
}
