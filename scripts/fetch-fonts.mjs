// Downloads the General Sans webfonts (weights 500, 600, 700) from Fontshare into public/fonts/,
// so the app serves them from its own domain instead of loading them from Fontshare at runtime.
//
// The files are NOT committed: General Sans is under ITF's Free Font License, which allows
// self-hosting on our own servers but not redistributing the files (this repo is public). So they're
// fetched before `npm run dev` and `npm run build` (see package.json), unmodified, as the licence requires.
// Licence: https://www.fontshare.com/licenses/itf-ffl
import { existsSync, mkdirSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const WEIGHTS = [500, 600, 700]
const outDir = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "fonts", "general-sans")
const fileFor = (weight) => join(outDir, `GeneralSans-${weight}.woff2`)

if (WEIGHTS.every((w) => existsSync(fileFor(w)))) process.exit(0)

const cssUrl = `https://api.fontshare.com/v2/css?f[]=general-sans@${WEIGHTS.join(",")}&display=swap`
const css = await (await fetch(cssUrl)).text()

// Each @font-face block has one weight and one .woff2 URL.
const faces = [...css.matchAll(/@font-face\s*{([^}]*)}/g)].map((m) => ({
  weight: Number(/font-weight:\s*(\d+)/.exec(m[1])?.[1]),
  url: /url\('([^']+\.woff2)'\)/.exec(m[1])?.[1],
}))

mkdirSync(outDir, { recursive: true })
for (const weight of WEIGHTS) {
  const face = faces.find((f) => f.weight === weight && f.url)
  if (!face) throw new Error(`Fontshare's CSS has no woff2 file for General Sans ${weight}`)
  const response = await fetch(face.url.startsWith("//") ? `https:${face.url}` : face.url)
  if (!response.ok) throw new Error(`Downloading General Sans ${weight} failed: HTTP ${response.status}`)
  writeFileSync(fileFor(weight), Buffer.from(await response.arrayBuffer()))
  console.log(`Fetched General Sans ${weight}`)
}
