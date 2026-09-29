/**
 * Central branding configuration.
 * Swap these values to rebrand the whole experience for another client.
 */
export const BRAND = {
  companyName: "DEDICA",
  tagline: "INTERACTIVE 3D SHOWCASE",
  websiteUrl: "https://dedica.com",
  ctaLabel: "BUILD SOMETHING LIKE THIS",
  achievement: "YOU UNLOCKED DEDICA",
  /** Logo cube face colors (top / left / right of the brand mark). */
  colors: {
    primary: "#0e9f4f", // green
    secondary: "#c8202e", // red
    tertiary: "#0c6fc0", // blue
    coin: "#f5c84c",
    gem: "#5ee7ff",
  },
  points: {
    coin: 10,
    brandedBox: 100,
    rareGem: 500,
  },
  runSeconds: 55,
} as const;
