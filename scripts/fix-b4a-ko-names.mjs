/**
 * Patch B4a Korean move/ability names to match official JP→KO localization
 * (verified against gamepedia JP card images / text).
 *
 * Also: 아케이드 → 게임센터
 */
import fs from "fs";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const XLSX = require("xlsx");

/** id → { 이름?, 기술명?, 기술명2?, 특성? } */
const FIXES = {
  19202: { 기술명: "반딧불의분노" }, // ほたるのいかり (was 아이어플라이 / Ire-Fly)
  19203: { 기술명: "잎부메랑" }, // はっぱブーメ랑 (was 리프부메랑)
  19205: { 특성: "로열 블룸" }, // ロイヤルブルーム — official KO (RaenonX)
  19206: { 기술명: "조롱구이" }, // なぶりやき (was 조롱조롱로스팅)
  // 19207 극염의날개 = ごくえんのつばさ — already correct
  19220: { 기술명: "전자스파크" }, // normalize space; でんじスパーク
  19223: { 기술명: "일렉킥" }, // エレキック (was 일렉트릭킥)
  19225: { 기술명: "쓰레기줍기" }, // ゴミあさり (was 스케빈지)
  19228: { 기술명: "함정에빠뜨리기" }, // わなにはめる (was 인트랩)
  19230: { 기술명: "사이킥봄" }, // サイキックボム (was 사이코익스플로전)
  19233: { 기술명: "펀치&드로" }, // パンチ&ドロー
  19236: { 기술명: "혼내주기" }, // こらしめる (was 퍼니시)
  19238: { 기술명: "어둠의이빨" }, // ヤミのキバ (was 어둠엄니)
  19242: { 기술명: "역분사" }, // ぎゃくふんしゃ (was 리버스스러스트)
  19244: { 기술명: "다같이패기" }, // みんなでしばく
  19248: { 기술명: "들이받아쓰러뜨리기" }, // つきたおし — if current 넘어뜨리기 wrong
  19250: { 기술명: "기회해머" }, // くいうちハンマー (was 파일드라이버해머)
  19256: { 이름: "브리지라스" }, // align JP ブリジュラス reading used elsewhere; only if needed — SKIP name unless wrong
  19257: { 기술명: "드래곤슬램" }, // ドラゴンスラム (was 드래고닉슬램)
  19258: { 기술명: "덮치기" }, // おそいかかる — keep if already
  19261: { 기술명: "데스로그" }, // デスローグ (was 데인저러스로그)
  19262: { 기술명: "때리고숨기" }, // なぐってかくれる (was 힛앤드하이드)
  19263: { 기술명: "부풀부풀응원" }, // ぷくぷくエール (was 통통치어)
  19266: { 기술명: "히프드롭" }, // ヒップドロップ (was 싯다운스플래시)
  19272: { 이름: "게임센터" }, // ゲームセンター (was 아케이드)
};

// Don't rename 브리지라스 if current 브리두라스 is intentional KO official
delete FIXES[19256];
// 넘어뜨리기 might be OK for つきたおし — only fix if we know better
// Keep 들이받아쓰러뜨리기 only if current is clearly EN
const koNow = JSON.parse(fs.readFileSync("tmp-b4a-ko-now.json", "utf8"));
const byId = Object.fromEntries(koNow.map((c) => [c.id, c]));
if (byId[19248]?.m1 === "넘어뜨리기") {
  // つきたおし ≈ knock down by thrusting — 들이받아쓰러뜨리기 is literal; 넘어뜨리기 is fine short form
  delete FIXES[19248];
}
if (byId[19258]?.m1 === "덮치기") delete FIXES[19258];
if (byId[19244]?.m1 === "다함께 때려잡기") {
  FIXES[19244] = { 기술명: "다함께때려잡기" }; // spacing normalize optional — keep space if current has it
  FIXES[19244] = { 기술명: "다함께 때려잡기" }; // keep as-is meaning OK
  delete FIXES[19244];
}

const wb = XLSX.readFile("app/data/card_list.xlsx");
const changes = [];

for (const sn of wb.SheetNames) {
  if (sn === "추천덱") continue;
  const ws = wb.Sheets[sn];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
  if (rows.length < 2) continue;
  const h = rows[0].map((x) => String(x).trim());
  const cols = {
    ID: h.indexOf("ID"),
    이름: h.indexOf("이름"),
    기술명: h.indexOf("기술명"),
    기술명2: h.indexOf("기술명2"),
    특성: h.indexOf("특성"),
  };

  for (let r = 1; r < rows.length; r++) {
    const id = Number(rows[r][cols.ID]);
    const fix = FIXES[id];
    if (!fix) continue;
    for (const [field, next] of Object.entries(fix)) {
      const c = cols[field];
      if (c < 0) continue;
      const prev = String(rows[r][c] ?? "").trim();
      if (prev === next) continue;
      ws[XLSX.utils.encode_cell({ r, c })] = { t: "s", v: next };
      changes.push({ id, field, from: prev, to: next });
    }
  }
}

XLSX.writeFile(wb, "app/data/card_list.xlsx");
fs.writeFileSync("tmp-b4a-name-fixes.json", JSON.stringify(changes, null, 2), "utf8");
console.log(`Applied ${changes.length} field fixes:`);
for (const c of changes) {
  console.log(`  ${c.id} ${c.field}: ${c.from} → ${c.to}`);
}
