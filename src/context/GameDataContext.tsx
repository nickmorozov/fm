import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { safeFetch } from '../utils/safeFetch';

interface GameDataContextType {
    versions: string[];
    selectedVersion: string;
    setSelectedVersion: (version: string) => void;
    isLoadingVersions: boolean;
    isDebug: boolean;
}

const GameDataContext = createContext<GameDataContextType | undefined>(undefined);

export function GameDataProvider({ children }: { children: ReactNode }) {
    const [versions, setVersions] = useState<string[]>([]);
    const [selectedVersion, setSelectedVersion] = useState<string>('');
    const [isLoadingVersions, setIsLoadingVersions] = useState(true);
    const [isDebug, setIsDebug] = useState(false);

    useEffect(() => {
        const checkDebug = () => {
            const hasDebug = window.location.href.includes('debug=true');
            setIsDebug(hasDebug);
        };
        checkDebug();
        window.addEventListener('hashchange', checkDebug);
        return () => window.removeEventListener('hashchange', checkDebug);
    }, []);

    useEffect(() => {
        async function fetchVersions() {
            const versionsUrl = `${import.meta.env.BASE_URL}parsed_configs/versions.json`;
            console.log(`[GameDataContext] Fetching versions from: ${versionsUrl}`);
            
            try {
                const res = await safeFetch(versionsUrl);
                if (res.ok) {
                    try {
                        const v = await res.json();
                        if (Array.isArray(v) && v.length > 0) {
                            v.sort((a: string, b: string) => b.localeCompare(a));
                            console.log(`[GameDataContext] Versions loaded: ${v.join(', ')}`);
                            setVersions(v);
                            setSelectedVersion(v[0]);
                            return;
                        }
                    } catch (parseError) {
                        console.error("[GameDataContext] Failed to parse versions.json", parseError);
                    }
                } else {
                    console.error(`[GameDataContext] versions.json fetch failed with status: ${res.status}`);
                }
            } catch (e) {
                console.error("[GameDataContext] Failed to fetch versions", e);
            } finally {
                setIsLoadingVersions(false);
                // Last resort fallback if everything failed
                setVersions(prev => {
                    if (prev.length === 0) {
                        const fallback = ["2026_05_06_11_12"];
                        setSelectedVersion(fallback[0]);
                        return fallback;
                    }
                    return prev;
                });
            }
        }
        fetchVersions();
    }, []);

    return (
        <GameDataContext.Provider value={{ versions, selectedVersion, setSelectedVersion, isLoadingVersions, isDebug }}>
            {children}
        </GameDataContext.Provider>
    );
}

export function useGameDataContext() {
    const context = useContext(GameDataContext);
    if (context === undefined) {
        throw new Error('useGameDataContext must be used within a GameDataProvider');
    }
    return context;
}
