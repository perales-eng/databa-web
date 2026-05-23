import sharp from "sharp";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const svg = readFileSync(resolve(root, "public/icon.svg"));

type Target = { name: string; size: number; padding?: number };

const targets: Target[] = [
  { name: "icon-192.png", size: 192 },
  { name: "icon-512.png", size: 512 },
  // Maskable: padding interno para que cumpla safe-zone (10% inset).
  { name: "icon-maskable-512.png", size: 512, padding: 0.1 },
  { name: "apple-touch-icon.png", size: 180 },
];

async function main() {
  for (const t of targets) {
    let pipeline = sharp(svg, { density: 384 });
    if (t.padding) {
      const inner = Math.round(t.size * (1 - 2 * t.padding));
      const offset = Math.round(t.size * t.padding);
      pipeline = sharp({
        create: {
          width: t.size,
          height: t.size,
          channels: 4,
          background: { r: 15, g: 118, b: 110, alpha: 1 },
        },
      }).composite([
        {
          input: await sharp(svg, { density: 384 })
            .resize(inner, inner)
            .png()
            .toBuffer(),
          left: offset,
          top: offset,
        },
      ]);
    } else {
      pipeline = pipeline.resize(t.size, t.size);
    }
    const out = await pipeline.png().toBuffer();
    writeFileSync(resolve(root, "public", t.name), out);
    console.log(`✓ ${t.name} (${t.size}×${t.size}, ${out.length} bytes)`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
