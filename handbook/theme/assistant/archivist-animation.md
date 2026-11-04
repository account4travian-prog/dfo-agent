# Archivist animation implementation map

Status: proposed implementation contract. The SVG is a complete still illustration; this document does not install animation or change site behavior.

## Integration boundary

`assistant-plugin.mjs` currently emits an external `<img>`; `assistant.css` sizes it to 92 px; `assistant.js` sets neither portrait state nor motion state. CSS in the HTML cannot select descendants inside that image. The Lead must inline the trusted local SVG once inside a portrait wrapper before applying this map. Do not fetch or inline arbitrary user SVG. Preserve `viewBox="0 0 320 360"`, use width 92–120 px and height auto, and adapt the existing `.ga-persona img` styles to the new wrapper/SVG. Update the existing 120 × 140 size reservation to the 8:9 aspect ratio (120 × 135). No runtime SVG scripting, fonts, images or path morphing are required.

Use `data-archivist-state` as the canonical attribute on that wrapper. If the host already uses `data-state="reading|speaking"`, mirror its value to `data-archivist-state`; setting `data-state` alone does not activate the skeleton below. One instance per page: internal IDs, paint servers and accessible-name IDs are deliberately stable. Multiple instances require prefixing *all* IDs and references, including CSS selectors.

## State model and event wiring

| State | Enter when | Hold / leave |
| --- | --- | --- |
| default / `idle` / attribute absent | Initial load, ordinary static search results, no coverage, model fallback/error, reduced motion, animation paused | Still reading pose; closed mouth, pupils resting near the lower eyelids. No pending request is implied. |
| `reading` | `askModel(query)` starts the actual `/api/ask` request, immediately before fetch | Remain until that request settles. This is not a minimum wait timer; never delay showing results for a gesture. |
| `speaking` | `renderModel(data)` has inserted a nonempty `mode === "model"` answer | Run two 3.2 s cycles (6.4 s), then settle to idle. This is a visual acknowledgement, not audio or text-synchronized lip sync. |

A separate `thinking` state is unnecessary: reading already conveys consulting the book during a request. `mode === "no-coverage"`, non-model responses, exceptions and an empty answer settle to idle. Static `render(query)` results do not trigger speaking. A fresh search that clears the model answer also cancels speaking. A new model request preempts any answer timer and returns to reading. Ignore stale completion/timer callbacks using a request generation token; aborting or hiding the page cancels portrait timers. Restore idle on page return; do not replay an old answer gesture.

Expose an “Animate portrait” toggle (persist preference if practical). Off uses the static idle frame and bypasses all timers. For motion-enabled sessions, suspend loops while the page is hidden or the portrait is outside the viewport. Existing textual status and live answer remain authoritative.

## Layer ownership and pivots

All pivots below use **`transform-box: view-box`** and absolute SVG coordinates. Never apply `fill-box` while retaining these origins. Do not animate `d`, `x`, `y`, widths or layout. `#figure` and `#archivist-root` remain stationary; child carriers prevent state transforms from overwriting loop transforms.

