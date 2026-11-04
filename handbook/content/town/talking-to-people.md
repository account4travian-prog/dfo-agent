---
title: Talking to people
summary: Ask about places, people and news with a tone suited to the person, and use the town's reputation to understand their response.
stage: town
order: 50
gate: none
tags: [talk, people, directions, reputation]
status: draft
verified: 0df2d87eb
---

> [!tip] At a glance
> - Use **Tell me about** for information and **Where is** to ask about places, people, things or work.
> - Polite and Blunt draw on Etiquette and Streetwise respectively; Normal avoids either tone's social-group modifier.
> - A person's willingness to talk reflects the local People faction's view of you and your social standing.
> - A helpful direction may point toward a place or mark it on your map, but not every person knows every answer.

## Choose what to ask

Start a conversation with a towns-person, then choose **Tell me about** or **Where is**. The first offers general topics and named organizations ([the NPC guilds](npc-guilds.md)). The second sorts questions into Location, People, Things and Work. Ask about a service when you need directions; the map reveal, when it happens, marks the building so you can find it after the conversation.

People do not share one universal opinion. Townsfolk stand with their region's People faction, and the greeting reflects that faction's reputation toward you together with your biography and standing with their social group. If someone refuses to speak, another person may react differently.

## Tone and skill

The three tones are **Polite**, **Normal** and **Blunt**. Polite uses Etiquette; Blunt uses Streetwise ([the skills](../creation/attributes-and-skills.md)). Each question rolls an answer tier using your Personality, the question type, your tone and the relevant skill. Polite and Blunt can suit different social groups, so there is no single tone that improves every exchange.

Questions are not guaranteed to produce a useful answer. The person may not know the place, and a low answer tier can give only a brush-off. When you are looking for a building, ask several people or use the [town map](reading-a-town.md).

## Common mistakes

- **Using Blunt on a polite crowd.** Blunt rolls Streetwise and Polite rolls Etiquette, and the wrong tone for the social group lowers the answer tier; a brush-off leaves you without directions. Cost: a wasted search.
- **Giving up after one refusal.** Townsfolk answer from their own faction's view of you, so another person may help where the first would not; ask several or use the [town map](reading-a-town.md). Cost: a building you never find.
- **Expecting every answer to be true or useful.** A low answer tier can return only a brush-off, and not every person knows every place; a wrong direction can send you across town. Cost: travel time.

## Next

- [The NPC guilds](npc-guilds.md)
- [Notice boards](notice-boards.md)

- [Standing and reputation](standing-and-reputation.md)
## Sources

- `src/systems/talk/talk.js`: `getReactionToPlayer`, `directionHintString`
- `src/systems/talk/talkSession.js`: `greetingTextId`, `REFUSE_TALK_REACTION`
- `src/systems/talk/talkTopics.js`: `TOPIC_CATEGORIES`, `reactionTier012`, `buildingHint`
- `src/ui/enhanced/enhancedTalk.js`: `CATEGORY_BUTTONS`, `TONE_LABELS`
- Research: `handbook/research/T1.md` (talk and topics; reputation with the People)
