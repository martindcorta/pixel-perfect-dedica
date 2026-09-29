// scripts/generate-html.mjs
// Reads the Vite build manifest and generates index.html for static hosting
import { readFileSync, writeFileSync, readdirSync } from "fs";
import path from "path";

const clientDist = "dist/client";
const assets = readdirSync(`${clientDist}/assets`);

const css = assets.find((f) => f.endsWith(".css"));
// entry JS is the largest non-GameCanvas bundle
const jsEntry = assets
  .filter((f) => f.endsWith(".js") && !f.startsWith("GameCanvas"))
  .sort((a, b) => {
    const sizeA = readFileSync(`${clientDist}/assets/${a}`).length;
    const sizeB = readFileSync(`${clientDist}/assets/${b}`).length;
    return sizeB - sizeA;
  })[0];

const html = `<!DOCTYPE html>
<html lang="es-MX">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>DEDICA Runner — Showcase 3D Interactivo</title>
    <meta name="description" content="Corre, esquiva y recolecta en un corredor 3D de DEDICA, directo en tu navegador." />
    <link rel="icon" href="./favicon.svg" type="image/svg+xml" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;600&family=Sora:wght@600;700;800&display=swap" />
    ${css ? `<link rel="stylesheet" href="./assets/${css}" />` : ""}
  </head>
  <body>
    <div id="root"></div>
    ${jsEntry ? `<script type="module" src="./assets/${jsEntry}"></script>` : ""}
  </body>
</html>`;

writeFileSync(`${clientDist}/index.html`, html, "utf-8");
console.log(`✅ Generated index.html (css: ${css}, js: ${jsEntry})`);
