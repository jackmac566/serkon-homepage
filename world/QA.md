# Desktop acceptance record — 2026-10-22

Scope: independent preview, desktop only. Production homepage/data are not part of the deployment.

## Completed local evidence

- Combined production build: upstream explorer, upstream studio, host and independent retro desktop succeed. Studio TypeScript check succeeds.
- Native browser path exercised: real BIOS counts and waiting START → original baked room → camera approach to CRT → personal desktop → complete original explorer reveal → project display → return to existing CRT session.
- The room contains the original coffee/steam, new five-line desk paper and five requested books. No room bottom navigation or upper-right hints. Desktop hint removed.
- Original right-hand menu/map icons restored. Native menu tabs retain the reference layout and contain the owner's content.
- Large original map opens over the scene, with 12 graphical location markers and live vehicle position; host sidebar, text location list and ambient attribution blocks are removed.
- Actual GPU vehicle movement, collisions and explosive props triggered. Personal project artwork rendered in the original workshop display. Host scene switch preserves desktop state.
- Same-origin host/START/readiness/pause/fallback checks use mock messages plus actual browser flow. Missing studio entry has a 90 s recovery action. No automatic START or fallback jump.
- Media worker regression: 8 Range/HEAD/error tests pass (20 total tests also include retained legacy controller tests, which are not proof of new Rapier behavior).

## Limits

- No mobile design or device acceptance, per the user's latest instruction.
- Music playback state and media loading were checked; no claim of an audible listening review.
- Original private game server is disconnected: public whispers and global race-score persistence are offline. Local circuit/physics remain available.
- NPC, character, inventory and shop systems remain a later phase.
- The navigation regression uses 432 original terrain/scenery colliders and production PhysicsVehicle update methods, original landing orientation, 1/30 physics and 1/60 controller timing. It crosses the west bridge in 954 frames with 1.309 m target error; manual/host cancellation passes. This is physical-controller evidence, not a renderer/browser substitute. Legacy controller tests are not acceptance of this controller.

Visible author/technology/license introductions and links were removed from scene and desktop interfaces at the user’s request. Necessary original copyright and permission texts remain in distributed source/license files; the UI does not claim all reused assets are original work by the site owner.

## Public preview acceptance

- Preview: https://e306b40f.serkon-homepage-cn.pages.dev/ ; runtime commit `fc08fae2fa4b2a53b0dd8050a083c4f900840aa3`.
- Public HTTP verification passes 20 checks: entry, studio/desktop/explorer assets, source notice files and media Range/HEAD/error handling. Cloudflare API confirms successful preview, zero preview D1 bindings and unchanged production main deployment.
- Native public browser confirms the question tab now contains only the owner's exploration text; screenshot `outputs/serkon-final-explore.png`. Built runtime HTML/JS/CSS contains no upstream author names or visible license/credits introduction. Required separate notice files are retained.
- Native public map opens as a centered full-map modal with 12 Chinese-labelled diamond buttons and live vehicle icon; screenshot `outputs/serkon-final-map.png`. Clicking the projects marker closes the map and respawns at the personal project workshop.
- Native public ground-click checks: the landing route from (39.53, 37.83) to (42.09, 35.96) ends with the actual arrival message. A separate project-workshop route starts physical driving but safely stops near display props before arrival; this is not counted as a successful arrival. Bridge crossing is additionally covered by the regression with 432 actual original scenery/terrain colliders.
- One first-load WASM network abort required a reload; the reloaded public world rendered and completed these interactions. This was a transport failure, not counted as a successful first-load check.
- Draft PR: https://github.com/jackmac566/serkon-homepage/pull/3 . Production homepage has not been replaced.

## SAMSY desktop integration — 2026-10-22

- Combined production build and desktop JavaScript syntax check pass.
- Actual desktop browser: double-click SAMSY opens its own window; the official third-party scene renders, the tutorial is dismissible, and Up/Space input changes the explored scene and avatar position. Screenshot: `outputs/serkon-samsy-desktop.png`.
- Maximize applies the full-workspace window layout. Minimize removes the iframe (count 0); taskbar restore creates a fresh frame and the game loads again. Close removes both window and iframe (count 0).
- The original site had one initial network fetch failure; reloading succeeded. No claim of offline availability or guaranteed third-party uptime. The app keeps a direct-site link and reload control.
- Host pause/resume and room-audio focus use the existing same-origin desktop protocol; the third-party iframe itself cannot read the parent DOM. Required original notices inside the external site are unchanged.

- Full local host flow also verified: START → baked room → native CRT approach → double-click SAMSY → third-party game scene renders inside the modeled monitor. Returning through the desktop room icon removes the game iframe (count 0). Direct desktop movement/jump was verified above; the automation driver cannot click the canvas through the nested 3D iframe transform, so CRT canvas pointer input is not claimed as a separate automated acceptance.
- Studio TypeScript check passes after adding camera enter/exit lifecycle messages. Starting the music player minimizes any active game; audio focus remains with the foreground app.

## Independent production release — 2026-10-23

The user authorized publishing the latest 3D site as its own production website. Existing tested build reused without rerunning functional checks.

- Cloudflare Pages project: `serkon-world`, direct upload, production branch `main`.
- Public share URL: https://serkon-world.pages.dev/ . No login required; desktop edition.
- Production deployment: `3e440035-6132-4c28-9732-2f63790c2278`, built runtime source `43a17f7`. Immutable release URL: https://3e440035.serkon-world.pages.dev/ .
- Wrangler confirms Production/main/43a17f7. The stable public URL returns HTTP 200. The first upload failed on transport; retry completed all 987 asset uploads, Worker and routes successfully.
- Dedicated project uses the read-only ASSETS worker, with no database or production-data integration. No deployment or configuration mutation was made to the existing `serkon-homepage-cn` project.
- Source remains on GitHub `codex/serkon-world`; this direct-upload project needs an explicit Pages deploy for subsequent site releases. The fixed share URL remains the same across releases.
