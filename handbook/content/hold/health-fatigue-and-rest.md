---
title: Health, fatigue and rest
summary: Watch your health and fatigue, and recover with rest when you have a safe place to stop.
stage: hold
order: 70
gate: none
tags: [health, fatigue, magicka, rest, survival, hunger, temperature]
status: draft
verified: e4f093166
---

> [!tip] At a glance
> - Health, fatigue and spell points are separate pools; exertion spends fatigue.
> - Online, rest at a bed, lit fire or tent; a night advances your character's clock while a short rest does not, and rest restores spell points for every class.
> - Do not begin a rest with enemies nearby, while swimming or while airborne. Poison and disease are not cured by resting.
> - **Climates & Calories** adds hunger, thirst, warmth and sleep; its default **Boons** tier takes nothing from you and rewards needs met.
> - **Horse care** is a separate row: feeding a horse grows its bond, and every five bond points raise all four of its stats.

## Watch your pools

Health keeps you alive. Fatigue is spent through exertion such as walking, running, climbing, swimming and jumping.
Spell points are spent when you cast. You can check the pools on the interface while exploring.

## Rest to recover

Resting restores health, fatigue and spell points. Health recovery depends on Medical and your character's health.
Online, rest at a bed, lit fire or tent. When a night is due, resting advances your character's clock; a short rest
between nights does not. Online rest also restores spell points for every class.

Where you sleep changes what the sleep is worth. A bed (a rented room, your own house or your ship) and a camp within reach of a lit fire are the good sleep: they pay the full hourly recovery in every tier, and the survival sleep debt clears at 1.5 hours an hour. Bare ground is rough: on Hard it pays half recovery, brings more interruptions and leaves a stiff morning; Casual and Boons keep the full hour.

Danger can interrupt an online rest action.

If you are poisoned or diseased, the game warns that resting will not cure the condition and asks whether you want to
rest anyway. Choose a proper cure when one is available; do not treat sleep as a remedy.

> [!warning] Find a safe place first
> The game refuses to start a rest when enemies are nearby, while you are swimming or when you are not grounded. Hard
> survival also blocks rest in severe cold without shelter or fire, and in extreme heat even when sheltered.

## If fatigue runs out

When fatigue reaches zero with no nearby enemies and while you are not swimming, you collapse and lose an hour while
recovering. If you reach zero in water or with enemies nearby, the game damages your health instead. Watch fatigue
while moving and avoid unnecessary exertion when you are already worn down.

## Survival: food, water, warmth and sleep

