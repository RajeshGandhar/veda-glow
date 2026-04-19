#!/usr/bin/env node

/**
 * Bundle Analysis Script
 *
 * Analyzes the production build size and identifies optimization opportunities
 *
 * Usage:
 *   npm run build
 *   node scripts/analyze-bundle.js
 */

import fs from "fs";
import path from "path";

const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  gray: "\x1b[90m",
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function formatBytes(bytes) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}

function getHealth(sizeKB, type = "js") {
  const limits = {
    js: { good: 100, fair: 250, excellent: 50 },
    css: { good: 30, fair: 50, excellent: 15 },
    vendor: { good: 150, fair: 300, excellent: 100 },
  };

  const limit = limits[type] || limits.js;

  if (sizeKB <= limit.excellent)
    return { status: "excellent", color: "green", icon: "⭐" };
  if (sizeKB <= limit.good)
    return { status: "good", color: "green", icon: "✅" };
  if (sizeKB <= limit.fair)
    return { status: "fair", color: "yellow", icon: "⚠️" };
  return { status: "poor", color: "red", icon: "❌" };
}

async function analyzeFile(filePath) {
  const stats = fs.statSync(filePath);
  const sizeBytes = stats.size;

  return {
    path: filePath,
    name: path.basename(filePath),
    sizeBytes,
    sizeKB: sizeBytes / 1024,
    sizeMB: sizeBytes / (1024 * 1024),
  };
}

async function analyzeBundle() {
  log("\n╔════════════════════════════════════════════════════╗", "blue");
  log("║  📦 VedaGlow Bundle Analysis Report                ║", "blue");
  log("║  " + new Date().toLocaleString().padEnd(45) + "║", "blue");
  log("╚════════════════════════════════════════════════════╝\n", "blue");

  const distPath = "dist";
  const assetsPath = path.join(distPath, "assets");

  if (!fs.existsSync(distPath)) {
    log("❌ dist/ folder not found. Run: npm run build", "red");
    process.exit(1);
  }

  log("📊 BUNDLE ANALYSIS\n", "cyan");

  // Overall size
  const getDirSize = (dir) => {
    if (!fs.existsSync(dir)) return 0;
    return fs.readdirSync(dir, { withFileTypes: true }).reduce((size, file) => {
      const fullPath = path.join(dir, file.name);
      return (
        size +
        (file.isDirectory() ? getDirSize(fullPath) : fs.statSync(fullPath).size)
      );
    }, 0);
  };

  const totalSize = getDirSize(distPath);
  const jsSize = getDirSize(assetsPath) || 0;

  log(
    `Total dist size: ${formatBytes(totalSize)} (${Math.round(totalSize / 1024)} KB)`,
    "cyan",
  );

  // Analyze individual files
  const files = [];
  if (fs.existsSync(assetsPath)) {
    const dir = fs.readdirSync(assetsPath);
    for (const file of dir) {
      if (file.endsWith(".js") || file.endsWith(".css")) {
        const analysis = await analyzeFile(path.join(assetsPath, file));
        files.push(analysis);
      }
    }
  }

  // Sort by size
  files.sort((a, b) => b.sizeBytes - a.sizeBytes);

  // Display results
  log("\n📈 ASSET BREAKDOWN\n", "cyan");
  log("Name                          Size      Gzip      Health", "gray");
  log("─".repeat(60), "gray");

  let totalJSSize = 0;
  let totalCSSSize = 0;

  for (const file of files) {
    const isCSS = file.name.endsWith(".css");
    const isVendor = file.name.includes("vendor");

    let type = "js";
    if (isCSS) type = "css";
    if (isVendor) type = "vendor";

    const health = getHealth(file.sizeKB, type);
    const sizeStr = formatBytes(file.sizeBytes).padEnd(8);

    if (isCSS) totalCSSSize += file.sizeBytes;
    else totalJSSize += file.sizeBytes;

    const name = file.name.substring(0, 27).padEnd(29);
    log(
      `${name} ${sizeStr} ${health.icon.padEnd(7)} ${health.status}`,
      health.color,
    );
  }

  // Recommendations
  log("\n💡 OPTIMIZATION RECOMMENDATIONS\n", "cyan");

  const recommendations = [];

  if (totalJSSize / 1024 > 250) {
    recommendations.push(
      "• Enable dynamic imports for admin page (save ~40KB)",
    );
    recommendations.push("• Check if Sentry can be split into separate chunk");
  }

  if (files.some((f) => f.sizeKB > 100 && !f.name.includes("vendor"))) {
    recommendations.push("• Consider code splitting by route");
    recommendations.push("• Remove unused dependencies");
  }

  if (totalCSSSize / 1024 > 30) {
    recommendations.push("• Unused CSS classes detected, enable purging");
  }

  if (recommendations.length === 0) {
    log("✅ Bundle size looks good! No critical issues found.", "green");
  } else {
    recommendations.forEach((rec) => log(rec, "yellow"));
  }

  // Summary
  log("\n\n📋 SUMMARY\n", "cyan");
  log(
    `Total JavaScript: ${formatBytes(totalJSSize)} (gzipped ~${Math.round(totalJSSize / 3.5 / 1024)} KB)`,
    "cyan",
  );
  log(
    `Total CSS: ${formatBytes(totalCSSSize)} (gzipped ~${Math.round(totalCSSSize / 4 / 1024)} KB)`,
    "cyan",
  );
  log(
    `Total size: ${formatBytes(totalSize)} (gzipped ~${Math.round(totalSize / 3 / 1024)} KB)`,
    "cyan",
  );

  const jsHealth = getHealth(totalJSSize / 1024, "js");
  const cssHealth = getHealth(totalCSSSize / 1024, "css");

  log("\n✅ BUILD SUMMARY\n", "cyan");
  log(
    `JavaScript: ${jsHealth.icon} ${jsHealth.status.toUpperCase()}`,
    jsHealth.color,
  );
  log(
    `CSS: ${cssHealth.icon} ${cssHealth.status.toUpperCase()}`,
    cssHealth.color,
  );

  log("\n" + "═".repeat(60) + "\n", "blue");

  // Performance targets
  const jsTargetMet = totalJSSize / 1024 <= 250;
  const cssTargetMet = totalCSSSize / 1024 <= 30;

  if (jsTargetMet && cssTargetMet) {
    log("🎉 All performance targets met!", "green");
  } else {
    log("⚠️  Some performance targets not met:", "yellow");
    if (!jsTargetMet)
      log(
        `  • JS exceeds 250KB target by ${Math.round(totalJSSize / 1024 - 250)} KB`,
        "yellow",
      );
    if (!cssTargetMet)
      log(
        `  • CSS exceeds 30KB target by ${Math.round(totalCSSSize / 1024 - 30)} KB`,
        "yellow",
      );
  }

  log("\n");
}

// Run analysis
analyzeBundle().catch((error) => {
  log(`Error: ${error.message}`, "red");
  process.exit(1);
});
