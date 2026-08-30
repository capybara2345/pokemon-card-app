import fs from "fs";

const html = fs.readFileSync("tmp-raenonx-ko.html", "utf8");
console.log("len", html.length);
const hangul = [
  ...html.matchAll(/[\uac00-\ud7a3]{2,}(?:\s[\uac00-\ud7a3]+)*/g),
].map((m) => m[0]);
console.log("hangul count", hangul.length);
const interesting = [...new Set(hangul)].filter((x) =>
  /도둑|스파이|길동|번뜩|보일러|호화|마하|로열|퍼코|특성|앞니|활동|봄버|코인|스텔스|스모그|블룸|고저스/.test(
    x
  )
);
console.log("interesting", interesting);

for (const id of ["158", "159", "160", "161", "162", "163", "164", "165"]) {
  const re = new RegExp(`"${id}":"([^"]+)"`, "g");
  const vals = [];
  let m;
  while ((m = re.exec(html))) vals.push(m[1]);
  console.log(id, [...new Set(vals)]);
}

// dump all unique hangul strings that look like ability names (short)
const short = [...new Set(hangul)].filter((x) => x.length <= 12 && x.length >= 3);
fs.writeFileSync(
  "tmp-raenonx-ko-hangul.txt",
  short.sort().join("\n"),
  "utf8"
);
console.log("wrote hangul list", short.length);
