import React from 'react';
import { cn } from '../../lib/utils';

export interface StatBreakdown {
    base: number;
    levelMulti?: number;
    techMulti?: number;
    clanTechMulti?: number; // clan-tree portion already included in techMulti (shown for transparency)
    itemMulti?: number;
    ascMulti?: number;
    commonMulti?: number;
    skillMulti?: number;
    total?: number;
    skinMulti?: number;
    meleeMulti?: number;
}

interface StatBreakdownTooltipProps {
    damage?: StatBreakdown;
    health?: StatBreakdown;
    isMelee?: boolean;
}

const formatPercent = (val: number) => `+${(val * 100).toFixed(1)}%`;
const formatMulti = (val: number) => `×${val.toFixed(2)}`;

function BreakdownSection({ data, label, color }: { data: StatBreakdown; label: string; color: string }) {
    const hasSkillLayer = (data.techMulti && data.techMulti > 0) || (data.itemMulti && data.itemMulti > 0) || (data.ascMulti && data.ascMulti > 1) || (data.clanTechMulti && data.clanTechMulti > 0);
    const hasCommon = data.commonMulti && data.commonMulti !== 1;

    return (
        <div>
            <div className={cn("text-[10px] font-black uppercase tracking-tighter mb-1 border-b pb-0.5", `text-${color}-400 border-${color}-400/20`)}>{label} Breakdown</div>
            <div className="space-y-1 text-[10px] font-mono">
                <div className="flex justify-between">
                    <span className="text-text-muted">Base Value</span>
                    <span className="text-white">{data.base.toFixed(1)}</span>
                </div>

                {hasSkillLayer && (
                    <>
                        <div className="text-[8px] text-white/30 uppercase mt-1">Skill Layer</div>
                        <div className="flex justify-between">
                            <span className="text-text-muted">Base</span>
                            <span className="text-white/60">1.00</span>
                        </div>
                        {data.techMulti !== undefined && data.techMulti > 0 && (
                            <div className="flex justify-between">
                                <span className="text-text-muted">Skill Tech</span>
                                <span className="text-green-400">{formatPercent(data.techMulti)}</span>
                            </div>
                        )}
                        {data.clanTechMulti !== undefined && data.clanTechMulti > 0 && (
                            <div className="flex justify-between pl-2">
                                <span className="text-text-muted/70">↳ incl. Clan Tree</span>
                                <span className="text-purple-300">{formatPercent(data.clanTechMulti)}</span>
                            </div>
                        )}
                        {data.itemMulti !== undefined && data.itemMulti > 0 && (
                            <div className="flex justify-between">
                                <span className="text-text-muted">Skill Items</span>
                                <span className="text-green-400">{formatPercent(data.itemMulti)}</span>
                            </div>
                        )}
                        {data.ascMulti !== undefined && data.ascMulti > 1 && (
                            <div className="flex justify-between">
                                <span className="text-text-muted">× Ascension</span>
                                <span className="text-amber-400">{formatMulti(data.ascMulti)}</span>
                            </div>
                        )}
                        {data.skillMulti !== undefined && (
                            <div className="flex justify-between border-t border-white/5 pt-0.5">
                                <span className="text-text-muted">= Skill Multi</span>
                                <span className="text-blue-300 font-bold">{data.skillMulti.toFixed(2)}</span>
                            </div>
                        )}
                    </>
                )}

                {hasCommon && (
                    <>
                        <div className="text-[8px] text-white/30 uppercase mt-1">Common Layer</div>
                        <div className="flex justify-between">
                            <span className="text-text-muted">× Common Multi</span>
                            <span className="text-orange-400 font-bold">×{data.commonMulti!.toFixed(2)}</span>
                        </div>
                    </>
                )}

                {/* Legacy support for equipment tooltips */}
                {data.levelMulti && data.levelMulti > 1 && (
                    <div className="flex justify-between">
                        <span className="text-text-muted">Level Scaling</span>
                        <span className="text-blue-400">×{data.levelMulti.toFixed(2)}</span>
                    </div>
                )}
                {data.skinMulti && data.skinMulti > 1 && (
                    <div className="flex justify-between">
                        <span className="text-text-muted">Skin Bonus</span>
                        <span className="text-pink-400">×{data.skinMulti.toFixed(2)}</span>
                    </div>
                )}

                {data.total && (
                    <div className="flex justify-between border-t border-white/10 pt-1 mt-1">
                        <span className="text-white/60 font-bold">Total</span>
                        <span className="text-white font-bold">{data.total.toFixed(2)}x</span>
                    </div>
                )}
            </div>
        </div>
    );
}

export function StatBreakdownTooltip({ damage, health, isMelee }: StatBreakdownTooltipProps) {
    return (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 bg-black/95 backdrop-blur-md border border-white/10 rounded-lg p-3 shadow-2xl z-[100] pointer-events-none animate-in fade-in zoom-in duration-200">
            <div className="space-y-3">
                {damage && <BreakdownSection data={damage} label="Damage" color="red" />}
                {health && <BreakdownSection data={health} label="Health" color="green" />}
            </div>
            <div className="mt-2 pt-2 border-t border-white/10 text-[8px] text-text-muted italic text-center">
                (1 + Tech + Items) × Asc × Common
            </div>
        </div>
    );
}
