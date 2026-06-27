import { useMemo, useState } from 'react';
import { useProfile } from '../../context/ProfileContext';
import { useGameData } from '../../hooks/useGameData';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { Card } from '../UI/Card';
import { ConfirmModal } from '../UI/ConfirmModal';
import { Search, Lock, Check } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useGameDataContext } from '../../context/GameDataContext';

const ICON_SIZE = 40;

type TreeName = 'Forge' | 'Power' | 'SkillsPetTech' | 'Clan';

// The three "hero" branches shown side-by-side on wide screens.
// Clan is intentionally excluded — it always lives in its own tab.
const HERO_TREES: TreeName[] = ['Forge', 'Power', 'SkillsPetTech'];

const TREE_LABELS: Record<TreeName, string> = {
    Forge: 'Forge',
    Power: 'Power',
    SkillsPetTech: 'Skills & Pets',
    Clan: 'Clan',
};

interface TechNode {
    id: number;
    tier: number;
    layer: number;
    type: string;
    sprite_rect?: { x: number; y: number; width: number; height: number };
    requirements: number[];
    uniqueKey: string;
}

// Helper to generate a unique key for a stat (Type + Target)
function getStatSignature(stat: any): string {
    const type = stat.StatNode?.UniqueStat?.StatType || 'Unknown';
    const nature = stat.StatNode?.UniqueStat?.StatNature || 'Multiplier';
    const target = stat.StatNode?.StatTarget || {};
    const cleanTarget = Object.entries(target).reduce((acc, [k, v]) => {
        if (v !== null && v !== undefined) acc[k] = v;
        return acc;
    }, {} as any);
    return `${type}|${nature}|${JSON.stringify(cleanTarget, Object.keys(cleanTarget).sort())}`;
}

// Check if a node is unlocked: requirement nodes just need level >= 1 (not max)
function isNodeUnlocked(node: TechNode, treeLevels: Record<number, number>): boolean {
    if (!node.requirements || node.requirements.length === 0) return true;
    return node.requirements.every(reqId => {
        const reqLevel = treeLevels[reqId] || 0;
        return reqLevel >= 1; // Just need to be started, not maxed
    });
}

// Check if a node is completed (at max level)
function isNodeCompleted(nodeId: number, treeLevels: Record<number, number>, maxLevel: number): boolean {
    const level = treeLevels[nodeId] || 0;
    return level >= maxLevel;
}

