import { useMemo } from 'react';
import { useProfile } from '../context/ProfileContext';
import { useGameData } from './useGameData';
import { calculateStats, StatMap } from '../utils/statEngine';

export function useProfileStats() {
    const { profile } = useProfile();

    const { data: itemBalancing } = useGameData<any>('ItemBalancingLibrary.json');
    const { data: secondaryStats } = useGameData<any>('SecondaryStatLibrary.json');
    const { data: techTree } = useGameData<any>('TechTreeLibrary.json');
    const { data: petLibrary } = useGameData<any>('PetLibrary.json');
    const { data: guildPositionLibrary } = useGameData<any>('GuildTechTreePositionLibrary.json');
    const { data: guildUpgradeLibrary } = useGameData<any>('GuildTechTreeUpgradeLibrary.json');

    const stats: StatMap = useMemo(() => {
        if (!itemBalancing || !techTree) return {}; // Wait for critical libs

        return calculateStats(profile, {
            itemBalancingLibrary: itemBalancing,
            secondaryStatLibrary: secondaryStats,
            techTreeLibrary: techTree,
            petLibrary,
            guildTechTreePositionLibrary: guildPositionLibrary || undefined,
            guildTechTreeUpgradeLibrary: guildUpgradeLibrary || undefined
        });
    }, [profile, itemBalancing, secondaryStats, techTree, petLibrary, guildPositionLibrary, guildUpgradeLibrary]);

    return stats;
}
