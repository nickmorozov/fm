/**
 * Hook for calculating individual item/pet/mount stats with tech tree bonuses applied
 */

import { useMemo } from 'react';
import { useProfile } from '../context/ProfileContext';
import { useTreeMode } from '../context/TreeModeContext';
import { useGameData } from './useGameData';
import { ItemSlot, PetSlot, MountSlot } from '../types/Profile';

interface TechModifiers {
    [key: string]: number;
}

/**
 * Calculate tech tree modifiers based on current tree mode
 */
export function useTreeModifiers() {
    const { profile } = useProfile();
    const { treeMode } = useTreeMode();
    const { data: techTreeLibrary } = useGameData<any>('TechTreeLibrary.json');
    const { data: techTreePositionLibrary } = useGameData<any>('TechTreePositionLibrary.json');
    const { data: guildPositionLibrary } = useGameData<any>('GuildTechTreePositionLibrary.json');
    const { data: guildUpgradeLibrary } = useGameData<any>('GuildTechTreeUpgradeLibrary.json');

    return useMemo((): TechModifiers => {
        if (!techTreeLibrary || !techTreePositionLibrary) return {};

        const modifiers: TechModifiers = {};

        // Get effective tree levels based on mode
        const getTreeLevels = (tree: 'Forge' | 'Power' | 'SkillsPetTech' | 'Clan'): Record<string, number> => {
            if (treeMode === 'empty') return {};

            if (tree === 'Clan') {
                if (!guildPositionLibrary || !guildUpgradeLibrary) return {};
                const nodesList: string[] = [];
                for (const cat of Object.keys(guildPositionLibrary)) {
                    if (guildPositionLibrary[cat]?.Nodes) {
                        nodesList.push(...guildPositionLibrary[cat].Nodes);
                    }
                }
                if (treeMode === 'max') {
                    const maxLevels: Record<string, number> = {};
                    nodesList.forEach((type, idx) => {
                        maxLevels[idx] = guildUpgradeLibrary[type]?.MaxLevel || 20;
                    });
                    return maxLevels;
                }
                return profile.techTree?.Clan || {};
            }

            const treeData = techTreePositionLibrary[tree];
            if (!treeData?.Nodes) return {};

            if (treeMode === 'max') {
                const maxLevels: Record<string, number> = {};
                for (const node of treeData.Nodes) {
                    const nodeData = techTreeLibrary[node.Type];
                    maxLevels[node.Id] = nodeData?.MaxLevel || 5;
                }
                return maxLevels;
            }

            // 'my' mode - use profile
            return profile.techTree[tree] || {};
        };

        const validityCache = new Map<number, boolean>();

        const checkNodeValidity = (
            treeData: any,
            levels: Record<string, number>,
            nodeId: number,
            visited: Set<number> = new Set()
        ): boolean => {
            if (validityCache.has(nodeId)) return validityCache.get(nodeId)!;

            // Prevent cycles
            if (visited.has(nodeId)) return false;

            // Check level > 0
            const level = levels[nodeId];
            if (!level || level <= 0) {
                validityCache.set(nodeId, false);
                return false;
            }

            // Check requirements
            const node = treeData.Nodes.find((n: any) => n.Id === nodeId);
            if (!node) {
                validityCache.set(nodeId, false);
                return false;
            }

            visited.add(nodeId);

            if (node.Requirements && node.Requirements.length > 0) {
                for (const reqId of node.Requirements) {
                    // Recursive validity check
                    if (!checkNodeValidity(treeData, levels, reqId, visited)) {
                        visited.delete(nodeId);
                        validityCache.set(nodeId, false);
                        return false;
                    }
                }
            }

            visited.delete(nodeId);
            validityCache.set(nodeId, true);
            return true;
        };

        const trees: ('Forge' | 'Power' | 'SkillsPetTech' | 'Clan')[] = ['Forge', 'Power', 'SkillsPetTech', 'Clan'];
        for (const tree of trees) {
            const treeLevels = getTreeLevels(tree);

            if (tree === 'Clan') {
                if (!guildPositionLibrary || !guildUpgradeLibrary) continue;

                // Flatten all nodes to index -> type mapping
                const nodesList: string[] = [];
                for (const cat of Object.keys(guildPositionLibrary)) {
                    if (guildPositionLibrary[cat]?.Nodes) {
                        nodesList.push(...guildPositionLibrary[cat].Nodes);
                    }
                }

                for (const [nodeIdStr, level] of Object.entries(treeLevels)) {
                    if (typeof level !== 'number' || level <= 0) continue;
                    const nodeId = parseInt(nodeIdStr);
                    const nodeType = nodesList[nodeId];
                    if (!nodeType) continue;

                    const upgradeDef = guildUpgradeLibrary[nodeType];
                    if (!upgradeDef) continue;

                    // ValuePerLevel is already the effective value (x2 normalised at load, see useGameData)
                    const valPerLevel = upgradeDef.ValuePerLevel || 0;
                    const totalVal = valPerLevel * level;

                    modifiers[nodeType] = (modifiers[nodeType] || 0) + totalVal;
                }
                continue;
            }

            const treeData = techTreePositionLibrary[tree];
            if (!treeData?.Nodes) continue;

            const validNodes = new Set<number>();

            // Pre-calculate validity for all nodes in this tree
            // We can optimize by only checking nodes with level > 0
            validityCache.clear();

            for (const [nodeIdStr, level] of Object.entries(treeLevels)) {
                if (typeof level !== 'number' || level <= 0) continue;
                const nodeId = parseInt(nodeIdStr);

                // Skip validity check for 'max' mode (assume all nodes at max level are valid/accessible)
                // or if it's 'empty' (already handled by treeLevels being empty)
                if (treeMode === 'max' || checkNodeValidity(treeData, treeLevels, nodeId)) {
                    validNodes.add(nodeId);
                }
            }

            for (const nodeId of validNodes) {
                const node = treeData.Nodes.find((n: any) => n.Id === nodeId);
                if (!node) continue;

                const nodeData = techTreeLibrary[node.Type];
                if (!nodeData?.Stats) continue;

                const level = treeLevels[nodeId];
                const tier = node.Tier ?? 0;
                const tierStat = nodeData.StatsByTier?.[tier]?.[0];
                const baseVal = tierStat?.Value ?? nodeData.Stats[0]?.Value ?? 0;
                const increment = tierStat?.ValueIncrease ?? nodeData.Stats[0]?.ValueIncrease ?? 0;
                const totalVal = baseVal + (Math.max(0, level - 1) * increment);

                const key = node.Type;
                modifiers[key] = (modifiers[key] || 0) + totalVal;
            }
        }

        return modifiers;
    }, [profile, treeMode, techTreeLibrary, techTreePositionLibrary, guildPositionLibrary, guildUpgradeLibrary]);
}

