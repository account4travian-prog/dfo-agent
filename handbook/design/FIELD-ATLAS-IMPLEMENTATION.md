# Field Atlas implementation

Direction A is applied to the production templates and theme. The exact vellum/ink/brass/sea palette is shared by
the automatic and explicit dark themes. Cormorant Garamond semibold carries headings, Source Serif 4 carries the
18px / 1.6 body, and Inter carries interface labels. One Google Fonts stylesheet uses `display=swap`; local serif
and sans fallbacks remain available.

The home route is an ordered list of ten play stages (I-X), followed by reference (R). Thin brass rings and short
rules mark the waypoints, stage headings and article eyebrows. A dotted sea lane joins the home waypoints, with a
single-column reading order at every width. The source stage numbers and content are unchanged.

The original compass-and-open-book wordmark is live SVG text, inlined from `theme/art/wordmark.svg` to inherit the
heading font and `currentColor`. The square `mark.svg` adapts its foreground to the browser's colour preference.
`theme/icons.svg` supplies 20 original, round-stroke symbols on 24px grids. Callout and gate symbols are hidden from
assistive technology; existing labels remain in HTML. Town-service symbols are ready for future components.

Home cards and stage overviews prefer `stage-<id>.svg`, retain `.webp` support, and show an original compass fallback
when neither exists. Art selection reads the copied output assets, preventing references to illustrations that
arrive after that build's asset copy. Rebuild after Claude finishes the series.

The light brass is 4.18:1 on vellum. It is therefore used only for decorative marks, numerals and rules, tested at
3:1. Running text, eyebrows, badges and links retain 4.5:1 checks, expanded across callout and navigation backgrounds.
The contrast tests also lock the exact requested palette, both dark-theme modes, body sizing and semibold headings.

Verification: 41 tests passed, one source-dependent test skipped; checker: 84 pages, zero errors, 52 existing
planned-page/forward-link warnings; build: 84 articles, 11 stage overviews, home, reference atlas and 404.
SVG/WebP/fallback selection, nested asset URLs, Roman plates, sprite coverage, escaping and source-free building
are covered. Browser appearance and live font loading await Claude's visual pass.
