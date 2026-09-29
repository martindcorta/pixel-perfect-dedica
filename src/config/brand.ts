/**
 * Central branding configuration.
 * Swap these values to rebrand the whole experience for another client.
 */
export const BRAND = {
  companyName: "DEDICA",
  tagline: "SHOWCASE 3D INTERACTIVO",
  websiteUrl: "https://dedica.com",
  ctaLabel: "CREA ALGO COMO ESTO",
  achievement: "¡DESBLOQUEASTE DEDICA!",
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