/**
 * Max effective value per clan node type (MaxLevel × effective ValuePerLevel).
 * ValuePerLevel is already normalised (x2) at load, so this is the real in-game cap
 * — used to bound the calculator sandbox sliders to the actual tree limits.
 */
export function useClanNodeMax() {
    const { data: guildUpgradeLibrary } = useGameData<any>('GuildTechTreeUpgradeLibrary.json');
    return useMemo((): Record<string, number> => {
        const m: Record<string, number> = {};
        if (guildUpgradeLibrary) {
            for (const [type, def] of Object.entries<any>(guildUpgradeLibrary)) {
                m[type] = (def?.ValuePerLevel || 0) * (def?.MaxLevel || 0);
            }
        }
        return m;
    }, [guildUpgradeLibrary]);
}

/**
 * Clan-tree-only modifiers, keyed by node type. Same values that useTreeModifiers
 * folds into the combined map — exposed separately so UIs (e.g. stat hovers) can
 * show the clan contribution as its own line without changing the merged totals.
 */
export function useClanTreeModifiers() {
    const { profile } = useProfile();
    const { treeMode } = useTreeMode();
    const { data: guildPositionLibrary } = useGameData<any>('GuildTechTreePositionLibrary.json');
    const { data: guildUpgradeLibrary } = useGameData<any>('GuildTechTreeUpgradeLibrary.json');

    return useMemo((): TechModifiers => {
        const modifiers: TechModifiers = {};
        if (treeMode === 'empty' || !guildPositionLibrary || !guildUpgradeLibrary) return modifiers;

        const nodesList: string[] = [];
        for (const cat of Object.keys(guildPositionLibrary)) {
            if (guildPositionLibrary[cat]?.Nodes) nodesList.push(...guildPositionLibrary[cat].Nodes);
        }

        let levels: Record<string, number>;
        if (treeMode === 'max') {
            levels = {};
            nodesList.forEach((type, idx) => { levels[idx] = guildUpgradeLibrary[type]?.MaxLevel || 20; });
        } else {
            levels = profile.techTree?.Clan || {};
        }

        for (const [nodeIdStr, level] of Object.entries(levels)) {
            if (typeof level !== 'number' || level <= 0) continue;
            const nodeType = nodesList[parseInt(nodeIdStr)];
            if (!nodeType) continue;
            const upgradeDef = guildUpgradeLibrary[nodeType];
            if (!upgradeDef) continue;
            // ValuePerLevel already effective (x2 normalised at load, see useGameData)
            modifiers[nodeType] = (modifiers[nodeType] || 0) + (upgradeDef.ValuePerLevel || 0) * level;
        }
        return modifiers;
    }, [profile, treeMode, guildPositionLibrary, guildUpgradeLibrary]);
}

