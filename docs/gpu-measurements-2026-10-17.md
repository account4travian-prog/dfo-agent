# Real-GPU measurements: GTX 1070, Daggerfall city (2026-10-17)

A draft issue for Lattymoy/daggerfall-js-source. Several rendering docs say their numbers
come from SwiftShader with no ARENA2 and that a real card is still owed
(`Performance-Next.md` "What is left" items 8 and 9, the GRAIN audit's ground-dial A/B,
LPT1's trees A/B). These are those measurements, from a player's machine with the real game data.

---

**Title:** Real-GPU numbers (GTX 1070) for the cloud march, Steady shadows, the ground dial and the trees

## Machine and method

- **GPU / driver:** NVIDIA GeForce GTX 1070, driver 582.78. WebGL renderer
  `ANGLE (NVIDIA, NVIDIA GeForce GTX 1070 Direct3D11 vs_5_0 ps_5_0, D3D11)`, and
  `EXT_disjoint_timer_query_webgl2` is available.
- **CPU / RAM / OS:** AMD Ryzen 5 3600, 16 GB, Windows 11. The display is 165 Hz.
- **Browser:** Microsoft Edge 155.0.4283.45, driven by the repo's own Playwright (`channel: 'msedge'`).
  Playwright's bundled Chromium isn't installed, so `HEADED=1 npm run perf` doesn't run as-is on this machine.
- **Build:** main at `399fe1605`, served by the Vite dev server with `ARENA2_PATH` set to the Steam install.
  This is the dev server, not a release build, so script times may be higher than a player's.
- **Scene:** `/play/?world&region=Daggerfall&loc=Daggerfall&class=1&novideo&nofoes&shot&fps`, plus `&tod=`,
  `&weather=` and the switch under test. Each scene loads, waits for `__shotReady`, waits 2 s more, then samples
  for 12 s: `__fpsStats()` once a second, plus every `[perf]` line. The tables give the **median of the 13–17
  `[perf]` lines** (each one a 120-frame mean) and the range.
- **Three passes:**
  - (A) 1280×720 at the display's cap;
  - (B) 1280×720 uncapped (`--disable-gpu-vsync --disable-frame-rate-limit`);
  - (C) 1920×1080 uncapped, with `nvidia-smi` logging temperature and clocks every 2 s.

**Read pass A with care.** At the 165 Hz cap every scene's GPU total sat at ~5.5 ms, and cutting one zone grew
another by about the same amount (clouds off: sky −0.3, shadow +0.3). Under a capped frame the zones look like they
take up waiting time, so per-zone A/Bs are only trustworthy uncapped (B and C). Pass A is included only where it
agrees with them.

## Baseline: Daggerfall at noon, sunny

| | 720p uncapped | 1080p uncapped |
|---|---|---|
| FPS / frame | ~195 / 5.1 ms | ~190 / 5.3 ms |
| GPU total (`?perf=zones`) | 4.98 ms | 4.97 ms |
| world | 2.63 | 2.58 |
| shadow | 1.10 | 0.64 |
| air | 0.68 | 1.00 |
| sky | 0.48 | 0.62 |
| grass | 0.05 | 0.12 |
| draws | 1,111 | 1,111 |

- **CPU zones** (`?perf=cpu`, 720p uncapped) total 4.60 ms. The largest are batches 1.17, shadow 0.85, flats 0.55,
  people 0.35, bodies 0.17 and hud 0.17.
- **The GPU isn't fill-bound on this card.** Going from 720p to 1080p (2.25× the pixels) leaves the GPU total flat.
  Only air and grass grow with the pixel count. GPU utilisation while sampling at 1080p was 60–77%.
- **The open road** (`spawn=random`, which picked Merley) measured 5.16 ms GPU at 720p uncapped, at about 185 fps.

## Performance-Next item 8: the cloud march

Here's the sky zone with the cloudy weather, Daggerfall at noon:

| | clouds on (default) | `clouds=lo` | `clouds=off` |
|---|---|---|---|
| 720p, capped (A) | 0.48 | 0.42 | 0.19 |
| 720p, uncapped (B) | 0.46 | 0.30 | 0.17 |
| 1080p, uncapped (C) | 0.61 | — | 0.33 (in a slow window, see "Noise") |

**The cloud march costs about 0.3 ms, about 6% of this card's GPU frame.** All three passes agree.
SwiftShader's 21–29% overstates it badly for a real card, and `clouds=lo` saves about half of it.
At least on a GTX 1070-class card, cutting the clouds wouldn't buy much.

## Performance-Next item 9: Steady shadows at night

Here's the shadow zone, Daggerfall at 22:00, sunny:

| | Steady on (default) | `__DF_SHADOW_TUNING.steady = false` |
|---|---|---|
| 720p, capped (A) | 0.48 | 0.46 |
| 720p, uncapped (B) | 0.44 | 0.43 |

**Steady made no measurable difference here.** Two caveats:
- I set the switch live after the scene settled, and didn't check that it takes effect without a reload.
- The doc's 42 lantern face passes were counted at Knightstale by day, which I didn't measure.

## The ground-sharpness dial (GRAIN)

Here's the world zone, Daggerfall at noon:

| | `ground=off` | default | `ground=max` |
|---|---|---|---|
| 720p, capped (A) | 3.02 | 3.02 | 3.04 |
| 720p, uncapped (B) | 2.57 | 2.63 | 2.60 |
| 1080p, uncapped (C) | (2.91, a noisy window, see below) | 2.58 | 2.61 |

**`max` costs nothing measurable over `off` on this card, at 1080p as well as 720p.**

## LPT1: the trees (`?trees=off`)

| | shadow, trees on | shadow, `trees=off` | world, on / off | draws |
|---|---|---|---|---|
| 1080p, uncapped (C) | 0.64 | 0.39 | 2.58 / 2.58 | 1,111 / 1,095 |
| 720p, capped (A) | 1.48 | 0.58 | (noisy) | 1,111 / 1,095 |

**In this city the trees cost about 0.25 ms of the shadow pass at 1080p, and nothing in the main pass.**
The pass B pair fell in a noisy window and is left out. A wilderness scene would weigh trees more.

## Noise: a CPU-side slowdown that comes and goes

In passes B and C, a few scenes ran about 20% slower across the whole frame. Script time went 10 → 12 ms and FPS
190 → 159, and the scenes that hit it weren't consecutive (in C, the 3rd, 6th and 7th of 7). In the same windows:

- GPU clocks held at 1,850–1,923 MHz, and the temperature peaked at 80–83 °C in every sampling window, slow or not.
- GPU utilisation went *down*.

So it isn't the card throttling. It's on the CPU side, most likely other load on the machine or in the browser. For that
reason only per-zone comparisons are reported above, and FPS comparisons between scenes are left out.

## Smaller observations

- **A one-off freeze:** a 345 ms frame appeared once, in the first night scene of pass A. The air zone peaked
  at 3.83 ms in that window. It didn't happen again in two later night loads, including one in a fresh browser,
  so I'm reporting it as unreproduced.
- **Load times:** reaching `__shotReady` took 52–59 s on a cold browser and 27–31 s warm.
- **`__fpsStats()` script time when uncapped:** with vsync off, it reads ~10 ms against a 5.1 ms frame, whereas
  capped it reads 5.6 ms against 6.1. Possibly a per-interval sum rather than per frame. Worth knowing before
  reading the probe uncapped.
- **The probe on Windows:** `tools/perfProbe.mjs` could take a `CHANNEL=msedge` (or `chrome`) switch, so `HEADED=1`
  works on a machine without Playwright's own browsers. It's a two-line change, and I'm happy to send it as a PR.

The script and raw JSON lines are available if you want them.
