import { useMemo } from 'react';
import { Card } from '../components/UI/Card';
import { useProfile } from '../context/ProfileContext';
import { useGameData } from '../hooks/useGameData';
import { useGameDataContext } from '../context/GameDataContext';
import { getItemImage, getItemName } from '../utils/itemAssets';
import { getStatName } from '../utils/statNames';
import { getPerfection } from '../utils/itemCalculations';
import { AGES } from '../utils/constants';
import { cn, getAgeBgStyle } from '../lib/utils';
import { ItemSlot, MountSlot, PetSlot } from '../types/Profile';
import { Package, Cat, Shield, Trash2, Copy } from 'lucide-react';

const IMAGE_SLOT_MAP: Record<string, string> = {
    'Weapon': 'Weapon',
    'Helmet': 'Headgear',
    'Body': 'Armor',
    'Gloves': 'Glove',
    'Belt': 'Belt',
    'Necklace': 'Neck',
    'Ring': 'Ring',
    'Shoe': 'Foot',
};

const SLOT_ORDER = ['Weapon', 'Helmet', 'Body', 'Gloves', 'Belt', 'Necklace', 'Ring', 'Shoe'];

const RARITY_TEXT: Record<string, string> = {
    common: 'text-rarity-common',
    rare: 'text-rarity-rare',
    epic: 'text-rarity-epic',
    legendary: 'text-rarity-legendary',
    ultimate: 'text-rarity-ultimate',
    mythic: 'text-rarity-mythic',
};

/**
 * Inventory — every saved build in one place: item presets per slot, saved pet builds, and saved
 * mount builds. Read-mostly; each entry can be cloned or deleted, editing stays in the selectors.
 */