**Climates & Calories** (Ralzar's mod, as a **Features** row) adds hunger, thirst, sleep, felt temperature and wetness. It has four tiers: **Off**, **Boons** (the default), **Casual** and **Hard**. Online each player chooses their own tier: the world's counters and food are shared, but only your body pays your tier's price. The temperature plate beside the compass is on by default.

The needs move in stages. Hunger counts since your last meal: **Peckish** at 4 hours, **Hungry** at 12 and **Starving** at 24. Thirst runs from **Thirsty** at 50 to **Parched** at 80 and **Dehydrated** at 100 on a 150 scale, with harm past 120. Sleep debt starts after 16 waking hours: four hours of debt makes you **Tired**, eight **Drowsy** and twelve **Exhausted**. Wetness runs from **Damp** to **Drenched**.

Food is the first answer. A meal's satiety holds the hunger clock, and better food lasts longer: rations about four hours, cooked fish far more than raw, meat more than raw meat. Food spoils through Fresh, Stale, Mouldy, Rotten and Putrid stages, and each stage feeds less. A waterskin holds drinks; one drink takes 40 off your thirst.

What each tier charges:

| Tier | What unmet needs cost |
|---|---|
| Boons (default) | Nothing. Needs never go red. Meeting them earns boons: **Well fed** (+5 Strength, +5 Endurance), **Quenched** (+5 Agility, +5 Speed), **Well rested** (+5 Intelligence, +5 Willpower, from a bed or fire only) and all three at once, **Thriving** (+5 Luck). A lit fire beside you while awake restores fatigue. |
| Casual | Unmet needs borrow stamina down to half the pool, and the loan is paid back when the need is met. No rest gate, no sickness, no stiff morning. |
| Hard | Unmet needs cost attributes and health; wet armour rusts; raw or spoiled food can make you sick; a rough night leaves you stiff for four hours; rest is refused in freezing cold without fire or shelter and in scorching heat. |

On Boons and Casual, raw or spoiled food cannot make you sick. On Hard it can. Exposure and dehydration can kill on Hard, but never in your sleep or in mid-jump.

## Feeding a horse

**Horse care** is its own Features row: **Off**, **Boons** (the default) or **Hard**, each player's own online. Each horse rolls its own Speed, Stamina, Endurance and Strength between 20 and 80. Feeding raises its **bond** with you: a day's food (a **Sack of Oats**) adds three bond points, and an apple is a smaller treat it loves a little more. Every five bond points are +1 to all four of its stats, so a fed horse is a better horse.

Hunger still shows as Fed, Hungry or Starving, but only Hard makes it cost anything: on Hard, Hungry takes ten off every stat and slows its breath, and after two days unfed it is Starving (twenty-five down, no gallop, and the bond fades). A horse never dies of hunger. A stabled horse is fed for you, a horse left waiting grazes, and one kept with you eats from your packs when game time passes.

## Common mistakes

- **Sleeping on bare ground as a habit.** On Hard, rough rest pays half and can leave you stiff; a bed or a fire is the better sleep.
- **Resting when a need is at its worst and expecting a full recovery.** On Casual and Hard, unmet needs still weigh on you; on Boons, meet the need first and take the boon.
- **Ignoring the temperature plate.** Felt cold and heat decide whether Hard will refuse your rest at all.
- **Feeding a horse only when it is starving.** Bond is the reward for feeding well, and on Hard starvation also fades it.
- **Treating a potion as a cure for hunger or thirst.** Survival needs are fed and watered, not cured.

## Next

- [Dying online](dying-online.md)
- [Leaving the Hold](leaving-the-hold.md)

## Sources

- `src/systems/rest/rest.js`: `healthRecoveryRate`, `fatigueRecoveryRate`, `spellPointRecoveryRate`, `exhaustionOutcome`
- `src/systems/survival/rest.js`: `REST_KIND`, `REST_COST`, `STIFF_HOURS`, `restBlock`, `restKind`, `restCost`
- `src/systems/rest/restSession.js`: `restDecision`
- `src/systems/rest/restAct.js`: online rest action and rest points
- `src/systems/survival/difficulty.js`: `SURVIVAL_DEFAULT`, `SURVIVAL_RULES` (Boons, Casual, Hard)
- `src/systems/survival/needs.js`: `NEED`, `DRAIN`, `BOON`, `BOON_IDS`, `WELL_RESTED_PER_SLEEP_MINUTE`
- `src/systems/survival/food.js`: `FOOD`, `FOOD_STAGE`, `DRINK_RELIEF`, `foodSatiety`
- `src/systems/survival/temperature.js`: felt temperature and its words
- `src/systems/features.js`: Climates & Calories and Horse care rows, online player-owned declaration
- `src/systems/online/onlineLane.js`: player-owned online survival setting
- `src/systems/steedCare.js`: `STEED_STATS`, `HUNGER`, `BOND_STEP`, `DAY_BOND_TENTHS`, `STEED_FOODS`, `feedHorse`, `hungerOf`
- `src/systems/upkeep/upkeepTiers.js`: `HORSE_CARE_RULES`, `HORSE_CARE_DEFAULT`
- `src/systems/rest/restWarning.js`: `restAilmentLines`
- Research note: `handbook/research/H3.md`
