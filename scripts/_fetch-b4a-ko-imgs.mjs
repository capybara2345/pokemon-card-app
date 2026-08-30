import fs from "fs";
import { mkdirSync } from "fs";

const UA = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  Referer: "https://pocket.limitlesstcg.com/",
};

mkdirSync("tmp-b4a-ko-imgs", { recursive: true });

const CARDS = [
  { n: 5, label: "serperior" },
  { n: 20, label: "electrode" },
  { n: 26, label: "slowking" },
  { n: 43, label: "weezing" },
  { n: 51, label: "gholdengo" },
  { n: 54, label: "garchomp" },
  { n: 59, label: "raticate" },
  { n: 62, label: "kecleon" },
  { n: 64, label: "furfrou" },
];

async function fetchHtml(n) {
  const res = await fetch(`https://pocket.limitlesstcg.com/cards/B4a/${n}`, {
    headers: UA,
  });
  if (!res.ok) throw new Error(`page ${n} ${res.status}`);
  return res.text();
}

async function tryDownload(url, path) {
  const res = await fetch(url, {
    headers: {
      ...UA,
      Referer: "https://pocket.limitlesstcg.com/",
      Origin: "https://pocket.limitlesstcg.com",
    },
  });
  if (!res.ok) return false;
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 1000) return false;
  fs.writeFileSync(path, buf);
  return buf.length;
}

for (const c of CARDS) {
  const html = await fetchHtml(c.n);
  const og =
    html.match(/og:image" content="([^"]+)/)?.[1] ||
    html.match(/src="(https:\/\/limitlesstcg[^"]+B4a_[^"]+)"/)?.[1];
  console.log(c.n, c.label, "og", og);
  if (!og) continue;

  const variants = [
    og,
    og.replace(/_EN/i, "_KO"),
    og.replace(/_EN/i, "_KR"),
    og.replace(/_EN_SM/i, "_KO_SM"),
    og.replace(/_EN_SM/i, "_KO"),
    og.replace(/_SM\.webp$/i, ".webp").replace(/_EN/i, "_KO"),
  ];

  for (const url of [...new Set(variants)]) {
    const path = `tmp-b4a-ko-imgs/${c.label}_${url.includes("_KO") || url.includes("_KR") ? "KO" : "EN"}.webp`;
    const size = await tryDownload(url, path);
    console.log(" ", size ? `OK ${size}` : "fail", url.split("/").pop());
  }
}
