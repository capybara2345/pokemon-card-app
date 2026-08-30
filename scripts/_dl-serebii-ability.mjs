import fs from "fs";
import { mkdirSync } from "fs";

mkdirSync("tmp-b4a-ko-imgs", { recursive: true });

const UA = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  Referer: "https://www.serebii.net/",
};

const abilityCards = [
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

async function download(n, label) {
  const url = `https://www.serebii.net/tcgpocket/teamrocket'sambition/${n}.jpg`;
  const res = await fetch(url, { headers: UA });
  if (!res.ok) {
    console.log("fail", n, res.status);
    return;
  }
  const buf = Buffer.from(await res.arrayBuffer());
  const path = `tmp-b4a-ko-imgs/${String(n).padStart(3, "0")}_${label}.jpg`;
  fs.writeFileSync(path, buf);
  console.log("OK", path, buf.length);
}

for (const c of abilityCards) {
  await download(c.n, c.label);
}

// pokehub HTML dump for KO text if any
const hub = await fetch(
  "https://pocket.pokemongohub.net/en/card/b4a-059-team-rockets-raticate-ex",
  { headers: UA }
);
const html = await hub.text();
fs.writeFileSync("tmp-b4a-ko-imgs/hub-raticate.html", html);
const abilityBits = [
  ...html.matchAll(/ability|Ability|특성|Thieving|Spy|text/gi),
].length;
console.log("hub len", html.length, "ability mentions", abilityBits);
console.log(
  "snippets",
  html.match(/Thieving[^<]{0,40}/)?.[0],
  html.match(/ability[^<]{0,80}/i)?.[0]
);
