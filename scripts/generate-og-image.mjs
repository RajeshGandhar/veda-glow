/**
 * Generates og-image.png (1200x630) for VedaGlow social sharing.
 * Run: node scripts/generate-og-image.mjs
 * Requires: sharp (already in devDependencies)
 */
import sharp from "sharp";
import { writeFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const svg = `
<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#083a2d"/>
      <stop offset="55%" style="stop-color:#0b4a39"/>
      <stop offset="100%" style="stop-color:#0f5f49"/>
    </linearGradient>
    <linearGradient id="card" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#ffffff;stop-opacity:0.12"/>
      <stop offset="100%" style="stop-color:#ffffff;stop-opacity:0.04"/>
    </linearGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="40" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
  </defs>

  <!-- Background -->
  <rect width="1200" height="630" fill="url(#bg)"/>

  <!-- Decorative blobs -->
  <circle cx="100" cy="100" r="220" fill="#f8d889" opacity="0.07"/>
  <circle cx="1150" cy="550" r="280" fill="#065f46" opacity="0.3"/>
  <circle cx="1050" cy="80" r="160" fill="#f8d889" opacity="0.05"/>

  <!-- Card background -->
  <rect x="60" y="60" width="1080" height="510" rx="32" fill="url(#card)" stroke="rgba(255,255,255,0.15)" stroke-width="1.5"/>

  <!-- Left content -->
  <!-- Badge -->
  <rect x="100" y="120" width="280" height="36" rx="18" fill="rgba(248,216,137,0.18)" stroke="rgba(248,216,137,0.35)" stroke-width="1"/>
  <text x="240" y="143" font-family="Georgia, serif" font-size="13" fill="#f8d889" text-anchor="middle" letter-spacing="2">AYURVEDIC SKINCARE</text>

  <!-- Brand name -->
  <text x="100" y="230" font-family="Georgia, serif" font-size="72" font-weight="700" fill="#ffffff" letter-spacing="-2">VedaGlow</text>

  <!-- Tagline -->
  <text x="100" y="290" font-family="Arial, sans-serif" font-size="28" fill="rgba(255,255,255,0.85)">Clear Skin in 28 Days,</text>
  <text x="100" y="328" font-family="Georgia, serif" font-size="28" font-style="italic" fill="#f8d889">Naturally.</text>

  <!-- Description -->
  <text x="100" y="390" font-family="Arial, sans-serif" font-size="18" fill="rgba(255,255,255,0.7)">Premium 3-step herbal kit for acne, oiliness</text>
  <text x="100" y="416" font-family="Arial, sans-serif" font-size="18" fill="rgba(255,255,255,0.7)">and dull skin. Starter offer at just ₹299.</text>

  <!-- Price pill -->
  <rect x="100" y="450" width="180" height="52" rx="26" fill="#f8d889"/>
  <text x="190" y="482" font-family="Georgia, serif" font-size="24" font-weight="700" fill="#173229" text-anchor="middle">₹299 Only</text>

  <!-- COD pill -->
  <rect x="296" y="450" width="200" height="52" rx="26" fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.3)" stroke-width="1"/>
  <text x="396" y="482" font-family="Arial, sans-serif" font-size="16" fill="rgba(255,255,255,0.9)" text-anchor="middle">COD Available ✓</text>

  <!-- Right side — 3 product steps -->
  <rect x="760" y="110" width="440" height="410" rx="24" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.1)" stroke-width="1"/>

  <!-- Step 1 -->
  <circle cx="810" cy="200" r="28" fill="rgba(248,216,137,0.2)" stroke="#f8d889" stroke-width="1.5"/>
  <text x="810" y="207" font-family="Georgia, serif" font-size="18" fill="#f8d889" text-anchor="middle">01</text>
  <text x="860" y="195" font-family="Arial, sans-serif" font-size="18" font-weight="700" fill="#ffffff">Daily Clean</text>
  <text x="860" y="218" font-family="Arial, sans-serif" font-size="14" fill="rgba(255,255,255,0.6)">Gentle Herbal Cleanser</text>

  <!-- Divider -->
  <line x1="800" y1="250" x2="1180" y2="250" stroke="rgba(255,255,255,0.1)" stroke-width="1"/>

  <!-- Step 2 -->
  <circle cx="810" cy="320" r="28" fill="rgba(248,216,137,0.2)" stroke="#f8d889" stroke-width="1.5"/>
  <text x="810" y="327" font-family="Georgia, serif" font-size="18" fill="#f8d889" text-anchor="middle">02</text>
  <text x="860" y="315" font-family="Arial, sans-serif" font-size="18" font-weight="700" fill="#ffffff">Glow Repair</text>
  <text x="860" y="338" font-family="Arial, sans-serif" font-size="14" fill="rgba(255,255,255,0.6)">Brightening &amp; Skin Repair</text>

  <!-- Divider -->
  <line x1="800" y1="370" x2="1180" y2="370" stroke="rgba(255,255,255,0.1)" stroke-width="1"/>

  <!-- Step 3 -->
  <circle cx="810" cy="440" r="28" fill="rgba(248,216,137,0.2)" stroke="#f8d889" stroke-width="1.5"/>
  <text x="810" y="447" font-family="Georgia, serif" font-size="18" fill="#f8d889" text-anchor="middle">03</text>
  <text x="860" y="435" font-family="Arial, sans-serif" font-size="18" font-weight="700" fill="#ffffff">Deep Detox</text>
  <text x="860" y="458" font-family="Arial, sans-serif" font-size="14" fill="rgba(255,255,255,0.6)">Herbal Detox Facial</text>

  <!-- Bottom domain -->
  <text x="600" y="598" font-family="Arial, sans-serif" font-size="16" fill="rgba(255,255,255,0.4)" text-anchor="middle" letter-spacing="1">vedaglows.com</text>
</svg>
`;

const outputPath = path.join(__dirname, "../public/og-image.png");

await sharp(Buffer.from(svg))
  .png()
  .toFile(outputPath);

console.log("✅ og-image.png generated at public/og-image.png");