export default function Inventory() {
    const { profile, updateNestedProfile } = useProfile();
    const { selectedVersion } = useGameDataContext();
    const { data: autoMapping } = useGameData<any>('AutoItemMapping.json');
    const { data: secondaryStatLibrary } = useGameData<any>('SecondaryStatLibrary.json');

    const savedSlots = useMemo(
        () => SLOT_ORDER.filter(slot => (profile.savedItems?.[slot] || []).length > 0),
        [profile.savedItems],
    );

    const savedPets = profile.pets?.savedBuilds || [];
    const savedMounts = profile.mount?.savedBuilds || [];
    const totalItems = savedSlots.reduce((n, slot) => n + (profile.savedItems?.[slot] || []).length, 0);
    const isEmpty = totalItems === 0 && savedPets.length === 0 && savedMounts.length === 0;

    const cloneItem = (slot: string, index: number) => {
        const list = profile.savedItems?.[slot] || [];
        const src = list[index];
        if (!src) return;
        const copy = JSON.parse(JSON.stringify(src));
        if (copy.customName) copy.customName = `${copy.customName} (copy)`;
        updateNestedProfile('savedItems', { [slot]: [...list.slice(0, index + 1), copy, ...list.slice(index + 1)] });
    };

    const deleteItem = (slot: string, index: number) => {
        const list = profile.savedItems?.[slot] || [];
        updateNestedProfile('savedItems', { [slot]: list.filter((_, i) => i !== index) });
    };

    const cloneBuild = (kind: 'pets' | 'mount', index: number) => {
        const list = kind === 'pets' ? savedPets : savedMounts;
        const src = list[index];
        if (!src) return;
        const copy = JSON.parse(JSON.stringify(src));
        if (copy.customName) copy.customName = `${copy.customName} (copy)`;
        const next = [...list.slice(0, index + 1), copy, ...list.slice(index + 1)];
        if (kind === 'pets') updateNestedProfile('pets', { savedBuilds: next as PetSlot[] });
        else updateNestedProfile('mount', { savedBuilds: next as MountSlot[] });
    };

    const deleteBuild = (kind: 'pets' | 'mount', index: number) => {
        const list = kind === 'pets' ? savedPets : savedMounts;
        const next = list.filter((_, i) => i !== index);
        if (kind === 'pets') updateNestedProfile('pets', { savedBuilds: next as PetSlot[] });
        else updateNestedProfile('mount', { savedBuilds: next as MountSlot[] });
    };

    const renderActions = (onClone: () => void, onDelete: () => void) => (
        <div className="absolute top-1.5 right-1.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
                onClick={onClone}
                className="p-1.5 rounded-md bg-bg-input hover:bg-accent-primary hover:text-white text-text-muted shadow-sm transition-colors"
                title="Clone"
            >
                <Copy className="w-3.5 h-3.5" />
            </button>
            <button
                onClick={onDelete}
                className="p-1.5 rounded-md bg-red-500 hover:bg-red-600 text-white shadow-sm transition-colors"
                title="Delete"
            >
                <Trash2 className="w-3.5 h-3.5" />
            </button>
        </div>
    );

    const renderItemCard = (slot: string, item: ItemSlot & { customName?: string }, index: number) => {
        const fileSlot = IMAGE_SLOT_MAP[slot] || slot;
        const img = getItemImage(AGES[item.age], fileSlot, item.idx, autoMapping, selectedVersion) || '';
        const name = item.customName || getItemName(AGES[item.age], fileSlot, item.idx, autoMapping) || `Item #${item.idx}`;
        const perfection = getPerfection(item, secondaryStatLibrary);

        return (
            <div
                key={`${slot}_${index}`}
                className="relative group rounded-xl border border-border bg-bg-secondary/50 p-3 flex gap-3 items-start hover:border-accent-primary/40 transition-colors"
            >
                {renderActions(() => cloneItem(slot, index), () => deleteItem(slot, index))}
                <div className="w-12 h-12 shrink-0 rounded-lg flex items-center justify-center" style={getAgeBgStyle(item.age)}>
                    {img
                        ? <img src={img} alt={name} className="w-10 h-10 object-contain" />
                        : <Shield className="w-6 h-6 text-text-muted" />}
                </div>
                <div className="min-w-0 flex-1">
                    <div className="text-sm font-bold truncate">{name}</div>
                    <div className="text-xs text-text-muted">
                        {AGES[item.age]} · Lv {item.level}
                        {typeof perfection === 'number' && ` · ${perfection.toFixed(0)}%`}
                    </div>
                    {(item.secondaryStats?.length || 0) > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                            {item.secondaryStats!.map((s, i) => (
                                <span key={i} className="text-[0.625rem] font-bold px-1.5 py-0.5 rounded bg-accent-primary/10 text-accent-primary border border-accent-primary/20">
                                    {getStatName(s.statId)} {s.value}%
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const renderBuildCard = (kind: 'pets' | 'mount', build: PetSlot | MountSlot, index: number) => {
        const name = build.customName || `${kind === 'pets' ? 'Pet' : 'Mount'} #${build.id}`;
        const rarityClass = RARITY_TEXT[build.rarity?.toLowerCase?.() || ''] || 'text-text-secondary';
        return (
            <div
                key={`${kind}_${index}`}
                className="relative group rounded-xl border border-border bg-bg-secondary/50 p-3 hover:border-accent-primary/40 transition-colors"
            >
                {renderActions(() => cloneBuild(kind, index), () => deleteBuild(kind, index))}
                <div className="text-sm font-bold truncate pr-14">{name}</div>
                <div className="text-xs text-text-muted">
                    <span className={cn('font-bold', rarityClass)}>{build.rarity}</span>
                    {' · '}Lv {build.level} · Evo {build.evolution}
                    {typeof build.ascensionLevel === 'number' && build.ascensionLevel > 0 && ` · Asc ${build.ascensionLevel}`}
                </div>
                {(build.secondaryStats?.length || 0) > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                        {build.secondaryStats!.map((s, i) => (
                            <span key={i} className="text-[0.625rem] font-bold px-1.5 py-0.5 rounded bg-accent-primary/10 text-accent-primary border border-accent-primary/20">
                                {getStatName(s.statId)} {s.value}%
                            </span>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="w-full space-y-6 animate-fade-in pb-12">
            <div className="flex items-center gap-3 border-b border-border pb-4">
                <Package className="w-7 h-7 text-accent-primary" />
                <div>
                    <h1 className="text-2xl font-bold">Inventory</h1>
                    <p className="text-sm text-text-muted">Every saved item preset, pet build and mount build on this profile.</p>
                </div>
            </div>

            {isEmpty && (
                <Card className="p-8 text-center text-text-muted">
                    Nothing saved yet. Use the bookmark button on an equipped item, pet or mount to build your inventory.
                </Card>
            )}

            {savedSlots.map(slot => (
                <Card key={slot} className="p-4">
                    <h2 className="text-sm font-black uppercase tracking-wider text-text-muted mb-3">
                        {slot} <span className="text-text-muted/60">({(profile.savedItems?.[slot] || []).length})</span>
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                        {(profile.savedItems?.[slot] || []).map((item, i) => renderItemCard(slot, item, i))}
                    </div>
                </Card>
            ))}

            {savedPets.length > 0 && (
                <Card className="p-4">
                    <h2 className="text-sm font-black uppercase tracking-wider text-text-muted mb-3 flex items-center gap-2">
                        <Cat className="w-4 h-4" /> Pets <span className="text-text-muted/60">({savedPets.length})</span>
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                        {savedPets.map((b, i) => renderBuildCard('pets', b, i))}
                    </div>
                </Card>
            )}

            {savedMounts.length > 0 && (
                <Card className="p-4">
                    <h2 className="text-sm font-black uppercase tracking-wider text-text-muted mb-3">
                        Mounts <span className="text-text-muted/60">({savedMounts.length})</span>
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                        {savedMounts.map((b, i) => renderBuildCard('mount', b, i))}
                    </div>
                </Card>
            )}
        </div>
    );
}
