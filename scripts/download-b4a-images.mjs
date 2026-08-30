/**
 * Download KO card images for B4a (로켓단의 야망) from CloudFront
 * and map sequence N → public/cards/19/{19200+N}.webp
 *
 * Usage: node scripts/download-b4a-images.mjs [--end=72]
 */
import fs from "fs";
import path from "path";

const PACK = "b4a-kr";
const BASE_URL = `https://d3srn7o0cx0b14.cloudfront.net/card/${PACK}`;
const ID_BASE = 19200;
const OUT_DIR = path.join("public", "cards", "19");

const endArg = process.argv.find((a) => a.startsWith("--end="));
const END = endArg ? Number(endArg.split("=")[1]) : 72;

const UA = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
};

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function downloadOne(seq) {
  const url = `${BASE_URL}/${seq}.webp`;
  const res = await fetch(url, { headers: UA });
  if (!res.ok) {
    throw new Error(`${res.status} ${url}`);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 1000) {
    throw new Error(`too small (${buf.length} bytes) ${url}`);
  }
  return buf;
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  let ok = 0;
  let fail = 0;
  const failed = [];

  for (let i = 1; i <= END; i++) {
    const outPath = path.join(OUT_DIR, `${ID_BASE + i}.webp`);
    process.stdout.write(`\r  ${i}/${END}`.padEnd(20));
    try {
      const buf = await downloadOne(i);
      fs.writeFileSync(outPath, buf);
      ok++;
    } catch (e) {
      fail++;
      failed.push({ i, error: String(e.message || e) });
      console.log(`\nFAIL ${i}: ${e.message || e}`);
    }
    await sleep(80);
  }

  console.log(`\nDone: ${ok} ok, ${fail} failed → ${OUT_DIR}`);
  if (failed.length) {
    console.log("Failed:", failed);
    process.exitCode = 1;
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