| Element ID | CSS property | Keyframes / pose | Duration | Easing | Iteration | State |
| --- | --- | --- | --- | --- | --- | --- |
| `archivist-root`, `figure` | none | fixed frame / body container | — | — | — | all |
| `av-breath` | transform | `av-breathe`; pivot 160 290 | 6 s | ease-in-out | infinite | reading, speaking |
| `av-head-pose` | transform | translateY(-5px), rotate(-1deg) when speaking; identity otherwise; pivot 160 215 | 300 ms in / 500 ms out | cubic-bezier(.22,.61,.36,1) | transition | all |
| `av-head-motion` | transform | `av-head`; pivot 160 215 | 3.2 s | ease-in-out | infinite | speaking |
| `hood`, `face`, `beard`, `brows` | inherited transform | carried together by head; no independent deformation | inherited | inherited | inherited | all |
| `eyes` | transform | translateY(-1px) speaking; identity otherwise | 300 ms in / 500 ms out | same transition | transition | all |
| `pupil-left`, `pupil-right` | transform | `av-scan`; both identical phase, clipped by fixed eye apertures | 7.2 s | linear, pauses encoded in stops | infinite | reading |
| `pupil-left`, `pupil-right` | transform | `av-reader`; restrained glance | 3.2 s | ease-in-out | infinite | speaking |
| `av-mouth-rest` | transform | scaleY(.22); pivot 158 178 | fixed | — | — | all |
| `mouth` | transform | `av-talk`; pivot 158 178 | 3.2 s | ease-in-out | infinite | speaking |
| `av-book-pose` | transform | translateY(5px), rotate(1.5deg) speaking; identity otherwise; pivot 160 315 | 300 ms in / 500 ms out | same transition | transition | all |
| `book`, `left-page`, `right-page` | inherited transform | rigid book carrier; pages remain visible beneath leaf | inherited | inherited | inherited | all |
| `page-turn` | transform, opacity | `av-page`; pivot at gutter 160 309 | 8 s | ease-in-out | infinite | reading (ask page only) |
| `av-hand-pose` | transform | translate(1px,-9px), rotate(-6deg) speaking; identity otherwise; pivot 86 275 | 300 ms in / 500 ms out | same transition | transition | all |
| `hand` | transform | `av-line`; pivot 86 275 | 7.2 s | linear | infinite | reading |
| `hand` | transform | `av-gesture`; same pivot | 3.2 s | ease-in-out | infinite | speaking |
| `compass` | none | brass cloak clasp; deliberately outside `av-breath` so it stays still and cannot drift behind the beard | — | — | — | all |

`candle` is intentionally omitted. Additional `av-*` groups are stable animation carriers, not dynamically generated nodes. The mouth is a filled ellipse, rather than a stroked line, so vertical scaling opens it. Its outer resting carrier compresses a 9.6-unit aperture to 2.1 units. `av-talk` expands that by at most 2.4×, yielding about 5 units, under 2 screen pixels at 120 px width.

## Reading: one 7.2 s phrase

Both pupils travel together: (−2,+1) → (+2,+1) over 0–30%, reset to (−2,+2) during 30–36%, scan to (+2,+2) by 64%, pause through 76%, then return to the first line by 100%. The implied gaze is downward; the finger traces the left page. Movements are SVG units, so ±2 is less than one pixel at header scale. Do not amplify merely to make the animation conspicuous.

The hand traces +5,+1 units through 64%, holds to 76%, then retracts by −1,−2 as the leaf turns. The leaf is hidden for 0–76% (5.47 s), lifts at 80%, narrows near edge-on at 86%, crosses the gutter by 94%, then fades by 98% (7.06 s). A 2D scaleX flip suggests a paper turn; it is not a physical page simulation. The page underneath stays present throughout. Slow breathing rises only 1 unit and does not scale, so the clasp stays still; no moving background or compass spin. The home launcher omits the page-turn entirely to avoid a 130 px flicker.

## Speaking: one 3.2 s phrase

The state pose lowers the whole book 5 units, lifts the head 5 units and angles it 1 degree toward the reader. The hand lifts from the page with a small open-finger gesture; the existing relaxed fingers remain rigid. A nod of 0.8 degrees and 0.6-unit lift peaks at 35%; the hand peaks at −3 degrees / −3 units at 42%. Pupils stay central with a half-unit sideways glance. Mouth pulses use irregular holds at 10%, 21%, 36%, 50%, 61%, 75%, 85% and 100%, with closed intervals. No stretching the face, detached beard, wide grin, blinking flash or pendulum rocking.

## Transition protocol: preserve continuity

A direct change of CSS animation names can snap. Use `data-archivist-motion="off"` to taper the registered numeric `--av-motion` envelope to zero before changing states. Every loop in the skeleton multiplies its displacement by this envelope; at zero all states share the same resting loop frame.

1. Initial idle → reading: set the state, remove the motion-off attribute; envelope rises over 100 ms.
2. Reading → speaking: mark motion off; wait 100 ms; switch canonical state; remove motion off. The pose and envelope arrive over 200 ms: total **300 ms**.
3. Speaking → idle/reading: mark motion off; wait 100 ms; switch state; remove motion off if entering reading. Poses settle over 400 ms: total **500 ms**. Idle envelope stays zero.
4. Request preemption uses the same 100 ms exit and current-pose transition; cancel older callbacks. Results/status render immediately, independent of this schedule.

