import React from 'react';
import { Minus, Plus } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ModalLevelSelectorProps {
    level: number;
    maxLevel: number;
    onChange: (level: number) => void;
    label?: string;
    className?: string;
}

export const ModalLevelSelector: React.FC<ModalLevelSelectorProps> = ({
    level,
    maxLevel,
    onChange,
    label = "LEVEL",
    className
}) => {
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseInt(e.target.value);
        if (!isNaN(val)) {
            onChange(Math.max(1, Math.min(maxLevel, val)));
        }
    };

    return (
        <div className={cn("space-y-1.5", className)}>
            <div className="flex items-center justify-between px-1">
                <label className="text-3xs font-black text-text-muted uppercase tracking-widest leading-none">{label}</label>
                <div className="flex items-center gap-1.5">
                    <span className="text-4xs font-black text-accent-primary bg-accent-primary/10 px-1.5 py-0.5 rounded uppercase tracking-tighter">MAX {maxLevel}</span>
                </div>
            </div>
            <div className="relative flex items-center bg-bg-secondary/30 rounded-2xl border border-border p-1.5 gap-2 group transition-all hover:border-border/80 focus-within:border-accent-primary/50 shadow-inner">
                <button
                    onClick={() => onChange(Math.max(1, level - 1))}
                    disabled={level <= 1}
                    className="w-11 h-11 flex items-center justify-center rounded-xl bg-bg-input hover:bg-bg-input/80 active:scale-95 disabled:opacity-30 disabled:active:scale-100 transition-all text-text-primary border border-border/50 shadow-sm"
                >
                    <Minus className="w-5 h-5" />
                </button>
                
                <div className="flex-1 relative flex items-center justify-center min-w-0">
                    <input
                        type="number"
                        value={level}
                        onChange={handleInputChange}
                        className="w-full bg-transparent text-center text-xl font-black text-text-primary focus:outline-none h-11 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none tabular-nums"
                        onFocus={(e) => e.target.select()}
                    />
                </div>

                <button
                    onClick={() => onChange(Math.min(maxLevel, level + 1))}
                    disabled={level >= maxLevel}
                    className="w-11 h-11 flex items-center justify-center rounded-xl bg-accent-primary hover:bg-accent-primary/90 active:scale-95 disabled:opacity-30 disabled:active:scale-100 transition-all text-white border border-accent-primary/20 shadow-md shadow-accent-primary/20"
                >
                    <Plus className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
};
