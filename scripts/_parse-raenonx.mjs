import fs from "fs";

const html = fs.readFileSync("tmp-raenonx.html", "utf8");
console.log("len", html.length);

const i = html.indexOf("Thieving Incisors");
console.log("around Thieving", html.slice(i - 500, i + 800));

// Find script URLs that might have i18n
const scripts = [...html.matchAll(/src="(\/_next\/static\/chunks\/[^"]+)"/g)].map(
  (m) => m[1]
);
console.log("scripts", scripts.length);

// Look for Ability name map chunk
const i2 = html.indexOf('"164":"Thieving Incisors"');
console.log("map around", html.slice(i2 - 2000, i2 + 500));
