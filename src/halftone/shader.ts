/**
 * The halftone field: one full-screen triangle and one fragment shader.
 *
 * A grid of dots in "fabric" space (the poster's waves come from warping the
 * grid with slow, low-frequency sines), sized by a travelling wave and by the
 * distance from the centre (dense at the edges, clear behind the headline).
 * The dots warm toward the sun's colour near the sun and swell under the
 * pointer like a lens. All distances are in device pixels, so dots stay
 * round and crisp at any pixel ratio.
 */

/** One full-screen triangle. */
export const VERTEX_SHADER = /* glsl */ `#version 300 es
in vec2 aPosition;
void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

/** The dot field. */
export const FRAGMENT_SHADER = /* glsl */ `#version 300 es
precision highp float;

uniform vec2 uRes;         // drawing buffer, device px
uniform float uCell;       // grid cell, device px
uniform float uTime;       // seconds
uniform vec2 uPointer;     // device px, top-left origin
uniform float uPointerAmt; // 0..1, smoothed
uniform vec3 uSun;         // x, y (device px, top-left origin), radius
uniform float uRise;       // 0..1, the bloom outward from the sun
uniform float uDensity;    // 0..1, overall dot size
uniform vec3 uDot;         // dot colour
uniform vec3 uHot;         // dot colour next to the sun
uniform float uWarm;       // 0..1, how far the sun's warmth reaches
uniform vec4 uClear;       // soft clear rect (x0, y0, x1, y1), device px; x1 < x0 disables
uniform float uEdge;       // 0..1, how strongly dots favour the edges
uniform float uAlpha;      // overall opacity
uniform vec2 uFadeTop;     // dots grow from 0 to full between these heights (0..1 of the canvas); x >= y disables
uniform vec2 uFadeBottom;  // dots shrink to 0 between these heights; x >= y disables

out vec4 outColor;

float rectMask(vec2 p, vec4 r, float soft) {
  if (r.z < r.x) return 0.0;
  vec2 lo = smoothstep(r.xy - soft, r.xy + soft, p);
  vec2 hi = 1.0 - smoothstep(r.zw - soft, r.zw + soft, p);
  return lo.x * lo.y * hi.x * hi.y;
}

void main() {
  vec2 p = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y);

  // Pointer lens: sample space contracts toward the pointer, so the dots
  // under it grow and the grid bends around it.
  vec2 toPointer = p - uPointer;
  float lensRadius = uCell * 11.0;
  float lens = exp(-dot(toPointer, toPointer) / (lensRadius * lensRadius)) * uPointerAmt;
  vec2 sp = uPointer + toPointer * (1.0 - 0.38 * lens);

  // Fabric: warp the grid with slow waves.
  vec2 q = sp / uCell;
  float t = uTime;
  q += vec2(
    sin(q.y * 0.071 + t * 0.11) * 2.1 + sin(q.y * 0.029 + q.x * 0.017 - t * 0.07) * 3.2,
    sin(q.x * 0.058 - t * 0.09) * 1.7 + sin((q.x + q.y) * 0.023 + t * 0.05) * 2.6
  );
  vec2 id = floor(q);
  vec2 f = fract(q) - 0.5;

  // Size: a travelling wave across the grid.
  float wave = 0.5 + 0.5 * sin(id.x * 0.13 + id.y * 0.08 - t * 0.42) * cos(id.y * 0.05 - id.x * 0.02 + t * 0.21);

  // Dense toward the edges, as on the posters.
  vec2 uv = p / uRes;
  vec2 e = (uv - vec2(0.5, 0.46)) * vec2(uRes.x / uRes.y, 1.0);
  float edge = mix(1.0, smoothstep(0.22, 1.05, length(e)), uEdge);

  // Distance from the sun, for the bloom and the warmth.
  vec2 toSun = p - uSun.xy;
  float sunDist = length(toSun);
  float diag = length(uRes);
  float bloom = clamp((uRise * 1.35 - sunDist / diag) * 3.2, 0.0, 1.0);
  bloom = bloom * bloom * (3.0 - 2.0 * bloom);
  float warm = exp(-pow(sunDist / max(uSun.z * 5.5, 1.0), 2.0)) * uWarm;

  float clearZone = rectMask(p, uClear, uCell * 4.0);

  // Organic edges: near a faded edge the dots shrink one by one along a slow,
  // wavy line (the halftone way to dissolve), instead of fading as a block.
  float y = p.y / uRes.y;
  float wobble = (sin(p.x / uCell * 0.19 + t * 0.23) * 2.4 + sin(p.x / uCell * 0.061 - t * 0.13) * 4.2) * uCell / uRes.y;
  float edges = 1.0;
  if (uFadeTop.x < uFadeTop.y) edges *= smoothstep(uFadeTop.x, uFadeTop.y, y + wobble);
  if (uFadeBottom.x < uFadeBottom.y) edges *= 1.0 - smoothstep(uFadeBottom.x, uFadeBottom.y, y + wobble);

  float radius = (0.07 + 0.38 * edge) * (0.45 + 0.55 * wave);
  radius *= mix(1.0, 0.12, clearZone);
  radius *= mix(1.0, 1.35, lens);
  radius *= uDensity * bloom * edges;
  radius = min(radius, 0.46);

  float d = length(f) * uCell;
  float r = radius * uCell;
  float a = 1.0 - smoothstep(r - 0.85, r + 0.85, d);
  if (r < 0.35) a = 0.0;

  vec3 colour = mix(uDot, uHot, clamp(warm + lens * 0.55, 0.0, 1.0));
  a *= uAlpha * (0.5 + 0.5 * max(warm, edge * 0.8));
  outColor = vec4(colour * a, a);
}
`;