/**
 * Calculate item stats with tech tree bonuses
 * For weapons: includes melee base multiplier (1.6x) in displayed damage
 */
export function useItemStats(item: ItemSlot | null, slot: string) {
    const techModifiers = useTreeModifiers();
    const { data: itemBalancingLibrary } = useGameData<any>('ItemBalancingLibrary.json');
    const { data: itemBalancingConfig } = useGameData<any>('ItemBalancingConfig.json');
    const { data: weaponLibrary } = useGameData<any>('WeaponLibrary.json');
    const { data: itemNameLibrary } = useGameData<any>('ItemNameLibrary.json');

    return useMemo(() => {
        if (!item || !itemBalancingLibrary || !itemBalancingConfig) {
            return { damage: 0, health: 0, bonus: 0, name: '', isMelee: true };
        }

        const levelScaling = itemBalancingConfig.LevelScalingBase || 1.01;
        const meleeBaseMulti = itemBalancingConfig.PlayerMeleeDamageMultiplier || 1.6;

        // Slot to JSON type mapping
        const getJsonType = (s: string) => {
            if (s === 'Body') return 'Armour';
            if (s === 'Shoe') return 'Shoes';
            return s;
        };

        // Slot to tech bonus mapping
        const slotToTechBonus: Record<string, string> = {
            'Weapon': 'WeaponBonus',
            'Helmet': 'HelmetBonus',
            'Body': 'BodyBonus',
            'Gloves': 'GloveBonus',
            'Belt': 'BeltBonus',
            'Necklace': 'NecklaceBonus',
            'Ring': 'RingBonus',
            'Shoe': 'ShoeBonus'
        };

        const jsonType = getJsonType(slot);
        const key = `{'Age': ${item.age}, 'Type': '${jsonType}', 'Idx': ${item.idx}}`;
        const itemData = itemBalancingLibrary[key];

        if (!itemData?.EquipmentStats) {
            return { damage: 0, health: 0, bonus: 0, name: '', isMelee: true };
        }

        // Get item name
        let itemName = '';
        if (itemNameLibrary) {
            const nameKey = `{'Age': ${item.age}, 'Type': '${jsonType}', 'Idx': ${item.idx}}`;
            itemName = itemNameLibrary[nameKey]?.Name || '';
        }

        // Check if weapon is melee (for melee base multiplier)
        // Melee = AttackRange < 1, Ranged = AttackRange >= 1
        let isMelee = false; // Default to false until confirmed
        if (slot === 'Weapon' && weaponLibrary) {
            const weaponKey = `{'Age': ${item.age}, 'Type': 'Weapon', 'Idx': ${item.idx}}`;
            const weaponData = weaponLibrary[weaponKey];
            // Melee if AttackRange < 1
            if (weaponData && (weaponData.AttackRange ?? 0) < 1) {
                isMelee = true;
            }
        }

        let damage = 0;
        let health = 0;
        const bonusKey = slotToTechBonus[slot];
        const bonus = techModifiers[bonusKey] || 0;

        for (const stat of itemData.EquipmentStats) {
            const statType = stat.StatNode?.UniqueStat?.StatType;
            let value = stat.Value || 0;

            // Level scaling
            // Cap level scaling at ItemBaseMaxLevel + 2 (Empirically found to match game at Level 103)
            const maxLevelExp = (itemBalancingConfig.ItemBaseMaxLevel || 98) + 2;
            const levelExp = Math.min(Math.max(0, item.level - 1), maxLevelExp);
            value = value * Math.pow(levelScaling, levelExp);

            // Tech tree bonus
            value = value * (1 + bonus);

            if (statType === 'Damage') damage += value;
            if (statType === 'Health') health += value;
        }

        // Skin bonuses are global (applied in statEngine), so we don't apply them to the individual item display anymore.

        // For weapons: apply melee base multiplier (1.6x) to match in-game display
        if (slot === 'Weapon' && isMelee) {
            damage = damage * meleeBaseMulti;
        }

        return { damage, health, bonus, name: itemName, isMelee };
    }, [item, slot, techModifiers, itemBalancingLibrary, itemBalancingConfig, weaponLibrary, itemNameLibrary]);
}

