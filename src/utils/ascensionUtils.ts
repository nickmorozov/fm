export function getAscensionTexturePath(baseTexture: 'Pets' | 'MountIcons' | 'SkillIcons' | 'Eggs' | 'Icons', ascensionLevel: number, version?: string): string {
    const baseUrl = import.meta.env.BASE_URL;
    const versionPath = version ? `${version}/` : '';
    const textureBase = `${baseUrl}Texture2D/${versionPath}`;
    
    // Icons sheet doesn't have ascended versions, always return standard
    if (baseTexture === 'Icons') return `${textureBase}Icons.png`;

    if (ascensionLevel === 1) return `${textureBase}Mega${baseTexture}.png`;
    if (ascensionLevel === 2) return `${textureBase}Ultra${baseTexture}.png`;
    if (ascensionLevel === 3) return `${textureBase}Apex${baseTexture}.png`;
    
    return `${textureBase}${baseTexture}.png`;
}

export function getAnvilTexturePath(ascensionLevel: number, version?: string): string {
    const baseUrl = import.meta.env.BASE_URL;
    const versionPath = version ? `${version}/` : '';
    const textureBase = `${baseUrl}Texture2D/${versionPath}`;

    if (ascensionLevel === 1) return `${textureBase}Anvil _.png`;
    if (ascensionLevel === 2) return `${textureBase}Anvil __.png`;
    if (ascensionLevel === 3) return `${textureBase}Anvil ___.png`;
    
    return `${textureBase}Anvil.png`;
}

interface NormalizedTarget {
    $type?: string;
    ItemType?: number;
    DungeonType?: number;
    CurrencyType?: number;
}

export function getNormalizedTarget(statNode: any): NormalizedTarget {
    if (!statNode) return {};

    if (statNode.StatTarget) {
        return {
            $type: statNode.StatTarget.$type,
            ItemType: statNode.StatTarget.ItemType,
            DungeonType: statNode.StatTarget.DungeonType,
            CurrencyType: statNode.StatTarget.CurrencyType,
        };
    }

    if (statNode.Target) {
        const kind = statNode.Target.Kind;
        const qualifiers = statNode.Target.Qualifiers || [];
        const condition = statNode.Condition || "None";

        const getQualifierValue = (typeStr: string): any => {
            const q = qualifiers.find((x: any) => x.Type === typeStr);
            return q ? q.Value : undefined;
        };

        const itemTypeVal = getQualifierValue("ItemType");
        const dungeonTypeVal = getQualifierValue("DungeonType");
        const currencyTypeVal = getQualifierValue("CurrencyType");

        let type: string | undefined;

        switch (kind) {
            case "Player":
                if (condition === "Melee") {
                    type = "PlayerMeleeOnlyStatTarget";
                } else if (condition === "Ranged") {
                    type = "PlayerRangedOnlyStatTarget";
                } else {
                    type = "PlayerStatTarget";
                }
                break;
            case "Equipment":
                if (itemTypeVal === 5) {
                    type = "WeaponStatTarget";
                } else {
                    type = "EquipmentStatTarget";
                }
                break;
            case "Forge":
                type = "ForgeStatTarget";
                break;
            case "ActiveSkill":
            case "SkillActive":
                type = "ActiveSkillStatTarget";
                break;
            case "PassiveSkill":
            case "SkillPassive":
                type = "PassiveSkillStatTarget";
                break;
            case "Pet":
                type = "PetStatTarget";
                break;
            case "Mount":
                type = "MountStatTarget";
                break;
            case "Egg":
                type = "EggStatTarget";
                break;
            case "Currency":
                type = "OfflineCurrencyStatTarget";
                break;
            case "Timer":
                type = "OfflineTimerStatTarget";
                break;
            case "Dungeon":
                type = "DungeonStatTarget";
                break;
        }

        return {
            $type: type,
            ItemType: itemTypeVal,
            DungeonType: dungeonTypeVal,
            CurrencyType: currencyTypeVal,
        };
    }

    if (statNode.LegacyTarget) {
        return {
            $type: statNode.LegacyTarget.$type,
            ItemType: statNode.LegacyTarget.ItemType,
            DungeonType: statNode.LegacyTarget.DungeonType,
            CurrencyType: statNode.LegacyTarget.CurrencyType,
        };
    }

    return {};
}
