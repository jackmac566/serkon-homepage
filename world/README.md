# Serkon · Studio and Explorer

Independent 3D personal website with a studio, retro computer and explorable portfolio. Its dedicated Cloudflare Pages project is `serkon-world`; the original homepage and D1 data remain separate.

The room directly adapts Henry Heffernan's MIT portfolio-website at `c53c5a50183655eb83d70048403a5084f5d1214c`: baked models, camera choreography, CRT and coffee steam. The inner desktop is an independent implementation because portfolio-inner-site did not include a reuse license. The world adapts Bruno Simon's MIT folio-2025 at `41046b57eeed8d156d9c3fd7fa259900baef7816`: vehicle/Rapier physics, terrain, shaders, foliage and interactive areas. See each `UPSTREAM.md`, original licenses and `public/THIRD_PARTY_NOTICES.txt`.

## Build and preview

Requires Node 22+.

```sh
npm ci --prefix world
npm ci --prefix world/explorer --ignore-scripts --legacy-peer-deps
npm ci --prefix world/studio --ignore-scripts --legacy-peer-deps
npm run build --prefix world
cd world && npx vite preview --host 127.0.0.1 --port 4390
```

Use the built static preview for combined QA. The previous procedural room/park modules are retained as legacy source but are not loaded by the active entry point. Root `npm run dev` is only a source-development convenience; nested compiled paths require a full build.

## Flow

Real resource loading → centered START gate → original studio camera → CRT computer → local retro desktop → full explorer. The same-origin host bridge pauses rendering/audio/input while a scene is hidden. Return to desktop keeps the computer session. A keyboard-accessible skip link opens personal content without driving.

The explorer map is the original large modal map, with graphical location markers and the current vehicle position. No location list or credits appear over the map. This edition targets desktop computers only. Keyboard controls are retained; inherited touch styles are not a mobile deliverable. Right drag or Alt+left drag rotates 360 degrees; a short bare-ground click gives the original vehicle a path and pedal/steering input through A*, rather than teleporting. Manual input, obstacle failure, modals and host pause cancel automatic driving.

Personal content comes from repository public assets. AI London images are identified as generated process screenshots. Song 创世纪 is credited to 位面之子 FK. No fictional work history, author biography, analytics or author private game server is copied.

## Music and deployment

Kounine's Baguira/Boy/Sudo are CC0. SoundJay rain carries its separate source/terms note. Other undocumented recordings were excluded; interaction sounds are synthesized locally. The room uses Baguira. Music/media range requests use a read-only ASSETS worker for Safari byte probes; no database binding is needed.

The user authorized a separate production deployment on 2026-10-23. The public share URL is **https://serkon-world.pages.dev/**. Deploy the tested `world/dist` to the dedicated `serkon-world` project using `--branch main`. This direct-upload project is independent of the original `serkon-homepage-cn` site; preserve that site's production branch, canonical deployment and database bindings.

```sh
cd world
../node_modules/.bin/wrangler pages deploy dist --project-name serkon-world --branch main --commit-dirty=false
```

The source remains in the same GitHub repository on `codex/serkon-world`; pushing Git alone does not publish this direct-upload Pages project. Future releases should deploy to the same project so the public share URL stays unchanged. The old `serkon-world-preview` branch on `serkon-homepage-cn` is a separate preview target, not the public production URL.

Visitors can open the public URL without signing in. Share the root URL for the complete loading → room → desktop → world experience; `/desktop/` opens the computer directly. This edition is intended for desktop browsers. SAMSY remains an online third-party experience. Current noindex metadata only limits search indexing, not public access or link sharing.

`npm test --prefix world` checks byte-range handling and the retained legacy controller. It does not validate the new Rapier/GPU world; record actual browser QA separately in `QA.md`.

## SAMSY desktop game

The desktop and Start menu include a SAMSY icon. Double-clicking creates one classic window that embeds `https://samsy.ninja/` on demand; the original site is neither copied nor modified. Window controls support maximize, reload and close, with a direct-site link available. This is an online third-party experience, not a self-hosted/offline game.

The frame is unloaded when minimized, closed, hidden by the host or the page is hidden. Restoring starts a new session; this avoids a hidden WebGL/audio loop. Game audio focus suppresses the studio background music through the existing desktop music message. The frame is cross-origin and sandboxed without top-navigation permission.
