---
title: Magic item economy
summary: What the item maker's budget and bill are, what soul gems and repairs cost, and when enchanting pays.
stage: gear
order: 26
gate: none
tags: [enchanting, magic items, soul gems, repair, identify, economy]
status: draft
verified: e4f093166
---

> [!tip] At a glance
> - An item's enchantment budget is `base power + floor(base power × material multiplier)`; the maker's points and its gold bill are two different sums.
> - **Side effects are free in gold** and their negative cost buys budget, so a drawback makes an item stronger at the same price rather than cheaper.
> - The maker refuses Aetheric and Gilded pieces, and refuses an already-enchanted item except crafted jewellery that carries its own points.
> - Soul Trap fills **Azura's Star first**, then an ordinary soul trap; binding a soul spends it (the Star is reused, a gem is consumed).
> - Repairs cost a third of Daggerfall's price; Identify is `(25 × value) >> 8` and is free during the Witches Festival.

## The maker's two sums

The item maker at a guild or temple hall spends an item's enchantment points and charges gold. The two arithmetic walks are different and easy to confuse.

| Sum | What it adds | Forced enchantments | Scale |
|---|---|---|---|
| **Points** (capacity used) | Powers and side effects | Excluded | Raw points |
| **Gold** (the bill) | Powers only | Included | Points × **10** |

A **side effect** has a negative enchantment cost, so adding it lowers the points used and therefore frees capacity. It contributes nothing to the gold bill, so the freed capacity costs nothing. A **forced enchantment** — one that a chosen effect drags in, marked by a non-zero parent — is the opposite: it costs gold but no points. That is why drawbacks are worth taking deliberately and forced effects deserve a look before you pay.

## Capacity from the item

`capacity = base power + floor(base power × material multiplier)`; the base power comes from the item's template. The multiplier is negative for iron and rises with the metal:

| Material | Weapons | Armour |
|---|---:|---:|
| Iron | −0.25 | −0.25 |
| Steel | 0 | 0 |
| Leather / chain | — | 0 |
| Silver | +0.75 | +0.75 |
| Elven | +0.25 | +0.25 |
| Dwarven | +0.50 | +0.50 |
| Mithril | +0.25 | +0.25 |
| Adamantium | +0.75 | +0.75 |
| Ebony | +1.00 | +1.00 |
| Orcish | +1.50 | +1.50 |
| Daedric | +2.00 | +2.00 |

Unknown materials fall through to the steel/leather base, so an item with no recognised metal still gets its template's base points. Jewellery generally takes its template's base untouched; a crafted piece of jewellery can also carry its recipe's own points.

## The catalogue: 15 powers and 9 drawbacks

| Powers | Drawbacks |
|---|---|
| Absorbs Spells; Cast When Held; Cast When Strikes; Cast When Used; Enhances Skill; Extra Spell Pts; Feather Weight; Good Rep With; Improves Talents; Increased Weight Allowance; Potent Vs; Regens Health; Repairs Objects; Strengthens Armor; Vampiric Effect | Bad Reactions From; Bad Rep With; Extra Weight; Health Leech; Item Deteriorates; Low Damage Vs; Soul Bound; User Takes Damage; Weakens Armor |

Some entries key a setting. **Feather Weight** costs 100 points. **Extra Spell Pts** costs 500 during Winter (200 in some moon conditions; 700–1,000 near a foe group). **Item Deteriorates** is −3,000 all the time, −1,500 in sunlight or −500 in holy places. **Soul Bound** has a long per-soul cost row, because the bound soul's identity decides it.

> [!example] Worked capacity and bill
> Feather Weight (100) plus Extra Spell Pts during Winter (500) uses 600 points and costs 6,000 gold. Adding Item Deteriorates in holy places (−500) leaves 100 points used and the bill at 6,000 gold. You accept the item wearing out in temples.

## Gates, refusals and the online discount

The guild service table opens **Make Magic Items** at Mages Guild rank 5; the maker is a guild or temple service, not a station. The purchase ladder checks the item first, then that something has been prepared, then the **gold** — so a player who can afford neither hears about gold — then the item's limit.

- **At most ten enchantments** by the picker guard, and the application truncates in a way that can keep eleven rows; do not plan on eleven.
- **Aetheric and Gilded pieces are refused** by the port (they carry no ordinary DFU enchantment).
- **An already-enchanted item is refused** except a crafted piece of jewellery, whose existing enchantments occupy its own points and cannot be removed.
- **Online**, Enchanting's rank discount is 10% at Journeyman and 20% at Master, and the Efficient specialisation adds five percentage points; the final charge rounds up. The discount is on the gold, not on points.

## Soul gems and Azura's Star

Soul Trap is a Mysticism effect with chance components 40–68 and duration 60–68. The trap effect attaches to the target; when it dies, a re-roll decides capture, and the soul goes to the caster who trapped it, not to whoever lands the killing blow. You need a carried trap.

