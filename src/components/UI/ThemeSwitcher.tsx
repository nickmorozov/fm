import { useEffect, useRef, useState } from 'react';
import { Palette, Check } from 'lucide-react';
import { cn } from '../../lib/utils';
import { usePersistentState } from '../../hooks/usePersistentState';

export type ThemeId = 'forge' | 'graphite' | 'solarized';

const THEMES: { id: ThemeId; label: string; swatch: string }[] = [
    { id: 'forge', label: 'Forge Black', swatch: '#0d0d12' },
    { id: 'graphite', label: 'Graphite', swatch: '#262a30' },
    { id: 'solarized', label: 'Solarized Dark', swatch: '#073642' },
];

/**
 * Color theme picker. The choice lives on <html data-theme="..."> and every semantic color in
 * tailwind.config.js resolves through the per-theme CSS variables in index.css, so switching
 * restyles the whole app instantly. index.html applies the saved value before first paint.
 */
export function ThemeSwitcher() {
    const [theme, setTheme] = usePersistentState<ThemeId>('fm_theme', 'forge');
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        document.documentElement.dataset.theme = theme;
    }, [theme]);

    useEffect(() => {
        if (!open) return;
        const onPointerDown = (event: PointerEvent) => {
            if (!ref.current?.contains(event.target as Node)) setOpen(false);
        };
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') setOpen(false);
        };
        document.addEventListener('pointerdown', onPointerDown);
        document.addEventListener('keydown', onKeyDown);
        return () => {
            document.removeEventListener('pointerdown', onPointerDown);
            document.removeEventListener('keydown', onKeyDown);
        };
    }, [open]);

    return (
        <div ref={ref} className="relative">
            <button
                onClick={() => setOpen((prev) => !prev)}
                aria-label="Change color theme"
                aria-expanded={open}
                aria-haspopup="menu"
                className="w-9 h-9 rounded-lg border border-border bg-bg-input hover:bg-bg-card-hover flex items-center justify-center text-text-secondary hover:text-text-primary transition-colors"
            >
                <Palette className="w-4 h-4" />
            </button>

            {open && (
                <div
                    role="menu"
                    className="absolute right-0 top-full mt-2 z-50 w-44 rounded-xl border border-border bg-bg-primary p-1.5 shadow-2xl"
                >
                    {THEMES.map(({ id, label, swatch }) => (
                        <button
                            key={id}
                            role="menuitemradio"
                            aria-checked={theme === id}
                            onClick={() => {
                                setTheme(id);
                                setOpen(false);
                            }}
                            className={cn(
                                'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-bold transition-colors text-left',
                                theme === id
                                    ? 'bg-accent-primary/15 text-accent-primary'
                                    : 'text-text-secondary hover:bg-bg-card-hover hover:text-text-primary'
                            )}
                        >
                            <span
                                className="w-4 h-4 rounded-full border border-white/20 shrink-0"
                                style={{ backgroundColor: swatch }}
                            />
                            <span className="flex-1">{label}</span>
                            {theme === id && <Check className="w-3.5 h-3.5 shrink-0" />}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