The table's 300/500 ms values include the 100 ms exit; CSS pose durations are therefore 200/400 ms. On reduced-motion or pause, cancel transitions and immediately restore idle. Registered custom properties are required for the taper; on an unsupported engine use the static SVG instead of falling back to abrupt animation-name changes. Future browser verification must check the interpolation, clip containment and interruption behavior.

## Paste/adapt CSS skeleton

The wrapper below is `.archivist-portrait`; its canonical state is not on the SVG itself. This CSS belongs in the site stylesheet when the Lead integrates it. It is not embedded in the artwork.

```css
@property --av-motion {
  syntax: "<number>";
  inherits: true;
  initial-value: 0;
}
.archivist-portrait {
  --av-motion: 0;
  transition: --av-motion 100ms linear;
}
.archivist-portrait:is([data-archivist-state="reading"],
                      [data-archivist-state="speaking"]) { --av-motion: 1; }
.archivist-portrait[data-archivist-motion="off"] { --av-motion: 0; }
.archivist-portrait svg { display: block; width: 100%; height: auto; }
.archivist-portrait svg g { transform-box: view-box; }
.archivist-portrait #av-breath { transform-origin: 160px 290px; }
.archivist-portrait :is(#av-head-pose, #av-head-motion) {
  transform-origin: 160px 215px;
}
.archivist-portrait #av-book-pose { transform-origin: 160px 315px; }
.archivist-portrait :is(#av-hand-pose, #hand) { transform-origin: 86px 275px; }
.archivist-portrait :is(#av-mouth-rest, #mouth) { transform-origin: 158px 178px; }
.archivist-portrait #av-mouth-rest { transform: scaleY(.22); }
.archivist-portrait #page-turn {
  transform-origin: 160px 309px;
  opacity: 0;
}
.archivist-portrait :is(#av-head-pose, #av-book-pose, #av-hand-pose, #eyes) {
  transform: none;
  transition: transform 400ms cubic-bezier(.22,.61,.36,1);
}
[data-archivist-state="speaking"] :is(#av-head-pose, #av-book-pose, #av-hand-pose, #eyes) {
  transition-duration: 200ms;
}
[data-archivist-state="speaking"] #av-head-pose {
  transform: translateY(-5px) rotate(-1deg);
}
[data-archivist-state="speaking"] #eyes { transform: translateY(-1px); }
[data-archivist-state="speaking"] #av-book-pose {
  transform: translateY(5px) rotate(1.5deg);
}
[data-archivist-state="speaking"] #av-hand-pose {
  transform: translate(1px,-9px) rotate(-6deg);
}
:is([data-archivist-state="reading"], [data-archivist-state="speaking"]) #av-breath {
  animation: av-breathe 4.8s ease-in-out infinite;
}
[data-archivist-state="reading"] :is(#pupil-left, #pupil-right) {
  animation: av-scan 7.2s linear infinite;
}
[data-archivist-state="reading"] #page-turn { animation: av-page 7.2s linear infinite; }
[data-archivist-state="reading"] #hand { animation: av-line 7.2s linear infinite; }
[data-archivist-state="speaking"] :is(#pupil-left, #pupil-right) {
  animation: av-reader 3.2s ease-in-out infinite;
}
[data-archivist-state="speaking"] #av-head-motion { animation: av-head 3.2s ease-in-out infinite; }
[data-archivist-state="speaking"] #hand { animation: av-gesture 3.2s ease-in-out infinite; }
[data-archivist-state="speaking"] #mouth { animation: av-talk 3.2s ease-in-out infinite; }

@keyframes av-breathe {
  0%,100% { transform: translateY(0) scale(1); }
  50% { transform: translateY(calc(-1.5px * var(--av-motion)))
                  scale(calc(1 + .006 * var(--av-motion))); }
}
@keyframes av-scan {
  0%,100% { transform: translate(calc(-2px * var(--av-motion)),calc(1px * var(--av-motion))); }
  30% { transform: translate(calc(2px * var(--av-motion)),calc(1px * var(--av-motion))); }
  36% { transform: translate(calc(-2px * var(--av-motion)),calc(2px * var(--av-motion))); }
  64%,76% { transform: translate(calc(2px * var(--av-motion)),calc(2px * var(--av-motion))); }
}
@keyframes av-line {
  0%,100% { transform: translate(0,0); }
  64%,76% { transform: translate(calc(5px * var(--av-motion)),calc(1px * var(--av-motion))); }
  88%,94% { transform: translate(calc(-1px * var(--av-motion)),calc(-2px * var(--av-motion))); }
}
@keyframes av-page {
  0%,76%,100% { opacity: 0; transform: scaleX(1); }
  80% { opacity: var(--av-motion); transform: scaleX(1); }
  86% { opacity: var(--av-motion); transform: scaleX(calc(1 - .92 * var(--av-motion))); }
  94% { opacity: var(--av-motion); transform: scaleX(calc(1 - 1.95 * var(--av-motion))); }
  98% { opacity: 0; transform: scaleX(calc(1 - 1.95 * var(--av-motion))); }
}
@keyframes av-reader {
  0%,20%,75%,100% { transform: translate(0,0); }
  40%,55% { transform: translateX(calc(.5px * var(--av-motion))); }
}
@keyframes av-head {
  0%,20%,75%,100% { transform: translateY(0) rotate(0); }
  35% { transform: translateY(calc(-.6px * var(--av-motion)))
                  rotate(calc(.8deg * var(--av-motion))); }
}
@keyframes av-gesture {
  0%,100% { transform: translateY(0) rotate(0); }
  42%,58% { transform: translateY(calc(-3px * var(--av-motion)))
                      rotate(calc(-3deg * var(--av-motion))); }
}
@keyframes av-talk {
  0%,10%,21%,36%,50%,61%,75%,85%,100% { transform: scaleY(1); }
  15%,43%,80% { transform: scaleY(calc(1 + 1.4 * var(--av-motion))); }
  28%,56%,68% { transform: scaleY(calc(1 + .8 * var(--av-motion))); }
}
/* Must follow the animation rules. Same still pose for pause and reduced motion. */
.archivist-portrait[data-archivist-paused="true"] { transition: none; }
.archivist-portrait[data-archivist-paused="true"] svg g {
  animation: none !important;
  transition: none !important;
  transform: none !important;
}
.archivist-portrait[data-archivist-paused="true"] #av-mouth-rest {
  transform: scaleY(.22) !important;
}
.archivist-portrait[data-archivist-paused="true"] #page-turn { opacity: 0 !important; }
@media (prefers-reduced-motion: reduce) {
  .archivist-portrait { transition: none; }
  .archivist-portrait svg g {
    animation: none !important;
    transition: none !important;
    transform: none !important;
  }
  .archivist-portrait #av-mouth-rest { transform: scaleY(.22) !important; }
  .archivist-portrait #page-turn { opacity: 0 !important; }
}
```

