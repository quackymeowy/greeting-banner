// Dynamic Notion cover: returns a JPEG drawn on every request.
// Greeting follows the chosen time zone (default Los Angeles).
// Use in Notion: Change cover -> Link -> https://<your-app>.vercel.app/api/cover
//
// Optional query params:
//   name=Enyita  tz=America/Los_Angeles
//   tagline=Discipline today, freedom tomorrow.   (several separated by | rotate daily)
//   quote=Dream it.|Believe it.|Do it.            (empty value hides it)
//   hour=0-23                                     (preview a time of day)

const { Resvg } = require("@resvg/resvg-js");
let satoriFn; // satori is ESM-only, loaded once on first request
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const W = 2400;
const H = 500;

// Background photo lives at the repo root (shared with the embed banner); fonts come from npm packages
const BG = "data:image/jpeg;base64," + fs.readFileSync(path.join(__dirname, "..", "bg.jpg")).toString("base64");
const font = (p) => fs.readFileSync(require.resolve(p));
const FONTS = [
  { name: "Cormorant", data: font("@fontsource/cormorant-garamond/files/cormorant-garamond-latin-500-normal.woff"), weight: 500, style: "normal" },
  { name: "Cormorant", data: font("@fontsource/cormorant-garamond/files/cormorant-garamond-latin-500-italic.woff"), weight: 500, style: "italic" },
  { name: "Jost", data: font("@fontsource/jost/files/jost-latin-400-normal.woff"), weight: 400, style: "normal" },
];

const DEFAULTS = {
  name: "Enyita",
  tz: "America/Los_Angeles",
  taglines: ["Discipline today, freedom tomorrow."],
  quote: ["Dream it.", "Believe it.", "Do it."],
};

// Tiny element helper so we don't need JSX / a build step
const h = (type, style, ...children) => ({
  type,
  props: { style, children: children.length === 1 ? children[0] : children },
});

function greetingFor(hour) {
  if (hour >= 5 && hour < 12) return "Good morning";
  if (hour >= 12 && hour < 17) return "Good afternoon";
  return "Good evening";
}

module.exports = async (req, res) => {
  const url = new URL(req.url, "http://x");
  const q = url.searchParams;

  const name = (q.get("name") || DEFAULTS.name).slice(0, 40);
  let tz = q.get("tz") || DEFAULTS.tz;
  try { new Date().toLocaleString("en-US", { timeZone: tz }); } catch { tz = DEFAULTS.tz; }
  const taglines = q.get("tagline") ? q.get("tagline").split("|") : DEFAULTS.taglines;
  const quote = q.has("quote") ? q.get("quote").split("|").filter(Boolean) : DEFAULTS.quote;

  const now = new Date();
  let hour = parseInt(now.toLocaleString("en-US", { timeZone: tz, hour: "numeric", hourCycle: "h23" }), 10) % 24;
  if (q.has("hour")) hour = Math.max(0, Math.min(23, parseInt(q.get("hour"), 10) || 0));

  const date = now.toLocaleDateString("en-US", { timeZone: tz, weekday: "long", month: "long", day: "numeric" });
  const ymd = now.toLocaleDateString("en-CA", { timeZone: tz }).split("-").map(Number);
  const dayNumber = Math.floor(Date.UTC(ymd[0], ymd[1] - 1, ymd[2]) / 86400000);
  const tagline = taglines[dayNumber % taglines.length];

  const ivory = "#fffaf2";
  const textShadow = "0 2px 16px rgba(70,48,26,0.55)";

  const tree = h(
    "div",
    { width: W, height: H, display: "flex", position: "relative", backgroundColor: "#d9c6a8" },
    { type: "img", props: { src: BG, width: W, height: H, style: { position: "absolute", top: 0, left: 0, width: W, height: H, objectFit: "cover" } } },
    // warm shade along the bottom so the white text reads on the light photo
    h("div", {
      position: "absolute", top: 0, left: 0, width: W, height: H, display: "flex",
      backgroundImage: "linear-gradient(0deg, rgba(92,66,40,0.62) 0%, rgba(92,66,40,0.30) 42%, rgba(92,66,40,0) 70%)",
    }),
    // greeting block: centered, inside the area that stays visible on phones
    h(
      "div",
      {
        position: "absolute", left: 0, bottom: 52, width: W, display: "flex", flexDirection: "column",
        alignItems: "center", color: ivory, textShadow,
      },
      h("div", { fontFamily: "Jost", fontSize: 24, letterSpacing: 6, textTransform: "uppercase", marginBottom: 6, display: "flex" }, date),
      h("div", { fontFamily: "Cormorant", fontWeight: 500, fontSize: 104, lineHeight: 1.05, display: "flex" }, `${greetingFor(hour)}, ${name}`),
      h("div", { fontFamily: "Jost", fontSize: 26, letterSpacing: 7, textTransform: "uppercase", marginTop: 10, display: "flex" }, tagline)
    ),
    // quote on the right, as in the mockup (cropped away on phones on purpose)
    ...(quote.length
      ? [
          h(
            "div",
            {
              position: "absolute", left: 1815, top: 130, height: 240, display: "flex", flexDirection: "column",
              justifyContent: "center", borderLeft: "3px solid #c9973f", paddingLeft: 34,
              fontFamily: "Cormorant", fontStyle: "italic", fontWeight: 500, fontSize: 46, lineHeight: 1.25, color: "#2b211a",
            },
            ...quote.map((line) => h("div", { display: "flex" }, line))
          ),
        ]
      : [])
  );

  if (!satoriFn) satoriFn = (await import("satori")).default;
  const svg = await satoriFn(tree, { width: W, height: H, fonts: FONTS });
  const png = new Resvg(svg, { fitTo: { mode: "width", value: W } }).render().asPng();
  const jpg = await sharp(png).jpeg({ quality: 84, mozjpeg: true }).toBuffer();

  res.setHeader("Content-Type", "image/jpeg");
  // short cache so the greeting changes close to on time
  res.setHeader("Cache-Control", "public, max-age=300, s-maxage=300, stale-while-revalidate=60");
  res.end(jpg);
};
