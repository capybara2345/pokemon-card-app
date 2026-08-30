import fs from "fs";
import { mkdirSync } from "fs";

mkdirSync("tmp-b4a-ko-imgs", { recursive: true });

const UA = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
};

const targets = [
  {
    label: "raticate",
    urls: [
      "https://www.serebii.net/tcgpocket/teamrocket'sambition/59.jpg",
      "https://www.serebii.net/tcgpocket/teamrocketsambition/59.jpg",
      "https://www.serebii.net/card/tcgpocket/teamrocketambition/59.jpg",
      "https://archives.bulbagarden.net/media/upload/thumb/Team_Rocket%27s_Raticate_ex_Team_Rocket%27s_Ambition_59.png/300px-Team_Rocket%27s_Raticate_ex_Team_Rocket%27s_Ambition_59.png",
    ],
  },
  {
    label: "kecleon",
    urls: [
      "https://www.serebii.net/tcgpocket/teamrocket'sambition/62.jpg",
      "https://www.serebii.net/tcgpocket/teamrocketsambition/62.jpg",
    ],
  },
];

// Also scrape pokemongohub card pages
async function tryHub() {
  const pages = [
    "https://pocket.pokemongohub.net/en/card/b4a-059-team-rockets-raticate-ex",
    "https://pocket.pokemongohub.net/card/b4a-059",
    "https://pocket.pokemongohub.net/en/cards/B4a/59",
  ];
  for (const u of pages) {
    try {
      const res = await fetch(u, { headers: UA });
      console.log("hub", res.status, u);
      if (!res.ok) continue;
      const html = await res.text();
      const imgs = [
        ...html.matchAll(/src="(https?:\/\/[^"]+\.(?:png|webp|jpg|jpeg)[^"]*)"/gi),
      ].map((m) => m[1]);
      console.log(
        " imgs",
        imgs.filter((x) => /raticate|B4a|059|card/i.test(x)).slice(0, 10)
      );
    } catch (e) {
      console.log("hub err", e.message);
    }
  }
}

async function download(url, path) {
  try {
    const res = await fetch(url, {
      headers: { ...UA, Referer: "https://www.serebii.net/" },
    });
    if (!res.ok) {
      console.log("fail", res.status, url);
      return false;
    }
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 2000) {
      console.log("tiny", buf.length, url);
      return false;
    }
    fs.writeFileSync(path, buf);
    console.log("OK", buf.length, path);
    return true;
  } catch (e) {
    console.log("err", e.message, url);
    return false;
  }
}

await tryHub();
for (const t of targets) {
  let i = 0;
  for (const u of t.urls) {
    await download(u, `tmp-b4a-ko-imgs/${t.label}_${i++}.jpg`);
  }
}
