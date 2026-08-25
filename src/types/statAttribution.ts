/**
 * Stat Attribution
 * Per-source contribution records produced by StatEngine when attribution tracking is enabled.
 *
 * Pure types + a small pure helper: this module must stay free of engine imports so the UI
 * can consume attribution without pulling in the calculation code.
 */

import { ItemSlot, PetSlot, MountSlot, UserProfile } from './Profile';

export type SourceKind = 'item' | 'pet' | 'mount' | 'tech' | 'ascension' | 'skin' | 'set' | 'skill' | 'base';

export type ItemSlotKey = keyof UserProfile['items'];

/**
 * Identifies an entity that can be rendered as a card (it has an icon).
 * Holds a live reference into the profile - never deep-cloned.
 */
export type SourceRef =
    | { kind: 'item'; slot: ItemSlotKey; item: ItemSlot }
    | { kind: 'pet'; index: number; pet: PetSlot }
    | { kind: 'mount'; mount: MountSlot };

export interface StatContribution {
    kind: SourceKind;
    /** Stable React key, e.g. 'item:Weapon' | 'pet:2' | 'tech:Power:14' | 'set:Viking:4' */
    id: string;
    /** Display label for text-line sources, e.g. 'Power Tree - Crit Boost (L12)' */
    label: string;
    /** ENGINE UNITS: exactly the number the engine consumed. Never re-derived. */
    value: number;
    /** 'add' contributions sum; 'mul' contributions are multiplier layers rendered as xN */
    op: 'add' | 'mul';
    /** Present => render as a card. Absent => render as a text line. */
    ref?: SourceRef;
    /** Optional secondary line (e.g. 'Level 12', 'Forge Tree') */
    detail?: string;
}

export interface StatAttribution {
    byStat: Record<string, StatContribution[]>;
    /** Human-readable formula per synthetic key, e.g. '__TotalDamage' */
    formula?: Record<string, string>;
}

/** Synthetic keys for the non-additive totals (contribution view rather than sum view). */
export const TOTAL_DAMAGE_KEY = '__TotalDamage';
export const TOTAL_HEALTH_KEY = '__TotalHealth';
export const TOTAL_POWER_KEY = '__TotalPower';

export function isTotalKey(statKey: string): boolean {
    return statKey.startsWith('__');
}

/**
 * Fold stat id aliases onto the canonical PascalCase vocabulary used by statNames.ts.
 * Applied at write time so the UI only ever looks up one key per stat.
 */
const STAT_KEY_ALIASES: Record<string, string> = {
    CriticalDamage: 'CriticalMulti',
    TimerSpeed: 'SkillCooldownMulti',
};

export function canonicalStatKey(statId: string): string {
    return STAT_KEY_ALIASES[statId] || statId;
}