export function TechTreePanel() {
    const { profile, updateProfile } = useProfile();
    const { data: treeMapping } = useGameData<any>('TechTreeMapping.json');
    const { data: treeEffects } = useGameData<any>('TechTreeLibrary.json');
    const { selectedVersion } = useGameDataContext();
    const [activeTab, setActiveTab] = useState<TreeName>('Forge');
    const [searchTerm, setSearchTerm] = useState('');
    const [pendingReset, setPendingReset] = useState<{ nodeId: number; treeName: TreeName; count: number } | null>(null);

    // On wide screens we render the three hero branches as columns. Clan is
    // always its own tab, so it never participates in the column layout.
    const isWide = useMediaQuery('(min-width: 1280px)');
    const showHeroColumns = isWide && activeTab !== 'Clan';

    // Pre-calculate GLOBAL stats across all active trees
    const globalStats = useMemo(() => {
        if (!profile || !treeEffects || !treeMapping) return {};
        const stats: Record<string, number> = {};

        const allTrees: TreeName[] = ['Forge', 'Power', 'SkillsPetTech', 'Clan'];

        allTrees.forEach(treeName => {
            const userLevels = profile.techTree?.[treeName] || {};
            // We need to look up node definitions to check Type
            const treeMap = treeMapping.trees?.[treeName];
            if (!treeMap?.nodes) return;

            // Create a map for fast lookup? Or just iterate active nodes.
            // Iterating active user nodes is better if efficient.
            Object.entries(userLevels).forEach(([nodeId, lvl]) => {
                const level = Number(lvl);
                if (level <= 0) return;

                const nodeDef = treeMap.nodes.find((n: any) => n.id === parseInt(nodeId));
                if (!nodeDef) return;

                const effect = treeEffects[nodeDef.type];
                if (!effect?.Stats) return;

                effect.Stats.forEach((stat: any) => {
                    const sig = getStatSignature(stat);
                    const base = stat.Value || 0;
                    const inc = stat.ValueIncrease || 0;
                    const total = base + ((level - 1) * inc);

                    stats[sig] = (stats[sig] || 0) + total;
                });
            });
        });

        return stats;
    }, [profile.techTree, treeEffects, treeMapping]);

    // Helper function to format stat description with Global info
    const formatStatDescription = (effect: any, currentLevel: number) => {
        if (!effect?.Stats || effect.Stats.length === 0) return '';

        return effect.Stats.map((stat: any) => {
            const statType = stat.StatNode?.UniqueStat?.StatType || 'Unknown';
            const statNature = stat.StatNode?.UniqueStat?.StatNature || 'Multiplier';
            const baseValue = stat.Value || 0;
            const increase = stat.ValueIncrease || 0;

            const totalValue = currentLevel > 0 ? baseValue + (currentLevel - 1) * increase : 0;

            // Global Total
            const sig = getStatSignature(stat);
            const globalTotal = globalStats[sig] || 0;

            const formatVal = (val: number) => {
                if (statNature === 'Multiplier' || statNature === 'OneMinusMultiplier' || statNature === 'Divisor') {
                    return `${(val * 100).toFixed(1)}%`;
                } else if (statNature === 'Additive') {
                    return `+${val.toFixed(0)}`;
                }
                return val.toFixed(2);
            };

            const formatInc = (val: number) => {
                if (statNature === 'Multiplier' || statNature === 'OneMinusMultiplier' || statNature === 'Divisor') {
                    // Show 2 decimal places for small increments (e.g. 0.25%)
                    return `${(val * 100).toFixed(2)}%`;
                }
                return val.toFixed(1);
            }

            return (
                <div key={sig} className="flex flex-col gap-0.5 border-t border-white/5 pt-1 mt-1 first:border-0 first:pt-0 first:mt-0">
                    <span className="font-bold text-accent-primary leading-tight">
                        {statType}: {formatVal(totalValue)}
                        <span className="text-text-muted text-[9px] font-normal ml-1 opacity-75">
                            (+{formatInc(increase)}/lvl)
                        </span>
                    </span>
                    <span className="text-[9px] text-text-secondary">
                        Global Pool: <span className="text-white/80">{formatVal(globalTotal)}</span>
                    </span>
                </div>
            );
        });
    };

    // Get trees from new mapping
    const treesData = useMemo(() => {
        if (!treeMapping?.trees) return {};
        return treeMapping.trees;
    }, [treeMapping]);

    const treeCategories: TreeName[] = ['Forge', 'Power', 'SkillsPetTech', 'Clan'];

    const getTreeLevels = (treeName: TreeName): Record<number, number> => profile.techTree[treeName] || {};

    // Pre-group every tree's nodes by layer (search-filtered). Doing all trees
    // up front lets the column layout render three at once without re-deriving.
    const nodesByLayerByTree = useMemo(() => {
        const result: Record<string, Record<number, TechNode[]>> = {};
        const term = searchTerm.toLowerCase();

        treeCategories.forEach((treeName) => {
            const tree = treesData[treeName];
            const layers: Record<number, TechNode[]> = {};
            if (tree?.nodes) {
                let nodes: TechNode[] = tree.nodes.map((n: any) => ({
                    ...n,
                    uniqueKey: `${treeName}_${n.id}`,
                }));

                if (term) {
                    nodes = nodes.filter((n: TechNode) => n.type.toLowerCase().includes(term));
                }

                nodes.forEach((node) => {
                    if (!layers[node.layer]) layers[node.layer] = [];
                    layers[node.layer].push(node);
                });

                Object.values(layers).forEach((layerNodes) => layerNodes.sort((a, b) => a.id - b.id));
            }
            result[treeName] = layers;
        });

        return result;
    }, [treesData, searchTerm]);

    // Get sprite style from TechTreeMapping
    const getSpriteStyle = (node: TechNode) => {
        if (!treeMapping || !node?.sprite_rect) return null;
        const { x, y, width, height } = node.sprite_rect;
        const sheetW = treeMapping.texture_size?.width || 1024;
        const sheetH = treeMapping.texture_size?.height || 1024;

        const scale = ICON_SIZE / width;
        // Unity Y coordinate (0 at bottom) -> CSS (0 at top)
        const cssY = sheetH - y - height;

        return {
            backgroundImage: `url(${import.meta.env.BASE_URL}Texture2D/${selectedVersion}/TechTreeIcons.png)`,
            backgroundPosition: `-${x * scale}px -${cssY * scale}px`,
            backgroundSize: `${sheetW * scale}px ${sheetH * scale}px`,
            width: `${ICON_SIZE}px`,
            height: `${ICON_SIZE}px`,
        };
    };

    const getCascadeCount = (nodeId: number, treeName: TreeName): number => {
        const tree = treesData[treeName];
        if (!tree?.nodes) return 1;
        const treeLevels = getTreeLevels(treeName);

        let count = 1; // Start with the node itself

        const visited = new Set<number>();
        visited.add(nodeId);

        const countRecursive = (pid: number) => {
            const dependents = tree.nodes.filter((n: any) => n.requirements && n.requirements.includes(pid));
            dependents.forEach((dep: any) => {
                // If it's active AND not already visited
                if (treeLevels[dep.id] > 0 && !visited.has(dep.id)) {
                    visited.add(dep.id);
                    count++;
                    countRecursive(dep.id);
                }
            });
        };

        countRecursive(nodeId);
        return count;
    };

    const autoUnlockRequirements = (nodeId: number, levels: Record<number, number>, treeName: TreeName) => {
        const tree = treesData[treeName];
        if (!tree?.nodes) return levels;

        const updatedLevels = { ...levels };
        const processed = new Set<number>();

        const unlockRecursive = (id: number) => {
            if (processed.has(id)) return;
            processed.add(id);

            const node = tree.nodes.find((n: any) => n.id === id);
            if (!node) return;

            if (node.requirements) {
                node.requirements.forEach((reqId: number) => {
                    if ((updatedLevels[reqId] || 0) === 0) {
                        updatedLevels[reqId] = 1;
                        unlockRecursive(reqId);
                    }
                });
            }
        };

        unlockRecursive(nodeId);
        return updatedLevels;
    };

    const executeLevelChange = (nodeId: number, level: number, treeName: TreeName) => {
        const newTreeLevels = { ...getTreeLevels(treeName), [nodeId]: level };

        // Cascade Reset logic applied to the new levels object
        if (level === 0) {
            const tree = treesData[treeName];
            if (tree && tree.nodes) {
                const resetDependents = (parentId: number, levels: Record<number, number>) => {
                    const dependents = tree.nodes.filter((n: any) => n.requirements && n.requirements.includes(parentId));
                    dependents.forEach((dep: any) => {
                        if (levels[dep.id] > 0) {
                            levels[dep.id] = 0;
                            resetDependents(dep.id, levels);
                        }
                    });
                };
                resetDependents(nodeId, newTreeLevels);
            }
        }

        updateProfile({
            techTree: {
                ...profile.techTree,
                [treeName]: newTreeLevels
            }
        });
    };

    const handleLevelChange = (nodeId: number, level: number, max: number, treeName: TreeName) => {
        const val = Math.max(0, Math.min(level, max));
        const treeLevels = getTreeLevels(treeName);

        // If resetting to 0, check for cascade
        if (val === 0) {
            const count = getCascadeCount(nodeId, treeName);
            if (count > 1) {
                setPendingReset({ nodeId, treeName, count });
                return;
            }
        }

        // Auto unlock if trying to increase level on a locked node
        const treeMap = treesData[treeName];
        const nodeDef = treeMap?.nodes?.find((n: any) => n.id === nodeId);
        const unlocked = nodeDef ? isNodeUnlocked(nodeDef, treeLevels) : true;

        if (level > 0 && !unlocked) {
            const unlockedLevels = autoUnlockRequirements(nodeId, treeLevels, treeName);
            unlockedLevels[nodeId] = Math.max(unlockedLevels[nodeId] || 0, level);

            updateProfile({
                techTree: {
                    ...profile.techTree,
                    [treeName]: unlockedLevels
                }
            });
            return;
        }

        executeLevelChange(nodeId, val, treeName);
    };

    // Calculate completion percentages
    const completionData = useMemo(() => {
        if (!treeMapping?.trees || !treeEffects) return {};
        const data: Record<string, { current: number; max: number; percent: number }> = {};

        (['Forge', 'Power', 'SkillsPetTech', 'Clan'] as TreeName[]).forEach((treeName) => {
            const tree = treeMapping.trees[treeName];
            const nodes = tree?.nodes || [];
            let currentTotal = 0;
            let maxTotal = 0;

            const userTree = profile.techTree?.[treeName as TreeName] || {};

            nodes.forEach((node: any) => {
                const effect = treeEffects[node.type];
                const max = effect?.MaxLevel || 5;
                const current = userTree[node.id] || 0;

                maxTotal += max;
                currentTotal += current;
            });

            data[treeName] = {
                current: currentTotal,
                max: maxTotal,
                percent: maxTotal > 0 ? (currentTotal / maxTotal) * 100 : 0
            };
        });

        return data;
    }, [treeMapping, treeEffects, profile.techTree]);

    if (!treeMapping || !treeEffects) {
        return <Card className="p-6">Loading Tech Tree...</Card>;
    }

    // Render the layered nodes for a single tree.
    const renderTreeBody = (treeName: TreeName) => {
        const layers = nodesByLayerByTree[treeName] || {};
        const sortedLayers = Object.keys(layers).map(Number).sort((a, b) => a - b);
        const treeLevels = getTreeLevels(treeName);

        if (sortedLayers.length === 0) {
            return (
                <div className="text-center py-8 text-text-muted text-sm">
                    No nodes found{searchTerm ? ` for "${searchTerm}"` : ''} in {TREE_LABELS[treeName]}
                </div>
            );
        }

        return (
            <div className="space-y-2 max-h-[600px] overflow-y-auto custom-scrollbar pr-2">
                {sortedLayers.map((layer) => {
                    const layerNodes = layers[layer];

                    return (
                        <div key={layer} className="flex flex-col items-center">
                            {/* Connection lines from previous layer */}
                            {layer > 0 && (
                                <div className="h-4 flex items-center justify-center">
                                    <div className="w-px h-full bg-accent-primary/30" />
                                </div>
                            )}

                            {/* Nodes in this layer */}
                            <div className="flex flex-nowrap gap-2 sm:gap-3 justify-center w-full overflow-x-auto px-1">
                                {layerNodes.map((node) => {
                                    const effect = treeEffects?.[node.type];
                                    const maxLevel = effect?.MaxLevel || 5;
                                    const currentLevel = treeLevels[node.id] || 0;
                                    const unlocked = isNodeUnlocked(node, treeLevels);
                                    const completed = isNodeCompleted(node.id, treeLevels, maxLevel);
                                    const name = node.type.replace(/([A-Z])/g, ' $1').trim();
                                    const spriteStyle = getSpriteStyle(node);

                                    return (
                                        <div
                                            key={node.uniqueKey}
                                            className={cn(
                                                "min-w-[140px] max-w-[180px] flex-1 p-2 sm:p-3 rounded-lg border transition-all",
                                                !unlocked
                                                    ? "border-border/50 bg-bg-secondary/50 opacity-50"
                                                    : completed
                                                        ? "border-green-500/50 bg-green-500/10"
                                                        : currentLevel > 0
                                                            ? "border-accent-primary/50 bg-accent-primary/5"
                                                            : "border-border bg-bg-secondary"
                                            )}
                                        >
                                            <div className="flex gap-2 items-start">
                                                {/* Icon */}
                                                <div className={cn(
                                                    "w-10 h-10 shrink-0 rounded-lg flex items-center justify-center overflow-hidden border relative",
                                                    !unlocked
                                                        ? "bg-black/40 border-white/5"
                                                        : completed
                                                            ? "bg-green-500/20 border-green-500/30"
                                                            : "bg-black/20 border-white/5"
                                                )}>
                                                    {spriteStyle && (
                                                        <div style={spriteStyle} className={cn(!unlocked && "grayscale")} />
                                                    )}
                                                    {!unlocked && (
                                                        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                                                            <Lock className="w-3 h-3 text-text-muted" />
                                                        </div>
                                                    )}
                                                    {completed && (
                                                        <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
                                                            <Check className="w-3 h-3 text-white" />
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Info */}
                                                <div className="flex-1 min-w-0">
                                                    <div className={cn(
                                                        "text-xs font-bold truncate",
                                                        !unlocked && "text-text-muted"
                                                    )}>
                                                        {name}
                                                    </div>
                                                    <div className="text-[10px] text-text-muted">
                                                        T{node.tier + 1} • ID: {node.id}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Level Controls */}
                                            <div className="flex items-center justify-between mt-2 bg-bg-input rounded p-1 border border-border/50">
                                                <button
                                                    onClick={() => handleLevelChange(node.id, currentLevel - 1, maxLevel, treeName)}
                                                    disabled={!unlocked || currentLevel === 0}
                                                    className={cn(
                                                        "w-6 h-6 rounded flex items-center justify-center font-bold text-xs transition-colors",
                                                        unlocked && currentLevel > 0
                                                            ? "bg-bg-secondary hover:bg-white/10"
                                                            : "text-text-muted cursor-not-allowed"
                                                    )}
                                                >-</button>
                                                <div className="text-center">
                                                    <span className={cn(
                                                        "font-mono font-bold text-sm",
                                                        completed ? "text-green-400" : currentLevel > 0 ? "text-accent-primary" : "text-text-muted"
                                                    )}>{currentLevel}</span>
                                                    <span className="text-text-muted text-xs">/{maxLevel}</span>
                                                </div>
                                                <button
                                                    onClick={() => handleLevelChange(node.id, currentLevel + 1, maxLevel, treeName)}
                                                    disabled={currentLevel >= maxLevel}
                                                    className={cn(
                                                        "w-6 h-6 rounded flex items-center justify-center font-bold text-xs transition-colors",
                                                        currentLevel < maxLevel
                                                            ? !unlocked
                                                                ? "bg-orange-500/20 text-orange-400 hover:bg-orange-500/30"
                                                                : "bg-bg-secondary hover:bg-white/10"
                                                            : "text-text-muted cursor-not-allowed"
                                                    )}
                                                    title={!unlocked ? "Auto-unlock requirements" : ""}
                                                >+</button>
                                            </div>

                                            {/* Stat Description */}
                                            {unlocked && currentLevel > 0 && (
                                                <div className="text-[10px] mt-1 text-accent-secondary truncate">
                                                    {formatStatDescription(effect, currentLevel)}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    const completionBadge = (treeName: TreeName, active: boolean) => {
        const completion = completionData[treeName];
        if (!completion) return null;
        return (
            <span className={cn(
                "text-xs px-1.5 py-0.5 rounded",
                active ? "bg-black/20 text-white/90" : "bg-black/10 text-text-muted"
            )}>
                {completion.percent.toFixed(2)}%
            </span>
        );
    };

    return (
        <Card className="p-6">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <img src={`${import.meta.env.BASE_URL}Texture2D/${selectedVersion}/TechTreeForge.png`} alt="Tech Tree" className="w-8 h-8 object-contain" />
                Tech Tree
            </h2>

            {/* Tab Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
                    {isWide ? (
                        // Wide layout: the three hero branches collapse into a single
                        // "Hero Branches" view (rendered as columns below); Clan stays
                        // its own tab.
                        <>
                            <button
                                onClick={() => { if (activeTab === 'Clan') setActiveTab('Forge'); }}
                                className={cn(
                                    "px-4 py-2 rounded-lg font-bold text-sm transition-colors whitespace-nowrap flex items-center gap-2",
                                    activeTab !== 'Clan'
                                        ? "bg-accent-primary text-white"
                                        : "bg-bg-input text-text-secondary hover:bg-bg-input/80"
                                )}
                            >
                                <span>Hero Branches</span>
                            </button>
                            <button
                                onClick={() => setActiveTab('Clan')}
                                className={cn(
                                    "px-4 py-2 rounded-lg font-bold text-sm transition-colors whitespace-nowrap flex items-center gap-2",
                                    activeTab === 'Clan'
                                        ? "bg-accent-primary text-white"
                                        : "bg-bg-input text-text-secondary hover:bg-bg-input/80"
                                )}
                            >
                                <span>{TREE_LABELS.Clan}</span>
                                {completionBadge('Clan', activeTab === 'Clan')}
                            </button>
                        </>
                    ) : (
                        treeCategories.map((treeKey) => (
                            <button
                                key={treeKey}
                                onClick={() => {
                                    setActiveTab(treeKey);
                                    setSearchTerm('');
                                }}
                                className={cn(
                                    "px-4 py-2 rounded-lg font-bold text-sm transition-colors whitespace-nowrap flex items-center gap-2",
                                    activeTab === treeKey
                                        ? "bg-accent-primary text-white"
                                        : "bg-bg-input text-text-secondary hover:bg-bg-input/80"
                                )}
                            >
                                <span>{TREE_LABELS[treeKey]}</span>
                                {completionBadge(treeKey, activeTab === treeKey)}
                            </button>
                        ))
                    )}
                </div>
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-text-muted" />
                    <input
                        placeholder="Search nodes..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-bg-input border border-border rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-accent-primary"
                        onFocus={(e) => e.target.select()}
                    />
                </div>
            </div>

            {/* Tree Structure */}
            {showHeroColumns ? (
                <div className="grid grid-cols-3 gap-4">
                    {HERO_TREES.map((treeName) => (
                        <div key={treeName} className="flex flex-col min-w-0">
                            <div className="flex items-center justify-between gap-2 mb-3 pb-2 border-b border-border">
                                <span className="font-bold text-sm">{TREE_LABELS[treeName]}</span>
                                {completionBadge(treeName, false)}
                            </div>
                            {renderTreeBody(treeName)}
                        </div>
                    ))}
                </div>
            ) : (
                renderTreeBody(activeTab)
            )}

            <ConfirmModal
                isOpen={!!pendingReset}
                title="Reset Node?"
                message={`Are you sure? This will also reset ${pendingReset ? pendingReset.count - 1 : 0} dependent nodes.`}
                confirmText="Reset"
                cancelText="Cancel"
                variant="danger"
                onConfirm={() => {
                    if (pendingReset) {
                        executeLevelChange(pendingReset.nodeId, 0, pendingReset.treeName);
                        setPendingReset(null);
                    }
                }}
                onCancel={() => setPendingReset(null)}
            />
        </Card>
    );
}