Filling prefers **Azura's Star**, the reusable artifact amulet, before any ordinary soul trap; with `azurasStarOnly` it is the only candidate. Binding a soul to an item spends it: the first ordinary trap holding that soul is removed, and only if none matches is the Star emptied and kept. A filled trap's name shows the soul in brackets. The maker's Soul Bound drawbacks are the binding destination's costs; the trapped soul's identity also decides any forced powers.

Soul value is a property of the monster's row (`soulPts`), so a Giant's soul is worth far more than a Rat's — but the binding cost, not the soul's point value, is the item-maker side effect you accept.

## Repairs and Identify

**Repair** is free at full condition. Daggerfall's formula charges ten percent of the item's base value, through the shop's quality and regional adjustment and any guild discount. Online, Roleplay & Realism's condition-based pricing replaces that tenth with a share of the missing condition (0.6, or 0.9 under Instant Repairs), and the port then applies **× 1/3** everywhere, floored at 1 gold. The price does not otherwise rise with how damaged the item is; only the time does: 1,000 condition points per game day, floored at one full day. Magic items need the Allow Magic Repairs setting, which is forced on online.

**Identify**: an unenchanted item is always identified; only enchanted items carry the flag. Shop Identify costs `(25 × base value) >> 8`, free during the Witches Festival, with guild discounts after the shift. The Identify spell rolls per item against its own chance and charges magicka once, so the service is for gold and the spell is for a caster with the school.

> [!warning] The maker is not a repair shop
> Repair, Identify, Reforge and Temper are separate services with their own rules. The item maker's points cannot be spent on repairs, and a reforge does not refund enchantment capacity.

## When it is worth it

- **A high-material item.** Daedric, orcish, ebony and adamantium pieces multiply their base points; an iron piece loses a quarter before you start. Enchant the best legal item, not the cheapest one.
- **Cheap powers first.** Feather Weight, Increased Weight Allowance and Enhances Skill are affordable capacity; a bound-soul power is a late purchase.
- **Drawbacks you will not feel.** Item Deteriorates in holy places costs 500 points of capacity for a condition you can plan around; a drawback that fires in every fight is a different bargain.
- **Permanent gear over disposable gear.** The bill is per item; a piece you will replace next level is a poor buy.
- **Repair before replace.** A third of Daggerfall's repair price is usually less than a new piece, and magic items are repairable online.
- **Identify before selling.** An unidentified enchanted item's value is not the shop's offer until you know what it is.
- **Azura's Star.** If you have it, ordinary soul traps are a backup; if you do not, budget gems as a consumable.

The points-and-gold guide is [Enchanting, spellmaking and potions](enchanting-spellmaking-potions.md); the spell side is [Spellmaking maths](spellmaking-math.md).

## Common mistakes

- **Treating a drawback as a discount on the bill.** It buys points, not gold.
- **Buying the discount first.** The maker checks gold before the item's power limit.
- **Enchanting an Aetheric or Gilded piece.** Both are refused.
- **Expecting a bound soul to be free.** It costs points and the binding consumes the trap.
- **Repairing to save a cheap item.** The floor is 1 gold, but the trip and time are real costs.

## Next

- [Spellmaking maths](spellmaking-math.md)
- [Salvage and repair](salvage-and-repair.md)

## Sources

- `src/systems/enchanting.js`: `itemEnchantmentPower`, `WEAPON_ENCHANTMENT_MULTIPLIER`, `ARMOR_ENCHANTMENT_MULTIPLIER`, `totalEnchantmentCost`, `totalGoldCost`, `GOLD_PER_ENCHANTMENT_POINT`, `MAX_ENCHANTMENTS`, `enchantDecision`, `itemMakerRefuses`, `keptEnchantments`
- `src/systems/enchantmentCatalogue.js`: `ENCHANTMENT_TYPES` costs (FeatherWeight 100, ExtraSpellPts 500/200/700–1,000, ItemDeteriorates −3,000/−1,500/−500, SoulBound row), exclusions and picker rules
- `src/systems/spell/spellMaker.js`: spell-maker purchase ladder (for contrast); `src/net/alchemyLaw.js`: `enchantGold` discount
- `src/systems/guild/guildServices.js`: `MakeMagicItems` rank gate; `guildVariants.js`: temple service data
- `src/systems/mysticism.js`: `attemptSoulTrap`, `fillEmptyTrap`, `enumerateFilledTraps`, `removeFilledTrap`, `SOUL_TRAP_TEMPLATE`, `SOUL_BOUND_MONSTER_ID_COUNT`
- `src/systems/artifactEffects.js`: Azura's Star artifact check
- `src/systems/repairService.js`: `calculateItemRepairCost`, `REPAIR_COST_SCALE`, `calculateItemRepairTime`; `src/systems/tradeModes.js`: `calculateItemIdentifyCost`, `IDENTIFY_COST_MULTIPLIER`, `itemIsIdentified`
- `src/characters/enemy/enemyBasics.js`: `soulPts` per row
- Overview: `handbook/content/gear/enchanting-spellmaking-potions.md`; research note `handbook/research/P3.md`
