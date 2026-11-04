# Other Players and Staying Out of Trouble

*Studied 2026-10-21 against DFO Online commit `4bba28c6c` (2026-10-20). This is an online-only guide for Tiger Fist. Paths in *Sources* are inside `upstream/daggerfall-js-source/` unless marked `docs/`.*

## Account: guest or registered

You can enter as a guest with a generated name. Guests can connect, walk, chat and play; guest play is not itself a trial mode. Registration adds a username and password to the same account, so your account ID and existing progress stay with it. Email is optional. Save your recovery codes when registration offers them: they are the way back if you forget the password.

Registration matters for account-backed systems. Guests cannot use the professions (including gathering), market, or player guilds; they cannot keep Soul Cakes or claim the Witches' Festival's account rewards. Questline steps can start for a guest, but their witnessed deeds and rewards are not recorded; some lines explicitly require a registered account. Ordinary Renown is tracked by account ID and is not a blanket guest lock. Some event reward claims, such as raid and Starfall claims, do refuse guests. Register before investing in those systems.

Open the Account screen, choose Register, and add a username and password to the current guest account. Registration does not require an email address.

*Sources: `server-account/src/index.js` guest routes and account gates; `server-account/src/accounts.js` `accountKind`; `server-account/src/professions.js`, `market.js`, `guilds.js`, `festival.js`, and `questlines.js`; `src/net/questlineClaims.js`; `src/net/renown.js` and `server-account/src/renownTracks.js`; `src/net/accountClient.js` registration flow.*

## Finding people and grouping up

Open chat and use `/help` for the command list. Useful channels:

| Command | Who hears it |
|---|---|
| `/world` or `/g` | World channel |
| `/region` or `/r` | Players in your region |
| `/local`, `/l`, `/say`, or `/s` | Nearby players |
| `/party` or `/p` | Your party |
| `/guild` or `/gu` | Your guild |
| `/trade` or `/tr` | Trade channel; `/join trade` also adds it |
| `/lfg` | Looking for group; `/join lfg` adds it |
| `/find name` or `/who name` | Find online players by name |

`/lang` lists language channels; `/lang code` joins one. The Local tab also supports `/ooc` for an out-of-character aside and `/rp` for a roleplay line. The chat roster belongs to the selected tab; the party and guild tabs appear when applicable. Use `/block name` to hide someone's chat, invites, and requests; `/unblock` and `/blocked` manage that list. Use `/report name` or a chat line's Report action for a private report to moderators. `/bug` opens the private developer report form.

Invite a nearby player from their Inspect card, the F interaction menu, a social panel or roster row. The first invitation creates the party; any party member may invite, but only the leader may remove a member. The invited player must accept. A party holds eight accounts, counting you; a ninth cannot join. The Members/roster views show who is online, your party seats, and guild members when their roster is open. Party names are green in the world and chat.

The party travels as one group: its location follows the leader. Use `/leader` to travel to the leader. For a leader-led journey, the leader uses `/travel` to call or cancel the journey and party members answer ready. Quest sharing is separate: sharing a quest lets the party fight that quest's foes together, while each character keeps their own quest copy and progress. See [The Play Guide](23-playing-online.md) for dungeon instances and shared-room loot.

Find player guilds through their hall and recruitment systems or join an invitation. Guild discovery, invitations and membership require a registered account. The guild's Members view and the chat roster are the useful places to inspect membership and who is online. See [City Control and Guilds](26-city-control.md) for city seats and guild politics.

*Sources: `src/net/chatCommands.js` `CHANNEL_COMMANDS` and `HELP_LINES`; `src/net/chat.js` `CHAT_TABS`; `src/net/social.js`; `src/net/wire.js` `PARTY_MAX` (8); `bible/06-Systems/Social-Party-Arc.md` SOC1-SOC6 and PARTY8; `src/scenes/world.js` party travel commands; `bible/06-Systems/Community-Arc.md` CHAT-CHAN and DUEL1; `server-account/src/guilds.js`.*

## Can another player hurt you?

In ordinary co-op, other players cannot hit you with melee, arrows, spells or weapon techniques. Duels are the consensual exception: one player challenges, the other accepts, and the bout runs outdoors inside a bounded ring. A duel cannot hurt your character: the relay referees it on a separate duel vitality bar, and your real health is never touched (nobody drops to 1 health and nothing is healed). The duel is not a license for bystanders to attack.

