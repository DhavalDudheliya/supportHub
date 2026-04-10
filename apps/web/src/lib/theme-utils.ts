/**
 * Theme Color Utilities
 *
 * Pure math functions for converting hex colors to oklch format and
 * generating a full CSS variable palette from primary + accent colors.
 *
 * The pipeline: hex → sRGB → linear RGB → OKLAB → oklch
 * No external dependencies — all color math is self-contained (~100 lines).
 */

// ─── Color Conversion Pipeline ────────────────────────────────────────────────

/** Parse a hex color string to [r, g, b] in 0-255 range. */
function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

/** Convert sRGB channel (0-255) to linear RGB (0-1). */
function srgbToLinear(c: number): number {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

/** Convert linear RGB to OKLAB (L, a, b). */
function linearRgbToOklab(
  r: number,
  g: number,
  b: number,
): [number, number, number] {
  const l_ = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b;
  const m_ = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b;
  const s_ = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b;

  const l = Math.cbrt(l_);
  const m = Math.cbrt(m_);
  const s = Math.cbrt(s_);

  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

/** Convert OKLAB to oklch (L, C, H). */
function oklabToOklch(
  L: number,
  a: number,
  b: number,
): [number, number, number] {
  const C = Math.sqrt(a * a + b * b);
  let H = (Math.atan2(b, a) * 180) / Math.PI;
  if (H < 0) H += 360;
  return [L, C, H];
}

// ─── Public API ───────────────────────────────────────────────────────────────

/** Convert a hex color to an oklch CSS value string. */
export function hexToOklch(hex: string): string {
  const [r, g, b] = hexToRgb(hex);
  const [lr, lg, lb] = [srgbToLinear(r), srgbToLinear(g), srgbToLinear(b)];
  const [L, a, bVal] = linearRgbToOklab(lr, lg, lb);
  const [oL, oC, oH] = oklabToOklch(L, a, bVal);
  return `oklch(${round(oL)} ${round(oC)} ${round(oH)})`;
}

/** Get the relative luminance of a hex color (0-1 scale). */
export function getLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex);
  return (
    0.2126 * srgbToLinear(r) +
    0.7152 * srgbToLinear(g) +
    0.0722 * srgbToLinear(b)
  );
}

/** Generate oklch at a specific lightness, preserving hue and adjusting chroma. */
function oklchAtLightness(hex: string, targetL: number): string {
  const [r, g, b] = hexToRgb(hex);
  const [lr, lg, lb] = [srgbToLinear(r), srgbToLinear(g), srgbToLinear(b)];
  const [L, a, bVal] = linearRgbToOklab(lr, lg, lb);
  const [, C, H] = oklabToOklch(L, a, bVal);
  // Scale chroma proportionally — lighter colors need less chroma to stay in gamut
  const chromaScale = targetL > 0.5 ? (1 - targetL) / 0.5 : targetL / 0.5;
  const adjustedC = C * Math.min(chromaScale * 1.5, 1);
  return `oklch(${round(targetL)} ${round(adjustedC)} ${round(H)})`;
}

function round(n: number): string {
  return Number(n.toFixed(4)).toString();
}

// ─── Palette Generation ───────────────────────────────────────────────────────

export interface ThemeConfig {
  primaryColor: string;
  accentColor: string;
  fontFamily: string;
  borderRadius: number;
}

/**
 * Generate the full set of CSS variable overrides for both light and dark modes.
 *
 * From just primary + accent hex colors, this produces ~30 CSS variable values
 * that override the defaults in globals.css.
 */
