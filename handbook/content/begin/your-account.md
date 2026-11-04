---
title: Your account
summary: Play as a guest straight away, then register before you invest in professions, trade, guilds or event rewards.
stage: begin
order: 30
gate: none
tags: [account, guest, registration, recovery codes]
verified: 0df2d87eb
---

> [!tip] At a glance
> - You can start playing at once as a **guest**; your progress lives on a guest account.
> - **Register** before you gather, craft, trade on the market, join a player guild, or collect festival and event rewards.
> - Registering keeps everything you have already done: it adds a username and password to the same account.
> - Registration gives you **eight recovery codes**, shown once. Save them somewhere safe.

## Guest play

When you first open DFO Online you enter as a guest with a generated name. A guest can connect, explore, fight, chat
and complete quests. Guest play is not a time-limited trial.

A guest account belongs to the device and browser it was made on. The account service treats a guest as "a device":
anything it would store for a guest could be lost with cleared browser data, so it refuses to keep the things below
for guests at all.

## What a guest can't do

| System | Guest | Registered |
|---|---|---|
| Professions (gathering and crafting) and Stores | Refused | Yes |
| The global market | Refused | Yes |
| Player guilds | Can't found or join | Yes |
| Marks (the account currency) | No balance | Yes |
| Witches' Festival Soul Cakes and offerings | Refused | Yes |
| Starfall claims | Thanked, never counted | Counted toward rewards |
| Questline deeds and rewards | Steps can start, but deeds and rewards aren't recorded; some lines require registration | Recorded |
| Renown | Tracked by account | Tracked by account |

The practical rule: if you plan to play for more than an evening, register early. Nothing you did as a guest is lost
when you do.

## Registering

1. Open the **Account** screen and choose **Register**.
2. Choose a username and password. An email address is optional.
3. The game shows your **recovery codes**: eight of them, displayed once and never again. Each code can open your
   account if you forget your password.

> [!warning] Save your recovery codes
> The service stores only a scrambled form of each code, so nobody (including the game's staff) can show them to you
> again. Write them down or keep them in a password manager before you close the screen.

The Account screen later shows how many unused recovery codes you have left (a count, never the codes themselves).

## Common mistakes

- **Playing for days as a guest.** Gathering, crafting, market trades and event rewards you earned as a guest were
  never recorded, and can't be claimed after you register.
- **Clearing browser data while still a guest.** The guest account is tied to that browser.
- **Not saving recovery codes.** Without them and without your password, there is no way back in.

## Next

- [Interface skins and menus](interface-and-skins.md)
- [Creating your character](../creation/creation-screens.md)

## Sources

- `server-account/src/accounts.js`: `accountKind` (guest vs linked), recovery set (`mintRecoverySet`,
  `recoveryLeft`, eight codes shown once)
- `server-account/src/professions.js`, `server-account/src/market.js`: `prof-need-account` refusal for guests
- `server-account/src/guilds.js`, `server-account/src/marks.js`: guest is "a device"; no guild or Marks balance
- `server-account/src/festival.js`: `guest` refusal for Soul Cakes and offerings
- `server-account/src/stars.js`: guests thanked but never counted for Starfall
- `src/net/questlineClaims.js`, `server-account/src/questlines.js`: questline deeds for registered accounts
- `src/net/renown.js`, `server-account/src/renownTracks.js`: Renown tracked by account
