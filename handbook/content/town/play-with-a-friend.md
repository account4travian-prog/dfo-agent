---
title: Play with a friend
summary: Add a friend, form a party, share kills and quests, and leave the group safely.
stage: town
order: 95
gate: none
status: draft
tags: [multiplayer, friends, party, co-op, social]
verified: e4f093166
---

> [!tip] At a glance
> - Friends and parties live in the **Social** interface beside the chat panel.
> - A party holds up to **8 accounts**. An invitation expires after **2 minutes**.
> - Every party member in the room earns the whole kill; Renown gains **+10% per extra member**.
> - Mentor mode switches on automatically for a much higher-level member, so you can play together without trivialising the content.
> - Questline steps cannot be shared. Shareable quests give each member their own copy and their own progress.

## Before you start

You both need to be **online** and in the shared world. DFO is one world rather than a set of lobbies: there is no "server select" step, and the game keeps friends and parties as account relationships (`server/src/index.js` is the social hub; `src/net/social.js` is the client's picture). Guest accounts can play; whether a guest can hold friends and join parties is not stated in the source, so treat registration as the reliable route for social play (see [Your account](../begin/your-account.md)).

You will also want a place to meet that is easy to describe: a town's gate, a tavern or a guild hall. The world is large, and the travel tools are faster once you are in a party.

## Step 1: add a friend

Open the **Social** panel, the button beside the chat panel, and use the friends area.

1. Send a **friend request** by account or name.
2. The other player accepts or declines from the same panel.
3. Once accepted, the friend's row shows whether they are online or when they were last online.

The source's limits are one home for the whole list: **64 friends** and **32 pending requests each way** (`src/net/wire.js`: `FRIENDS_MAX`, `PENDING_MAX`). A blocked account's friend request, party invitation and notes never land, and are taken back if they were already waiting when you blocked them (`src/net/social.js`: the block behaviour; `/block`, `/unblock`, `/blocked`).

## Step 2: form the party

1. From the friends row, choose **Invite** to send a party invitation. Any party member may invite, not only the leader (`src/net/social.js`: `actionsFor`, "any member may invite - the hub's law").
2. The other player accepts from the **Party** tab or from the invitation toast.
3. A party holds at most **8 accounts**, including you (`src/net/wire.js`: `PARTY_MAX`).
4. An invitation is good for **2 minutes** (`INVITE_TTL_MS`); after that it lapses and must be sent again.

The Party tab is also where the group lives: it shows the members, their poses (health, fatigue and spell points), who is online, and the leader controls. The leader can **kick** a member or **make another member leader**; any member can **leave the party** (`src/ui/socialPanel.js`: the party rows and their buttons). Party members' names are drawn **green** over the world (`src/net/social.js`: `PARTY_GREEN`).

## Step 3: meet and travel together

The fastest way to gather is party travel:

- `/leader` offers to take you to your party leader. You pay your own fare and arrive beside them, or at the door if they are inside (`src/systems/party/partyTravel.js`).
- The leader can call a **party journey** with `/travel`. Followers have **30 seconds** to join. If you miss the window, fall back to `/leader`.
- Party travel arrives at the world's present and does not advance world time, and it cannot cross into or out of the **Open Zone** or across the **Veil** (`src/systems/party/partyTravelLaw.js`: `TRIP_FOLLOW_MS`, fare and boundary rules).

For ordinary walking, the middle mouse button drops a **party ping**: a mark for your party for 5 seconds, and a route for 12 (`reference/keys-and-commands.md`). Waypoints you place can be shared with your party (`src/ui/waypointMenu.js`: "Your party sees it").

### Mentor mode: the safety net for mixed levels

If one of you is much higher level, the game becomes the mentor automatically. A party is measured by a reference level that leans toward its lowest member; when that reference is at least **3 levels** below yours, you fight as the reference level and your real progress is kept (`src/systems/mentorMode.js`: `MENTOR_MIN_GAP`, `mentorTargetLevel`, `mentorProfile`). You do not need to switch anything on, and `/mentor` prints whether you are mentoring.

This is what makes "play with a friend who is new" practical: the high-level character does not delete the content, and the low-level character does not get carried by numbers alone.

## Step 4: what is shared and what is not

| Thing | How it works |
|---|---|
| Kills | Every party member in the room earns the whole kill rather than a split. Renown gains **+10% per extra member** (`src/net/renown.js`: `RENOWN_PARTY_BONUS_PCT`, `renownPartyXp`; `docs/23-playing-online.md`, "Group up with the strong players"). |
| Quest progress | A shareable quest is copied to each member; each member keeps their own quest state. **Questline steps cannot be shared** (`src/systems/quest/questShare.js`; `town/meeting-players.md`). |
| Quest dungeons | A quest's dungeon can be opened as **your instance**, a copy for you and your party, at full size (`docs/23-playing-online.md`, "Dungeons without the crowds"; `src/scenes/instanceDoor.js`). |
| Loot | Some containers have a shared base list: taking from it can change what remains for the others. Personal bonus loot is separate (`src/scenes/roomLootHost.js`). Loose loot in a public dungeon is first come (`docs/23-playing-online.md`). |
| Party rest | `/ready` explains the party rest state online; resting together is a party action rather than a solo one (`reference/keys-and-commands.md`). |

The party does not share a bank, a purse or a quest log. Loot etiquette — who takes what — is a player agreement, not a rule the game enforces. If a shared container matters, say what you are taking.

## Step 5: leave safely

1. **Finish in a safe place.** Party travel follows the leader; if you leave the party deep in a dungeon, you will walk out yourself. Leave at a town, a port or a cleared entrance.
2. **Use Leave party.** The button is in the Party tab. A leader who leaves should hand leadership over first if the group is continuing; the Party tab has the **Make leader** button (`src/ui/socialPanel.js`: party rows, `Make leader`, `Leave party`).
3. **Say goodbye.** There is no need to drop the group to log off. Your character checkpoints as you go; the party simply sees you offline.
4. **If someone is harassing you.** Block them (`/block`) and report them (`/report`); blocked accounts cannot send you requests, invitations or notes. Use `/bug` for a private report to the developers, or the project's issue tracker and Discord for a fault (see [Troubleshooting](../begin/troubleshooting.md) for the reporting routes).

## Unverified or unstated

- The source does not state a dedicated key for the Social panel; the panel is described as a button beside the chat UI.
- The source does not state whether a guest account can hold friends or join a party; registration is the safe assumption for social play.
- The source does not state that party kills share character XP; the documented full-kill and +10% rule is the **Renown** reward.
- Party composition rules at the level of classes or roles are not stated; any mix is allowed by the party law.

## Common mistakes

- **Inviting a player who is offline.** The request needs a tab in the world; offline friends cannot accept.
- **Letting the invitation expire.** Two minutes pass while you are still in a dungeon.
- **Assuming the leader pays for party travel.** Each travelling member pays their own fare.
- **Expecting a shared questline step.** Questline steps are personal; only shareable quests copy.
- **Leaving the party at the bottom of a dungeon.** You lose the easy way back to the group.

## Next

- [Meeting other players](meeting-players.md)
- [Party travel](../travel/party-travel.md)

## Sources

- `src/net/social.js`: friend and party picture, `FRIENDS_MAX`/`PENDING_MAX` via the wire bounds, `PARTY_GREEN`, `actionsFor` (any member may invite), block behaviour
- `src/net/wire.js`: `PARTY_MAX` (8), `INVITE_TTL_MS` (120,000), `FRIENDS_MAX` (64), `PENDING_MAX` (32)
- `src/ui/socialPanel.js`: the Social panel, friends and party tabs, `Invite`, `Accept`, `Make leader`, `Kick`, `Leave party`
- `src/systems/party/partyTravel.js`, `partyTravelLaw.js`: `/leader`, `/travel`, `TRIP_FOLLOW_MS`, fares, boundaries
- `src/net/renown.js`: `RENOWN_PARTY_BONUS_PCT`, `renownPartyXp`
- `src/systems/mentorMode.js`: `MENTOR_MIN_GAP`, `mentorTargetLevel`, `mentorProfile`, `mentorStatusText`
- `src/systems/quest/questShare.js`: copied quest state and questline sharing refusal
- `src/scenes/roomLootHost.js`: shared container base list
- `src/scenes/instanceDoor.js`, `src/net/instanceRoom.js`: private quest instances
- `reference/keys-and-commands.md`: party ping, `/leader`, `/travel`, `/ready`, `/mentor`; `src/ui/waypointMenu.js`: shared party waypoints
- `docs/23-playing-online.md`: kills, mentor mode and party bonus; `docs/32-questions.md`: the "play with a friend" gap this page answers
- `src/net/safety/safetyLaw.js`, `src/net/social.js`: block and report behaviour
- The source does not state a Social-panel hotkey, guest social limits or shared character XP.
