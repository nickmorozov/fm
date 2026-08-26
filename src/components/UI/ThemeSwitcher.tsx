import { useEffect, useRef, useState } from 'react';
import { Palette, Check, Monitor, Moon, Sun } from 'lucide-react';
import { cn } from '../../lib/utils';
import { usePersistentState } from '../../hooks/usePersistentState';

export type DarkThemeId = 'forge' | 'graphite' | 'solarized';
export type LightThemeId = 'solarized-light' | 'paper' | 'mist';
export type ThemeMode = 'system' | 'dark' | 'light';

interface ThemeConfig {
    mode: ThemeMode;
    dark: DarkThemeId;
    light: LightThemeId;
}

const DARK_THEMES: { id: DarkThemeId; label: string; swatch: string }[] = [
    { id: 'forge', label: 'Forge Black', swatch: '#0d0d12' },
    { id: 'graphite', label: 'Graphite', swatch: '#262a30' },
    { id: 'solarized', label: 'Solarized Dark', swatch: '#073642' },
];

const LIGHT_THEMES: { id: LightThemeId; label: string; swatch: string }[] = [
    { id: 'solarized-light', label: 'Solarized Light', swatch: '#fdf6e3' },
    { id: 'paper', label: 'Paper', swatch: '#fafafa' },
    { id: 'mist', label: 'Mist', swatch: '#f1f5f9' },
];

const MODES: { id: ThemeMode; label: string; icon: typeof Monitor }[] = [
    { id: 'system', label: 'System', icon: Monitor },
    { id: 'dark', label: 'Dark', icon: Moon },
    { id: 'light', label: 'Light', icon: Sun },
];

const DEFAULT_CONFIG: ThemeConfig = { mode: 'dark', dark: 'forge', light: 'solarized-light' };

/** Accepts the old schema (a bare palette string) and anything malformed. */
function normalize(value: unknown): ThemeConfig {
    if (typeof value === 'string') {
        const dark = DARK_THEMES.some(t => t.id === value) ? (value as DarkThemeId) : 'forge';
        return { ...DEFAULT_CONFIG, dark };
    }
    const v = (value || {}) as Partial<ThemeConfig>;
    return {
        mode: v.mode === 'light' || v.mode === 'system' ? v.mode : 'dark',
        dark: DARK_THEMES.some(t => t.id === v.dark) ? (v.dark as DarkThemeId) : 'forge',
        light: LIGHT_THEMES.some(t => t.id === v.light) ? (v.light as LightThemeId) : 'solarized-light',
    };
}

/**
 * Theme settings: a mode (system / dark / light) plus one palette per mode. The effective palette
 * lands on <html data-theme="..."> and every semantic color in tailwind.config.js resolves through
 * the per-theme CSS variables in index.css. index.html applies the saved value before first paint.
 */
export function ThemeSwitcher() {
    const [stored, setStored] = usePersistentState<ThemeConfig | string>('fm_theme', DEFAULT_CONFIG);
    const config = normalize(stored);
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const [systemDark, setSystemDark] = useState(() => window.matchMedia('(prefers-color-scheme: dark)').matches);

    useEffect(() => {
        const mq = window.matchMedia('(prefers-color-scheme: dark)');
        const onChange = (event: MediaQueryListEvent) => setSystemDark(event.matches);
        mq.addEventListener('change', onChange);
        return () => mq.removeEventListener('change', onChange);
    }, []);

    const isDark = config.mode === 'dark' || (config.mode === 'system' && systemDark);
    const effective = isDark ? config.dark : config.light;

    useEffect(() => {
        document.documentElement.dataset.theme = effective;
    }, [effective]);

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

    const update = (patch: Partial<ThemeConfig>) => setStored({ ...config, ...patch });

    /* Picking a palette from the "wrong" side also switches to that side (unless following the
       system), so the click always has a visible effect. */
    const pickDark = (id: DarkThemeId) => update({ dark: id, ...(config.mode === 'light' ? { mode: 'dark' as ThemeMode } : {}) });
    const pickLight = (id: LightThemeId) => update({ light: id, ...(config.mode === 'dark' ? { mode: 'light' as ThemeMode } : {}) });

    const renderPalette = <T extends string>(
        title: string,
        themes: { id: T; label: string; swatch: string }[],
        selected: T,
        active: boolean,
        onPick: (id: T) => void,
    ) => (
        <div>
            <p className="px-2.5 pt-2 pb-1 text-[10px] font-black uppercase tracking-widest text-text-muted">{title}</p>
            {themes.map(({ id, label, swatch }) => (
                <button
                    key={id}
                    role="menuitemradio"
                    aria-checked={selected === id}
                    onClick={() => onPick(id)}
                    className={cn(
                        'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-bold transition-colors text-left',
                        selected === id
                            ? active
                                ? 'bg-accent-primary/15 text-accent-primary'
                                : 'bg-bg-card-hover text-text-primary'
                            : 'text-text-secondary hover:bg-bg-card-hover hover:text-text-primary'
                    )}
                >
                    <span
                        className="w-4 h-4 rounded-full border border-white/20 shrink-0"
                        style={{ backgroundColor: swatch }}
                    />
                    <span className="flex-1">{label}</span>
                    {selected === id && <Check className={cn('w-3.5 h-3.5 shrink-0', !active && 'opacity-40')} />}
                </button>
            ))}
        </div>
    );

    return (
        <div ref={ref} className="relative">
            <button
                onClick={() => setOpen((prev) => !prev)}
                aria-label="Theme settings"
                aria-expanded={open}
                aria-haspopup="menu"
                className="w-9 h-9 rounded-lg border border-border bg-bg-input hover:bg-bg-card-hover flex items-center justify-center text-text-secondary hover:text-text-primary transition-colors"
            >
                <Palette className="w-4 h-4" />
            </button>

            {open && (
                <div
                    role="menu"
                    className="absolute right-0 top-full mt-2 z-50 w-52 rounded-xl border border-border bg-bg-primary p-1.5 shadow-2xl"
                >
                    <div className="flex gap-1 p-1 rounded-lg bg-bg-input border border-border/60">
                        {MODES.map(({ id, label, icon: Icon }) => (
                            <button
                                key={id}
                                role="menuitemradio"
                                aria-checked={config.mode === id}
                                onClick={() => update({ mode: id })}
                                title={label}
                                className={cn(
                                    'flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md text-[10px] font-black uppercase tracking-wide transition-colors',
                                    config.mode === id
                                        ? 'bg-accent-primary/20 text-accent-primary'
                                        : 'text-text-muted hover:text-text-primary hover:bg-bg-card-hover'
                                )}
                            >
                                <Icon className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">{label}</span>
                            </button>
                        ))}
                    </div>

                    {renderPalette('Dark themes', DARK_THEMES, config.dark, isDark, pickDark)}
                    {renderPalette('Light themes', LIGHT_THEMES, config.light, !isDark, pickLight)}
                </div>
            )}
        </div>
    );
}
