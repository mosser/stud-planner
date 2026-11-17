#!/usr/bin/env bash
# The ADR rules a grep or a Node one-liner can verify. Run after a build.
set -uo pipefail
cd "$(dirname "$0")/.."

failures=0
fail() { echo "ADR check failed: $*" >&2; failures=$((failures + 1)); }

business=$(find src -name '*.ts' ! -name '*.test.ts' ! -name '*.fixture.ts')
version=$(node -p "require('./package.json').version")

# ADR 0001: one file, named after the version; no network API; TypeScript only; pinned build.
built=$(ls dist 2>/dev/null)
[ "$built" = "stud-planner-v${version}.html" ] || fail "dist/ must hold exactly stud-planner-v${version}.html, holds: ${built:-nothing}"
grep -nE '\bimport\(|\bfetch\(|XMLHttpRequest|WebSocket|sendBeacon' $business && fail "network API or dynamic import() in src/"
find src -type f ! -name '*.ts' ! -name 'style.css' ! -path 'src/assets/*' | grep . && fail "src/ holds a file that is not TypeScript, style.css or an asset"
grep -q '"strict": true' tsconfig.base.json || fail "tsconfig.base.json must keep strict"
grep -q 'viteSingleFile()' vite.config.ts || fail "vite.config.ts must use viteSingleFile()"
grep -q "base: './'" vite.config.ts || fail "vite.config.ts must set base: './'"
node -e "
const p = require('./package.json')
const all = { ...p.dependencies, ...p.devDependencies }
const loose = Object.entries(all).filter(([, v]) => !/^\d+\.\d+\.\d+$/.test(v))
if (loose.length) { console.error(loose); process.exit(1) }
" || fail "package.json must declare exact versions only"
[ -f package-lock.json ] || fail "package-lock.json must be committed"
for lock in pnpm-lock.yaml yarn.lock bun.lock bun.lockb; do [ -e "$lock" ] && fail "$lock must not exist"; done
grep -q '^save-exact=true$' .npmrc || fail ".npmrc must set save-exact=true"
grep -q '^engine-strict=true$' .npmrc || fail ".npmrc must set engine-strict=true"
[ -f .nvmrc ] || fail ".nvmrc must exist"

# ADR 0010: colour literals only in the palette block of style.css, and only McMaster's.
grep -nEi '#[0-9a-f]{3,8}\b|rgba?\( *[0-9]|hsla?\( *[0-9]' $business && fail "colour literal outside src/style.css"
awk '/palette:start/{inside=1} /palette:end/{inside=0} !inside && /#[0-9A-Fa-f]{3,8}\b|rgba?\(/' src/style.css | grep . && fail "colour literal outside the palette block of src/style.css"
awk '/palette:start/{inside=1; next} /palette:end/{inside=0} inside && /#/' src/style.css | grep -vE '^\s*--mac-[a-z-]+: #[0-9a-f]{6};$' && fail "the palette block of src/style.css holds a colour that is not a --mac-* token"

# ADR 0002: actions pinned to a commit SHA; release notes from the CHANGELOG; Pages after the release.
grep -nE '^\s*-?\s*uses:' .github/workflows/*.yml | grep -vE 'uses: [^@ ]+@[0-9a-f]{40} # v[0-9]' && fail "an action is not pinned to a full commit SHA with its version in a comment"
grep -q 'scripts/release-notes.sh' .github/workflows/release.yml || fail "release.yml must take the release notes from CHANGELOG.md"
grep -q -- '--generate-notes' .github/workflows/release.yml && fail "release.yml must not generate the release notes"
grep -qE '^\s+needs: release$' .github/workflows/release.yml || fail "release.yml must deploy GitHub Pages after the release"
grep -q '^## \[Unreleased\]$' CHANGELOG.md || fail "CHANGELOG.md must keep an [Unreleased] section"

# ADR 0003: business code imports no test, vitest or node: module; no TODO; no silent ignore.
grep -nE "from '(vitest|node:[^']*)'|from '[^']*\.(test|fixture)(\.ts)?'" $business && fail "business code imports a test, vitest or node: module"
grep -rn 'TODO' src scripts --exclude=check-adr.sh && fail "TODO in the code"
grep -nE 'biome-ignore[^:]*$' $(find src -name '*.ts') && fail "biome-ignore without a reason"

# ADR 0004: drags on Pointer Events, no drag-and-drop API.
grep -nE 'draggable|ondragstart|dragstart' $business && fail "the HTML drag-and-drop API is used: drags are written on Pointer Events"

# ADR 0005: the domain imports nothing from io or ui, and uses no browser API.
if [ -d src/domain ]; then
  grep -nE "from '\.\./(io|ui)/|\b(window|document|navigator|indexedDB|globalThis)\." $(find src/domain -name '*.ts' ! -name '*.test.ts') && fail "src/domain/ depends on io, ui or the browser"
fi

# ADR 0008: abstract weeks; nothing reads today's date.
grep -nE 'new Date\(|Date\.now\(|Temporal\.' $business && fail "src/ reads a date: the weeks are abstract"

# ADR 0006: no storage but IndexedDB, and IndexedDB only in the schedule store.
grep -nE 'localStorage|sessionStorage|document\.cookie|caches\.' $business && fail "browser storage other than IndexedDB"
grep -ln 'indexedDB' $business | grep -v '^src/io/schedule-store.ts$' && fail "IndexedDB used outside src/io/schedule-store.ts"

# ADR 0007: download and load, never upload.
grep -rniE 'upload' src docs/specs && fail "\"upload\" in src/ or docs/specs/"

# ADR 0012: shared schedules inlined from schedules/, by one module, checked by the build.
[ -d schedules ] || fail "schedules/ must exist"
grep -ln 'import\.meta\.glob' $business | grep -v '^src/io/shared-schedules.ts$' && fail "import.meta.glob used outside src/io/shared-schedules.ts"
grep -q "import.meta.glob('../../schedules/\*.json', { eager: true" src/io/shared-schedules.ts || fail "src/io/shared-schedules.ts must inline schedules/*.json, eager"
grep -q 'checkSharedSchedules()' vite.config.ts || fail "vite.config.ts must check the files of schedules/"

if [ "$failures" -gt 0 ]; then
  echo "$failures ADR check(s) failed" >&2
  exit 1
fi
echo "ADR checks passed"