The speaking rules intentionally use infinite iteration; the controller stops them after two cycles through the transition protocol. Do not rely on `animationend` from an infinite animation. Reading loops restart in phase upon re-entry; the zero envelope hides that restart. The page keyframe's scale is immaterial while opacity is zero. At rest the bare SVG has a small relaxed mouth; integrated CSS compresses it further to the shared closed-mouth still frame.

## Accessibility and delivery checks

The SVG includes a title and description and has no visible labels. Retain them for a standalone image. Suggested external-image alt: “The Archivist, a silver-bearded Breton scholar in a sea-green hood, resting one hand on an open book.” When inlined beside the existing persona heading, either retain `role="img"` and `aria-labelledby="archivist-title archivist-desc"`, or set the whole SVG `aria-hidden="true"` if its identity is already conveyed by nearby text. Do not make each moving group accessible or focusable. Background, compass and turning leaf are decorative.

Reduced motion and the pause toggle both show the same legible still portrait. No flashing, flicker, audio or essential information is carried by animation. Do not announce state changes separately from the existing textual request status and answer. Reading can exceed five seconds, so the pause control is part of integration, not an optional polish item.

Before enabling motion, the Lead should visually inspect at 92 and 120 px, both site themes, and test request success, no coverage, fallback, rapid replacement requests, interruption during page-turn, pause, reduced motion and hidden-page return. Verify registered-property interpolation and book/hand overlap in supported browsers. These checks have **not** been run in this art-only task.

## Proposed credits line

Add to `handbook/theme/art/CREDITS.md` during integration (not edited here):

> `../assistant/archivist.svg` — The Archivist at his reading desk. Original SVG illustration by Sol (OpenAI Codex), 2026-10-25. Original face and composition; no game assets, models, screenshots, copied portraits, external images or fonts. Limited-palette engraved CRPG atmosphere only.