/**
 * Calculate pet stats with tech tree bonuses
 */
export function usePetStats(pet: PetSlot | null) {
    const techModifiers = useTreeModifiers();
    const { data: petUpgradeLibrary } = useGameData<any>('PetUpgradeLibrary.json');
    const { data: petBalancingLibrary } = useGameData<any>('PetBalancingLibrary.json');
    const { data: petLibrary } = useGameData<any>('PetLibrary.json');
    const { data: ascensionConfigsLibrary } = useGameData<any>('AscensionConfigsLibrary.json');

    return useMemo(() => {
        if (!pet || !petUpgradeLibrary || !petLibrary) {
            return { damage: 0, health: 0, damageBonus: 0, healthBonus: 0 };
        }

        const petKey = `{'Rarity': '${pet.rarity}', 'Id': ${pet.id}}`;
        const petData = petLibrary[petKey];
        const petType = petData?.Type || 'Balanced';
        const typeMulti = petBalancingLibrary?.[petType] || { DamageMultiplier: 1, HealthMultiplier: 1 };

        const upgradeData = petUpgradeLibrary[pet.rarity];
        if (!upgradeData?.LevelInfo) {
            return { damage: 0, health: 0, damageBonus: 0, healthBonus: 0 };
        }

        const levelIdx = Math.max(0, pet.level - 1);
        const levelInfo = upgradeData.LevelInfo.find((l: any) => l.Level === levelIdx) || upgradeData.LevelInfo[0];

        if (!levelInfo?.PetStats?.Stats) {
            return { damage: 0, health: 0, damageBonus: 0, healthBonus: 0 };
        }

        const damageBonus = techModifiers['PetBonusDamage'] || 0;
        const healthBonus = techModifiers['PetBonusHealth'] || 0;

        let damage = 0;
        let health = 0;

        let ascensionDmgMulti = 0;
        let ascensionHpMulti = 0;
        if (pet.ascensionLevel && pet.ascensionLevel > 0 && ascensionConfigsLibrary?.Pets?.AscensionConfigPerLevel) {
            const ascConfigs = ascensionConfigsLibrary.Pets.AscensionConfigPerLevel;
            for (let i = 0; i < pet.ascensionLevel && i < ascConfigs.length; i++) {
                const stats = ascConfigs[i].StatContributions || [];
                for (const s of stats) {
                    const sType = s.StatNode?.UniqueStat?.StatType;
                    const sVal = (s.Value + 1) / 100;
                    if (sType === 'Damage' || sType === 'AscensionDamage') ascensionDmgMulti += sVal;
                    if (sType === 'Health' || sType === 'AscensionHealth') ascensionHpMulti += sVal;
                }
            }
        }

        for (const stat of levelInfo.PetStats.Stats) {
            const statType = stat.StatNode?.UniqueStat?.StatType;
            let value = stat.Value || 0;

            if (statType === 'Damage') {
                value *= typeMulti.DamageMultiplier;
                value *= (1 + damageBonus + ascensionDmgMulti);
                damage += value;
            }
            if (statType === 'Health') {
                value *= typeMulti.HealthMultiplier;
                value *= (1 + healthBonus + ascensionHpMulti);
                health += value;
            }
        }

        return { damage, health, damageBonus, healthBonus };
    }, [pet, techModifiers, petUpgradeLibrary, petBalancingLibrary, petLibrary, ascensionConfigsLibrary]);
}

