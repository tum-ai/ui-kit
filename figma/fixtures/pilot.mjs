/** Small real-tool acceptance fixture. Package name is supplied from package.json. */
export function pilotScene(packageName = "@tum.ai/ui-kit") {
  const fill = (r, g, b, variable) => ({
    type: "SOLID",
    color: { r, g, b },
    ...(variable ? { variable } : {}),
  });
  const label = (variant) => ({
    key: `pilot/button/${variant}/label`,
    name: "Label",
    type: "TEXT",
    width: 108,
    height: 24,
    text: {
      characters: "Get involved",
      fontName: { family: "Manrope", style: "SemiBold" },
      fontSize: 15,
      lineHeight: { unit: "PIXELS", value: 24 },
      letterSpacing: { unit: "PIXELS", value: 0 },
      textAutoResize: "HEIGHT",
    },
    fills: [fill(1, 1, 1, "pilot/color/white")],
    textStyle: "pilot/style/label",
    propertyReferences: { characters: "pilot/property/label" },
  });
  return {
    schemaVersion: 1,
    package: packageName,
    release: { version: "0.1.0-pilot", commit: "pilot" },
    collections: [{ key: "pilot/collection", name: "TUM.ai / Generation pilot", modes: ["Value"] }],
    variables: [
      {
        key: "pilot/color/white",
        collection: "pilot/collection",
        name: "color/white",
        type: "COLOR",
        scopes: ["TEXT_FILL"],
        codeSyntax: { WEB: "var(--color-white)" },
        values: { Value: { r: 1, g: 1, b: 1, a: 1 } },
      },
      {
        key: "pilot/color/primary",
        collection: "pilot/collection",
        name: "color/action",
        type: "COLOR",
        scopes: ["FRAME_FILL", "SHAPE_FILL"],
        codeSyntax: { WEB: "var(--color-violet-600)" },
        values: { Value: { r: 0.467, g: 0.29, b: 0.69, a: 1 } },
      },
      {
        key: "pilot/radius",
        collection: "pilot/collection",
        name: "radius/button",
        type: "FLOAT",
        scopes: ["CORNER_RADIUS"],
        codeSyntax: { WEB: "var(--radius-lg)" },
        values: { Value: 12 },
      },
      {
        key: "pilot/gap",
        collection: "pilot/collection",
        name: "spacing/button",
        type: "FLOAT",
        scopes: ["GAP"],
        codeSyntax: { WEB: "var(--spacing)" },
        values: { Value: 8 },
      },
    ],
    textStyles: [
      {
        key: "pilot/style/label",
        name: "TUM.ai / Pilot / Label",
        fontName: { family: "Manrope", style: "SemiBold" },
        fontSize: 15,
        lineHeight: { unit: "PIXELS", value: 24 },
        letterSpacing: { unit: "PIXELS", value: 0 },
      },
    ],
    effectStyles: [],
    pages: [
      {
        key: "pilot/page",
        name: "TUM.ai · Generator acceptance",
        children: [
          {
            key: "pilot/button",
            name: "Generation pilot / Button",
            type: "COMPONENT_SET",
            width: 380,
            height: 128,
            description:
              "Editable generator acceptance fixture; not a published production component.",
            componentProperties: [
              {
                key: "pilot/property/label",
                name: "Label",
                type: "TEXT",
                defaultValue: "Get involved",
              },
            ],
            children: ["Primary", "Outline"].map((variant, i) => ({
              key: `pilot/button/${variant}`,
              name: `Variant=${variant}`,
              type: "COMPONENT",
              width: 156,
              height: 48,
              x: 24 + i * 180,
              y: 40,
              layout: {
                mode: "HORIZONTAL",
                gap: 8,
                paddingLeft: 20,
                paddingRight: 20,
                paddingTop: 12,
                paddingBottom: 12,
                primaryAxisAlignItems: "CENTER",
                counterAxisAlignItems: "CENTER",
              },
              fills: [fill(0.467, 0.29, 0.69, "pilot/color/primary")],
              strokes: variant === "Outline" ? [fill(1, 1, 1)] : [],
              strokeWeight: 1,
              cornerRadius: 12,
              bindings: { cornerRadius: "pilot/radius", itemSpacing: "pilot/gap" },
              children: [label(variant)],
            })),
          },
        ],
      },
    ],
    diagnostics: [],
  };
}
