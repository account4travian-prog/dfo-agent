# The Archivist help widget

Design notes and research for the floating home-page Archivist, implemented in
`handbook/theme/assistant/home.js`, `handbook/theme/assistant/archivist.svg` and the home styles in
`handbook/theme/handbook.css`.

## What similar sites do

The common pattern is a **launcher plus a separate conversation panel**, not a permanent form embedded in the page:

- **Launcher:** a small bottom-corner control, usually 56–64 px, with a clear scope label. It is a fixed overlay; it does
  not take part in page layout.
- **Window:** roughly 360–420 px wide on desktop, with a header (name, scope, minimize/close), a message/body area and a
  composer. On phones, the window is usually full-screen because a small floating panel becomes unusable once the
  keyboard appears.
- **Three states:** open, minimized and closed. Minimizing should keep the conversation; closing dismisses the widget
  but leaves a way to reopen it. Auto-opening on page load is generally treated as intrusive.
- **Quiet styling:** use the host site's type, colour and corner radii. A chat widget that looks like a vendor default
  reads as bolted on.
- **Persistence:** position, dismissed state and conversation/thread survive navigation where possible.

Sources:

- [Chatbot Window UI Design: Widget Patterns for Websites](https://designpixil.com/blog/chatbot-window-ui-design) —
  launcher placement, 360–420 px window, open/minimized/closed states, no auto-open, mobile full-screen.
- [Intercom Messenger customization](https://www.intercom.com/help/en/articles/178-customize-your-intercom-messenger) —
  launcher alignment/padding and the desktop/mobile difference.
- [Zendesk Web Widget appearance](https://support.zendesk.com/hc/en-us/articles/4500747797914-Configuring-the-name-and-appearance-of-the-Web-Widget) —
  launcher shape/text and custom launch behaviour.
- [HubSpot chat customization](https://knowledge.hubspot.com/inbox/connect-and-customize-a-chat-channel-in-the-conversations-inbox) —
  welcome prompt, away state and mobile as a separate channel.

## What we built

- **Fixed overlay:** `position: fixed`, so the mark and panel never change the hero or page height. Verified by
  measuring `.hero` and `.start-card` before and after removing the widget.
- **Initial placement:** the launcher starts in the measured gap between `.hero-copy` and `.atlas-art`. It is not a
  grid child and has no static footprint.
- **Drag:** pointer drag moves the launcher anywhere in the viewport, clamped to the viewport; the position is stored in
  `localStorage`.
- **Open/minimized/closed:** the header has `–` (minimize, keep the launcher) and `×` (close, show a small reopen pill).
  Clicking the launcher opens the panel; Escape and outside-click close the panel.
- **Persona:** the launcher uses the layered, animated Sol 6.1 reading-desk portrait inline, cropped to the face. It
  breathes and scans while reading, and the mouth/head loop while the panel is open. `prefers-reduced-motion` disables
  the loops.
- **Query flow:** submitting the panel searches the same `/search-index.json` corpus in place and shows the closest
  quoted passages inside the expanded widget. It also calls `/api/ask` in the background for an optional written answer;
  the full `/ask/` page remains an optional link, not a requirement.

## Deliberate deviations

- The initial position is **between the hero copy and the map**, as requested, rather than the conventional
  bottom-right corner. Once opened or dragged it behaves like a conventional help launcher; closing leaves a
  bottom-right reopen pill so it is still discoverable.
- The launcher is 130 px so the complete Sol portrait is visible, rather than a cropped face; the panel is 360 px wide and anchored to the launcher. It overlays the page
  while open, as chat widgets normally do; the page itself does not reflow.