The Arena runs separate refereed bouts and matchmaking in Arena rooms. It is PvP by the match rules, not an open town fight. Sieges are separate, refereed battle rooms for competing sides; player attacks are judged by the siege referee. The Wrothgarian Mountains Open Zone is the non-consensual exception: PvP is enabled in its wilderness and its dungeons. See [The Play Guide](23-playing-online.md) for its danger and death-drop warning.

Dungeon loot in an ordinary shared room is first-come: another player may take loose loot before you do. There is no general “loot stealing” crime for ordinary dungeon drops. Shared bodies and containers use their own take rules; a stranger taking goods from a protected shelf, cupboard or shop is a crime. See [The Play Guide](23-playing-online.md) for how public and private rooms work.

*Sources: `bible/11-Multiplayer/Multiplayer.md` §What it is, and is not; `bible/06-Systems/Integrity-Arc.md` §5 (INT8 duel vitality); `src/net/duel/duelRef.js` and `src/net/wire.js` duel gates; `bible/06-Systems/Community-Arc.md` DUEL1; `bible/11-Multiplayer/Arena.md` ARENA4; `src/net/siege/siegeRef.js`; `bible/11-Multiplayer/Wild-Zone.md` §3; `src/systems/crimes.js`; `src/systems/theft.js` theft target rules; `bible/06-Systems/Online-Arc.md` OUTDOOR-LOOT.*

## Crime and the law

Theft includes taking a protected person's goods; shop shelves and strangers' cupboards are protected targets. Trespass and breaking and entering are crimes, as are assault and murder. A crime can be charged when the watch catches you; getting away or dying ends the active chase but does not repay the standing loss. The law tracks standing by region.

Guards can stop a known criminal they see in town. At legal standing below -10, the watch can demand a fine or arrest; refusing starts the arrest chase. A paid fine improves standing, and a court sentence repays the charge for lesser crimes. Assault, Murder and Treason leave half their legal standing loss as a lasting mark even after sentence. An acquittal restores the full charge. A Temple pardon can lift banishment; Murder or Treason can lead to a 30-day banishment. To settle an active crime, answer the watch or court; dying or getting away only ends the chase. A bounty contract is separate: completing one on the regional board improves that region's legal standing by two points.

A Curfew is an edict chosen by a town's ruling seat. At night its guards are stronger, and crimes there cost twice the legal reputation. It is a rule of that town, not a world-wide curfew. See [City Control and Guilds](26-city-control.md) for how seats and edicts change.

*Sources: `src/systems/crimes.js` `CRIMES`; `src/systems/theft.js`; `src/systems/court.js` `changeLegalRep`, `sentenceRefund`, and `arrestFlow`; `src/scenes/cityGuards.js` `guardSeesPlayer`; `bible/06-Systems/Standing-Arc.md` REP1-REP5; `src/net/townSeatLaw.js` `CURFEW`; `src/systems/seatEdicts.js` crime and guard effects.*

## Factions and Fighters Guild ranks

Faction reputation is separate from your online Renown. It changes through actions the faction recognizes, including quests; the law and the People of a region can track separate standing. Low standing can close guilds, dialogue and quests. See [City Control and Guilds](26-city-control.md) for regional factions and guild control.

For the Fighters Guild, join first, then take its quests and use the services your current rank permits. Promotion checks the next rank's reputation and skill bars: at least one guild skill must meet that rank's high bar, and at least two must meet its low bar. Hand-to-Hand counts as a Fighters Guild skill. Online promotion does not wait for the offline review delay: once the requirements are met, you can rise. Higher ranks open higher-tier guild quests and access to rank-limited services; the guild's quest ladder and service menu show what your rank unlocks. A guild may also refuse you for poor regional standing or hold you on probation until your skills and standing meet its entry rules.

*Sources: `src/systems/faction/factionRep.js`; `src/systems/guild/guilds.js` `rankNeeds`, `RANK_REQ_REPUTATION`, `RANK_REQ_SKILL_HIGH`, `RANK_REQ_SKILL_LOW`; `src/systems/guild/guildServiceFlow.js` `serviceAccess`; `src/systems/guild/guildServices.js`; `bible/06-Systems/Standing-Arc.md` REP6, PROMO-NOW and REPUTE-GATE; `bible/06-Systems/Questlines-Arc.md` guild quest ladders.*

