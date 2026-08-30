import fs from "fs";

const html = fs.readFileSync("tmp-raenonx.html", "utf8");
const scripts = [
  ...html.matchAll(/src="(\/_next\/static\/chunks\/[^"]+\.js[^"]*)"/g),
].map((m) => "https://ptcgp.raenonx.cc" + m[1].replace(/&amp;/g, "&"));

console.log("fetching", scripts.length, "scripts");

const hits = [];
for (const url of scripts) {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
    });
    if (!res.ok) continue;
    const text = await res.text();
    if (
      /Thieving Incisors|Spy Ops|Regal Bloom|도둑|스파이|Ability/.test(text) &&
      /[\uac00-\ud7a3]/.test(text)
    ) {
      hits.push({ url, len: text.length });
      fs.writeFileSync(
        "tmp-raenonx-i18n-hit.js",
        text.slice(0, 50) + "\n...\n" + text
      );
      // extract ability name map if Korean nearby
      const koAbilities = [
        ...text.matchAll(
          /"(?:Regal Bloom|Destiny Burst|Evil Inspiration|Boiler Smog|Luxury Coin|Mach Stealth|Thieving Incisors|Spy Ops|Fur Coat)"[^\uac00-\ud7a3]{0,40}([\uac00-\ud7a3][^"]{0,40})/g
        ),
      ];
      console.log("possible", koAbilities.slice(0, 20));

      // look for id-based KO ability names 158-165
      for (const id of [158, 159, 160, 161, 162, 163, 164, 165]) {
        const re = new RegExp(`"${id}":"([^"]+)"`, "g");
        let m;
        while ((m = re.exec(text))) {
          if (/[\uac00-\ud7a3]/.test(m[1])) console.log("KO", id, m[1]);
        }
      }
    }
    if (/\"158\":\"[^\"]*[\uac00-\ud7a3]/.test(text)) {
      console.log("FOUND KO ability map in", url);
      const m = text.match(
        /\"158\":\"[^\"]+\".{0,500}\"165\":\"[^\"]+\"/
      );
      console.log(m?.[0]);
    }
  } catch (e) {
    console.log("err", e.message);
  }
}
console.log("hits", hits);
