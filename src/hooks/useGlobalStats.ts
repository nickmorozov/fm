import { useMemo } from 'react';
import { useProfile } from '../context/ProfileContext';
import { useGameData } from './useGameData';
import { calculateStats, LibraryData, AggregatedStats } from '../utils/statEngine';
import { useTreeMode } from '../context/TreeModeContext';
import { UserProfile } from '../types/Profile';

export function useGlobalStats(excludeSubstats = false): AggregatedStats | null {
    const { profile } = useProfile();
    const { treeMode } = useTreeMode();

    // Load all required game data
    // We use deduplicated caching so this shouldn't fire multiple network requests if already loaded
    const { data: petUpgradeLibrary } = useGameData<any>('PetUpgradeLibrary.json');
    const { data: petBalancingLibrary } = useGameData<any>('PetBalancingLibrary.json');
    const { data: petLibrary } = useGameData<any>('PetLibrary.json');

    const { data: skillLibrary } = useGameData<any>('SkillLibrary.json');
    const { data: skillPassiveLibrary } = useGameData<any>('SkillPassiveLibrary.json');

    const { data: mountUpgradeLibrary } = useGameData<any>('MountUpgradeLibrary.json');

    const { data: techTreeLibrary } = useGameData<any>('TechTreeLibrary.json');
    const { data: techTreePositionLibrary } = useGameData<any>('TechTreePositionLibrary.json');
    const { data: guildPositionLibrary } = useGameData<any>('GuildTechTreePositionLibrary.json');
    const { data: guildUpgradeLibrary } = useGameData<any>('GuildTechTreeUpgradeLibrary.json');

    const { data: itemBalancingLibrary } = useGameData<any>('ItemBalancingLibrary.json');
    const { data: itemBalancingConfig } = useGameData<any>('ItemBalancingConfig.json');

    const { data: weaponLibrary } = useGameData<any>('WeaponLibrary.json');
    const { data: projectilesLibrary } = useGameData<any>('ProjectilesLibrary.json');
    const { data: secondaryStatLibrary } = useGameData<any>('SecondaryStatLibrary.json');
    const { data: skinsLibrary } = useGameData<any>('SkinsLibrary.json');
    const { data: setsLibrary } = useGameData<any>('SetsLibrary.json');
    const { data: ascensionConfigsLibrary } = useGameData<any>('AscensionConfigsLibrary.json');

    // Combine into LibraryData object
    const libs: LibraryData = useMemo(() => ({
        petUpgradeLibrary,
        petBalancingLibrary,
        petLibrary,
        skillLibrary,
        skillPassiveLibrary,
        mountUpgradeLibrary,
        techTreeLibrary,
        techTreePositionLibrary,
        guildTechTreePositionLibrary: guildPositionLibrary,
        guildTechTreeUpgradeLibrary: guildUpgradeLibrary,
        itemBalancingLibrary,
        itemBalancingConfig,
        weaponLibrary,
        projectilesLibrary,
        secondaryStatLibrary,
        skinsLibrary,
        setsLibrary,
        ascensionConfigsLibrary,
    }), [
        petUpgradeLibrary, petBalancingLibrary, petLibrary,
        skillLibrary, skillPassiveLibrary, mountUpgradeLibrary,
        techTreeLibrary, techTreePositionLibrary,
        guildPositionLibrary, guildUpgradeLibrary,
        itemBalancingLibrary, itemBalancingConfig,
        weaponLibrary, projectilesLibrary, secondaryStatLibrary,
        skinsLibrary, setsLibrary, ascensionConfigsLibrary,
    ]);

    // Build effective profile based on tree mode
    const effectiveProfile = useMemo((): UserProfile => {
        if (treeMode === 'my') {
            return profile;
        }

        if (treeMode === 'empty') {
            // Empty tree: all nodes at 0
            return {
                ...profile,
                techTree: {
                    Forge: {},
                    Power: {},
                    SkillsPetTech: {},
                    Clan: {}
                }
            };
        }

        // Max tree: all nodes at max level
        // We need to build max levels from techTreePositionLibrary
        const maxTree: UserProfile['techTree'] = {
            Forge: {},
            Power: {},
            SkillsPetTech: {},
            Clan: {}
        };

        if (techTreePositionLibrary && techTreeLibrary) {
            const trees: ('Forge' | 'Power' | 'SkillsPetTech')[] = ['Forge', 'Power', 'SkillsPetTech'];
            for (const tree of trees) {
                const treeData = techTreePositionLibrary[tree];
                if (treeData?.Nodes) {
                    for (const node of treeData.Nodes) {
                        const nodeData = techTreeLibrary[node.Type];
                        const maxLevel = nodeData?.MaxLevel || 5;
                        maxTree[tree][node.Id] = maxLevel;
                    }
                }
            }
        }

        if (guildPositionLibrary && guildUpgradeLibrary) {
            const nodesList: string[] = [];
            for (const cat of Object.keys(guildPositionLibrary)) {
                if (guildPositionLibrary[cat]?.Nodes) {
                    nodesList.push(...guildPositionLibrary[cat].Nodes);
                }
            }
            nodesList.forEach((type, idx) => {
                maxTree.Clan[idx] = guildUpgradeLibrary[type]?.MaxLevel || 20;
            });
        }

        return {
            ...profile,
            techTree: maxTree
        };
    }, [profile, treeMode, techTreePositionLibrary, techTreeLibrary, guildPositionLibrary, guildUpgradeLibrary]);

    // Calculate stats
    // We memoize the result to avoid recalculating on every render if inputs haven't changed
    const stats = useMemo(() => {
        // Validation: Ensure critical libraries are loaded
        if (!itemBalancingConfig || !itemBalancingLibrary) {
            return null;
        }
        // Attribution is enabled here only: this hook runs per render, not in a loop.
        // The optimizer/sweep hot paths deliberately leave it off.
        return calculateStats(effectiveProfile, libs, excludeSubstats, { attribution: true });
    }, [effectiveProfile, libs, itemBalancingConfig, itemBalancingLibrary, excludeSubstats]);

    return stats;
}