## Disease, vampirism and lycanthropy

Ordinary diseases come from disease-bearing attacks and effects; a successful infection applies the disease's own stat and fatigue effects over time. Tiger Fist's class has Immunity to Disease, so ordinary disease infection is blocked. Special infections for vampirism and lycanthropy bypass ordinary disease immunity; being disease-immune does not protect you from those curses.

Vampirism and lycanthropy are separate infections with quest and cure paths. Vampirism grants its clan spells and disease immunity, but its stats are reduced by 20 when the vampire is bareheaded in sunlight; a raised hood protects the stats. It no longer burns the vampire in sunlight. A lycanthrope gains its +30 to listed skills, including Hand-to-Hand, only in beast form; its human form keeps the character's ordinary combat values. It must kill an innocent about once per character month or suffer the curse's health loss. Transformation and that recurring requirement are costs; the curse is not a free permanent fist bonus.

For Tiger Fist, lycanthropy has the more direct fist tie: its beast-form +30 includes Hand-to-Hand, and BAL6 lets the claws use the bare-hand combat route. Those benefits are beast-only, with a monthly innocent-kill requirement and forced transformation to manage. Vampirism's disease immunity is redundant for this class, and its clan spells do not fit the no-magic build; its stat benefit depends on time of day and the hood. Either curse is a separate playstyle choice, not a free permanent bonus.

*Sources: `docs/05-strongest-melee.md` Tiger Fist advantages; `src/systems/diseases.js` `startDisease`; `src/systems/effects.js` `isEntityImmuneToDisease`; `src/systems/infection.js` `startInfection`; `src/systems/vampirism.js` `vampireStatMod`; `src/systems/lycanthropy.js` `lycanthropeAdvantages` and `NEED_TO_KILL_PERIOD`; `bible/05-Combat/Balance-Arc.md` §12 BAL6.*

## The main quest online

DFO Online is not a shared campaign: the main quest and ordinary quests belong to your character. Other players do not complete your quest for you. A quest's named dungeon can be entered in your own instance with your party; shared quests let party members encounter the same quest foes while keeping their own copies and progress. The Curse of Daggerfall is a world quest whose street ghosts and wraiths are shared encounters. Playing the main quest matters for its story and rewards; it is not required to join the online party, guild, Renown or event systems.

*Sources: `bible/11-Multiplayer/Multiplayer.md` §The three locked decisions; `bible/11-Multiplayer/Instances.md`; `src/systems/instancePlaces.js` `openerQuestOf`; `bible/06-Systems/Questlines-Arc.md`; `bible/01-Overview/Active-Arcs.md` CURSE-SYNC and `src/scenes/world.js` S0000977 encounter setup.*

## Interface essentials

- **Esc, pause menu:** Quests shows your quests and questlines; Growth shows level, specialisations and the Firmament; Holdings shows what you own, such as mounts, ships, companions and stores. The exact sections visible can depend on the UI skin and enabled systems.
- **L, journal:** read your accepted quests and their current objectives. Questlines also have a consolidated view from the pause menu's Quests tab.
- **Map and Overworld:** use the map for nearby places and quest marks; use the Overworld for long journeys and marked quest destinations. See [Getting Around](30-travel.md).
- **Hotbar:** assign actions you use often and check Controls for the active bindings. Technique input is a separate combat binding (the Weapon technique key, the mouse's back side button by default); see *Your gauntlet techniques* in [The Play Guide](23-playing-online.md).
- **Controls:** open the Controls screen before changing keys; the game has separate movement, combat, interface and technique bindings.
- **`/bug`:** opens the private report form for bugs, exploits or account-security issues. `/report` is for a chat line or player conduct report to moderators.

*Sources: `src/ui/enhanced/enhancedMenu.js` `PAUSE_TABS`; `src/systems/questlines/qlLines.js`; `src/ui/quest/questJournal.js` and `src/ui/questlines/qlJournal.js`; `src/scenes/overworldForecastHost.js`; `src/ui/enhanced/enhancedHotbar.js` and `src/ui/enhanced/enhancedControls.js`; `src/net/chatCommands.js` `HELP_LINES` and `mailboxCommandOf`; `src/net/privateReport.js`; `bible/06-Systems/Private-Reports.md`.*
