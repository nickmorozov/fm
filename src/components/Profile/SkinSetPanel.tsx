import React from 'react';
import { useSkinSets, SkinSetInfo } from '../../hooks/useSkinSets';
import { useGameData } from '../../hooks/useGameData';
import { useGameDataContext } from '../../context/GameDataContext';
import { Card } from '../UI/Card';
import { cn } from '../../lib/utils';
import { getSkinSpriteStyle } from '../../utils/skinSprites';
import { Sparkles, Trophy } from 'lucide-react';

export function SkinSetPanel() {
    const { sets, loading } = useSkinSets();
    const { data: spriteMapping } = useGameData<any>('ManualSpriteMapping.json');
    const { selectedVersion } = useGameDataContext();

    if (loading || sets.length === 0) return null;

    return (
        <div className="space-y-4">
            <h3 className="text-sm font-black uppercase tracking-widest text-text-muted flex items-center gap-2">
                <Trophy className="w-4 h-4" />
                Active Skin Sets
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {sets.map((set) => (
                    <SkinSetCard key={set.setId} set={set} spriteMapping={spriteMapping} version={selectedVersion} />
                ))}
            </div>
        </div>
    );
}

function SkinSetCard({ set, spriteMapping, version }: { set: SkinSetInfo, spriteMapping?: any, version?: string }) {
    const displayName = set.setId.replace(/Set$/, '').replace(/([A-Z])/g, ' $1').trim();

    return (
        <Card className={cn(
            "p-3 relative overflow-hidden transition-all duration-300",
            set.isComplete
                ? "bg-gradient-to-br from-yellow-500/10 to-amber-500/20 border-yellow-500/40 shadow-[0_0_15px_rgba(234,179,8,0.1)]"
                : "bg-bg-secondary/40 border-border/50"
        )}>


            <div className="flex items-start justify-between mb-2">
                <div>
                    <div className={cn(
                        "text-xs font-black uppercase tracking-wider mb-0.5",
                        set.isComplete ? "text-yellow-400" : "text-text-primary"
                    )}>
                        {displayName}
                    </div>
                    <div className="text-3xs text-text-muted font-bold">
                        {set.equippedCount} / {set.totalPieces} Pieces
                    </div>
                </div>
                {set.isComplete && (
                    <div className="bg-yellow-500/20 text-yellow-400 text-4xs font-black px-1.5 py-0.5 rounded border border-yellow-500/30 uppercase tracking-tighter">
                        Complete
                    </div>
                )}
            </div>

            {/* Piece Icons */}
            <div className="flex gap-1 mb-3">
                {set.pieces.map((piece, idx) => (
                    <div
                        key={idx}
                        className={cn(
                            "w-8 h-8 rounded border transition-all duration-500",
                            piece.isEquipped
                                ? "bg-bg-input border-accent-primary shadow-[0_0_8px_rgba(59,130,246,0.2)]"
                                : "bg-black/20 border-white/5 opacity-30 grayscale scale-90"
                        )}
                        style={getSkinSpriteStyle({ SkinId: { Type: piece.type, Idx: piece.idx } }, spriteMapping?.skins?.mapping, version)}
                        title={`${piece.type} (Idx: ${piece.idx})`}
                    />
                ))}
            </div>

            {/* Bonuses */}
            {set.bonuses.length > 0 && (
                <div className="space-y-1">
                    {set.bonuses.map((bonus, idx) => (
                        <div key={idx} className="flex items-center justify-between text-3xs bg-black/20 px-2 py-1 rounded">
                            <span className="text-text-muted">{bonus.type} Bonus</span>
                            <span className="text-green-400 font-bold">
                                +{(bonus.value * 100).toFixed(0)}%
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </Card>
    );
}