/**
 * Calculate mount stats with tech tree bonuses
 */
export function useMountStats(mount: MountSlot | null) {
    const techModifiers = useTreeModifiers();
    const { data: mountUpgradeLibrary } = useGameData<any>('MountUpgradeLibrary.json');
    const { data: ascensionConfigsLibrary } = useGameData<any>('AscensionConfigsLibrary.json');

    return useMemo(() => {
        if (!mount || !mountUpgradeLibrary) {
            return { damageMulti: 0, healthMulti: 0, damageBonus: 0, healthBonus: 0 };
        }

        const upgradeData = mountUpgradeLibrary[mount.rarity];
        if (!upgradeData?.LevelInfo) {
            return { damageMulti: 0, healthMulti: 0, damageBonus: 0, healthBonus: 0 };
        }

        const levelIdx = Math.max(0, mount.level - 1);
        const levelInfo = upgradeData.LevelInfo.find((l: any) => l.Level === levelIdx) || upgradeData.LevelInfo[0];

        let damageMulti = 0;
        let healthMulti = 0;

        if (levelInfo?.MountStats?.Stats) {
            for (const stat of levelInfo.MountStats.Stats) {
                const statType = stat.StatNode?.UniqueStat?.StatType;
                const value = stat.Value || 0;
                if (statType === 'Damage') damageMulti += value;
                if (statType === 'Health') healthMulti += value;
            }
        }

        let ascensionDmgMulti = 0;
        let ascensionHpMulti = 0;
        if (mount.ascensionLevel && mount.ascensionLevel > 0 && ascensionConfigsLibrary?.Mounts?.AscensionConfigPerLevel) {
            const ascConfigs = ascensionConfigsLibrary.Mounts.AscensionConfigPerLevel;
            for (let i = 0; i < mount.ascensionLevel && i < ascConfigs.length; i++) {
                const stats = ascConfigs[i].StatContributions || [];
                for (const s of stats) {
                    const sType = s.StatNode?.UniqueStat?.StatType;
                    const sVal = (s.Value + 1) / 100;
                    if (sType === 'Damage' || sType === 'AscensionDamage') ascensionDmgMulti += sVal;
                    if (sType === 'Health' || sType === 'AscensionHealth') ascensionHpMulti += sVal;
                }
            }
        }

        // Apply tech tree bonuses multiplicatively
        const damageBonus = techModifiers['MountDamage'] || 0;
        const healthBonus = techModifiers['MountHealth'] || 0;

        damageMulti *= (1 + damageBonus + ascensionDmgMulti);
        healthMulti *= (1 + healthBonus + ascensionHpMulti);

        return { damageMulti, healthMulti, damageBonus, healthBonus };
    }, [mount, techModifiers, mountUpgradeLibrary, ascensionConfigsLibrary]);
}