export function generatePalette(config: ThemeConfig): {
  light: Record<string, string>;
  dark: Record<string, string>;
  shared: Record<string, string>;
} {
  const { primaryColor, accentColor, fontFamily, borderRadius } = config;

  const primaryOklch = hexToOklch(primaryColor);
  const primaryIsDark = getLuminance(primaryColor) < 0.4;

  // Primary foreground: white on dark primary, dark on light primary
  const primaryFg = primaryIsDark ? "oklch(1 0 0)" : "oklch(0.2 0 0)";

  // Accent tints for light mode (very light wash) and dark mode (deep shade)
  const accentLightBg = oklchAtLightness(accentColor, 0.95);
  const accentLightFg = oklchAtLightness(accentColor, 0.38);
  const accentDarkBg = oklchAtLightness(accentColor, 0.38);
  const accentDarkFg = oklchAtLightness(accentColor, 0.88);

  // Chart colors: 5 stops along the primary hue at different lightness levels
  const chartLightnesses = [0.71, 0.62, 0.55, 0.49, 0.42];
  const chartColors = chartLightnesses.map((l) =>
    oklchAtLightness(primaryColor, l),
  );

  // Subtle hue tint for neutrals — adds warmth/coolness matching brand
  const [, , , bVal] = (() => {
    const [r, g, b] = hexToRgb(primaryColor);
    const [lr, lg, lb] = [srgbToLinear(r), srgbToLinear(g), srgbToLinear(b)];
    const [L, a, bV] = linearRgbToOklab(lr, lg, lb);
    const [, , H] = oklabToOklch(L, a, bV);
    return [L, a, bV, H];
  })();
  const hue = round(bVal);
  const tint = 0.005; // Very subtle chroma tint

  const light: Record<string, string> = {
    "--primary": primaryOklch,
    "--primary-foreground": primaryFg,
    "--accent": accentLightBg,
    "--accent-foreground": accentLightFg,
    "--ring": primaryOklch,
    "--sidebar-primary": primaryOklch,
    "--sidebar-primary-foreground": primaryFg,
    "--sidebar-accent": accentLightBg,
    "--sidebar-accent-foreground": accentLightFg,
    "--sidebar-ring": primaryOklch,
    "--chart-1": chartColors[0]!,
    "--chart-2": chartColors[1]!,
    "--chart-3": chartColors[2]!,
    "--chart-4": chartColors[3]!,
    "--chart-5": chartColors[4]!,
    // Full palette generation
    "--background": `oklch(0.995 ${round(tint * 0.2)} ${hue})`,
    "--foreground": `oklch(0.15 ${round(tint * 2)} ${hue})`,
    "--card": `oklch(1 0 0)`,
    "--card-foreground": `oklch(0.15 ${round(tint * 2)} ${hue})`,
    "--popover": `oklch(1 0 0)`,
    "--popover-foreground": `oklch(0.15 ${round(tint * 2)} ${hue})`,
    "--muted": `oklch(0.97 ${round(tint)} ${hue})`,
    "--muted-foreground": `oklch(0.551 ${round(tint * 4)} ${hue})`,
    "--secondary": `oklch(0.96 ${round(tint * 1.5)} ${hue})`,
    "--secondary-foreground": `oklch(0.15 ${round(tint * 2)} ${hue})`,
    "--border": `oklch(0.92 ${round(tint * 1.2)} ${hue})`,
    "--input": `oklch(0.92 ${round(tint * 1.2)} ${hue})`,
    "--sidebar": `oklch(0.9846 ${round(tint)} ${hue})`,
    "--sidebar-border": `oklch(0.92 ${round(tint * 1.2)} ${hue})`,
  };

  const dark: Record<string, string> = {
    "--primary": primaryOklch,
    "--primary-foreground": primaryFg,
    "--accent": accentDarkBg,
    "--accent-foreground": accentDarkFg,
    "--ring": primaryOklch,
    "--sidebar-primary": primaryOklch,
    "--sidebar-primary-foreground": primaryFg,
    "--sidebar-accent": accentDarkBg,
    "--sidebar-accent-foreground": accentDarkFg,
    "--sidebar-ring": primaryOklch,
    "--chart-1": chartColors[0]!,
    "--chart-2": chartColors[1]!,
    "--chart-3": chartColors[2]!,
    "--chart-4": chartColors[3]!,
    "--chart-5": chartColors[4]!,

    // Deep, premium dark mode structural colors
    "--background": `oklch(0.145 ${round(tint)} ${hue})`,
    "--foreground": `oklch(0.98 ${round(tint)} ${hue})`,
    "--card": `oklch(0.175 ${round(tint * 1.5)} ${hue})`,
    "--card-foreground": `oklch(0.98 ${round(tint)} ${hue})`,
    "--popover": `oklch(0.175 ${round(tint * 1.5)} ${hue})`,
    "--popover-foreground": `oklch(0.98 ${round(tint)} ${hue})`,
    "--muted": `oklch(0.22 ${round(tint * 2)} ${hue})`,
    "--muted-foreground": `oklch(0.70 ${round(tint * 2)} ${hue})`,
    "--secondary": `oklch(0.22 ${round(tint * 2)} ${hue})`,
    "--secondary-foreground": `oklch(0.98 ${round(tint)} ${hue})`,
    "--border": `oklch(0.24 ${round(tint * 2)} ${hue})`,
    "--input": `oklch(0.24 ${round(tint * 2)} ${hue})`,
    "--sidebar": `oklch(0.16 ${round(tint)} ${hue})`,
    "--sidebar-border": `oklch(0.22 ${round(tint * 2)} ${hue})`,
  };

  const shared: Record<string, string> = {
    "--font-sans": `${fontFamily}, sans-serif`,
    "--radius": `${borderRadius}rem`,
  };

  return { light, dark, shared };
}
