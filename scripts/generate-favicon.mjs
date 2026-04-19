import sharp from "sharp";
import { readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const svg = readFileSync(path.join(__dirname, "../public/favicon.svg"));

for (const size of [32, 64, 180]) {
  await sharp(svg)
    .resize(size, size)
    .png()
    .toFile(path.join(__dirname, `../public/favicon-${size}.png`));
  console.log(`✅ favicon-${size}.png generated`);
}

// Also generate apple-touch-icon
await sharp(svg).resize(180, 180).png().toFile(path.join(__dirname, "../public/apple-touch-icon.png"));
console.log("✅ apple-touch-icon.png generated");
