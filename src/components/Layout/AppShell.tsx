import { useState, useEffect, useMemo } from 'react';
import { Outlet } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Coffee, ExternalLink, Github } from 'lucide-react';
import { useGameDataContext } from '../../context/GameDataContext';
import { useProfile } from '../../context/ProfileContext';
import { StatsSummaryPanel } from '../Profile/StatsSummaryPanel';
import { cn } from '../../lib/utils';
import { formatVersion } from '../../lib/formatVersion';
import { usePersistentState } from '../../hooks/usePersistentState';

const FRIENDLY_MESSAGES = (userName: string, hasRealName: boolean) => {
    const baseMessages = [
        `Hey ${userName}, still forging? Go grab a snack! 🥪`,
        `That hammer looks heavy, ${userName}. Take a coffee break! ☕`,
        `Did you know? Every 100 clicks, a developer drinks a double espresso. ⚡`,
        `Forging level 100? You're a legend, ${userName}! 🔨`,
        `If you hear a weird noise, it's just the developer's stomach growling. 🍕`,
        `Don't tell the NPCs, but ${userName} is my favorite user. 🤫`,
        `Success is 10% luck, 20% skill, and 70% caffeine. ☕`,
        `Error 404: Coffee not found in developer's system. Please donate caffeine. ☕`,
        `Rumor has it that ${userName} can forge even without sleep. 💤`,
        `Is it getting hot in here or did you just craft another Ultimate? 🌶️`,
        `You've been here a lot today, ${userName}. Your keyboard misses your family. 😂`,
        `Your hammer is glowing, ${userName}! Is that magic or just friction? 🔥`,
        `Hey ${userName}, I saw that Craft! Absolutely stunning. 🌟`,
        `Warning: Excessive forging may lead to excessive fun. ⚠️`,
        `If this tool was any faster, it would be a time machine. ⏳`,
        `Mastering the forge is a marathon, not a sprint, ${userName}. 🏃‍♂️`,
        `Is that a Mythic in your pocket or are you just happy to see me? 💎`,
        `The forge is hot, the coffee is cold. Perfect balance. ⚖️`,
        `${userName}, your progress is making the NPCs jealous. 😎`,
        `Want to see your name in lights? Join our Wall of Fame! 🏆`,
        `The Wall of Fame is waiting for its next hero... Is it you, ${userName}? ✨`,
        `Help keep the forge running and get your spot in the Hall of Fame! 🌟`,
        `Legend says that supporters get +10% Better Luck (not really, but maybe?) 🍀`,
        `Every coffee donated gives the dev +50 Agility to code faster! 🏃‍♂️💨`,
        `Support the forge and help me keep this tool free for everyone! 🔨❤️`,
        `Your support is the coal that keeps this fire burning, ${userName}! 🔥`,
        `If you find this tool useful, consider buying a coffee for the dev! ☕`,
        `The NPCs told me to tell you: you'd look great on the Wall of Fame. 😉`,
        `Coffee in, code out. Help keep the cycle going, ${userName}! ☕💻`,
        `Be the reason the developer smiles today. Support the forge! 😊`,
        `The Dev is starting to see code in his sleep. Send help (and coffee)! 😵‍💫`,
        `Warning: Critical Caffeine Levels detected. Please replenish. ⚡`,
        `Your RNG luck is directly proportional to the amount of coffee I drink. 🍀`,
        `I just found a bug. It was actually a coffee bean. We're safe. 🪲`,
        `The server hamster is tired. Buy it some seeds (or me some coffee)! 🐹`,
        `Legendary drops are 0.00001% more likely if you click this toast! 💎`,
        `I'm coding this from a local tavern. Send some gold for a pint! 🍺`,
        `My keyboard is starting to smoke. I need cooling liquid (Espresso). ⌨️🔥`,
        `Did you know? 1 donation = 1 bug fixed (somewhere, probably). 🛠️`,
        `The anvil is cold. Put some fire (money) in the furnace! 🌋`,
        `Masterpiece in progress... please wait... caffeine required. ⏳`,
        `I see you're using the calculators. Are they helping? Give a tip! 📈`,
        `The FAQ is lonely. Go read it, or just buy me a drink! 🍺`,
        `I'm building a robot to code for me. It runs on lattes. 🤖`,
        `Sleep is for the weak, but coffee is for the Forge Masters! ⚔️`,
        `If you find a bug, buy me a coffee and I'll call it a feature. 😉`,
        `Bring back advanced chat! (But first, bring back the coffee!) 💬`,
        `Bring Back Hex Colors! (But first, bring back the coffee!) 🎨`,
        `The developer has a dedicated server for your support. It's called 'Hope'. 🕊️`
    ];

    if (!hasRealName) {
        baseMessages.push(`Hey! You can set your name in the profile to personalize these messages! 👤`);
    }

    return baseMessages;
};

export default function AppShell() {
    const { selectedVersion } = useGameDataContext();
    const { profile } = useProfile();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isSidebarPinned, setIsSidebarPinned] = usePersistentState('fm_sidebar_pinned', false);
    const [isStatsOpen, setIsStatsOpen] = useState(false);
    const [isHoveringCoffee, setIsHoveringCoffee] = useState(false);

    // When pinned, the sidebar stays open and pushes content instead of overlaying it.
    const isSidebarVisible = isSidebarOpen || isSidebarPinned;

    const maxAgeVisuals = useMemo(() => {
        // profile.misc.forgeLevel is 0-indexed (0 = Lvl 1 in UI)
        const uiLevel = (profile.misc.forgeLevel || 0) + 1;
        
        // Determine max age index based on level (Thresholds from forgeData.ts)
        let ageIdx = 0;
        if (uiLevel >= 30) ageIdx = 9;
        else if (uiLevel >= 24) ageIdx = 8;
        else if (uiLevel >= 20) ageIdx = 7;
        else if (uiLevel >= 17) ageIdx = 6;
        else if (uiLevel >= 14) ageIdx = 5;
        else if (uiLevel >= 11) ageIdx = 4;
        else if (uiLevel >= 8) ageIdx = 3;
        else if (uiLevel >= 5) ageIdx = 2;
        else if (uiLevel >= 2) ageIdx = 1;
        else ageIdx = 0;

        const visuals = [
            { id: 'primitive', name: "Primitive", anim: "primitive-animation", bg: "bg-age-primitive", texture: "PrimitiveBackground.png" },
            { id: 'medieval', name: "Medieval", anim: "medieval-animation", bg: "bg-age-medieval", texture: "MedievalBackground.png" },
            { id: 'earlymodern', name: "Early-Modern", anim: "earlymodern-animation", bg: "bg-age-earlymodern", texture: "EarlyModernBackground.png" },
            { id: 'modern', name: "Modern", anim: "modern-animation", bg: "bg-age-modern", texture: "ModernBackground.png" },
            { id: 'space', name: "Space", anim: "space-animation", bg: "bg-age-space", texture: "SpaceBackground.png" },
            { id: 'interstellar', name: "Interstellar", anim: "interstellar-animation", bg: "bg-age-interstellar", texture: "InterstellarBackground.png" },
            { id: 'multiverse', name: "Multiverse", anim: "multiverse-animation", bg: "bg-age-multiverse", texture: "MultiverseBackground.png" },
            { id: 'quantum', name: "Quantum", anim: "quantum-animation", bg: "bg-age-quantum", texture: "QuantumBackground.png" },
            { id: 'underworld', name: "Underworld", anim: "underworld-animation", bg: "bg-age-underworld", texture: "UnderworldBackground.png" },
            { id: 'divine', name: "Divine", anim: "divine-animation", bg: "bg-age-divine", texture: "DivineBackground.png" },
        ];

        return visuals[ageIdx];
    }, [profile.misc.forgeLevel]);

    const donationLabel = useMemo(() => {
        const labels = [
            "Keep Dev Awake ☕", "Forge Fuel 🔥", "Buy Coffee ☕", "Dev Juice 🥤",
            "Hammer Lube 🔨", "Caffeine Boost ⚡", "Fuel the Dev 🚀", "Tips & Treats 🍬",
            "Mythic Espresso ☕", "Ultimate Latte 🥛", "Forge Coal 🔥",
            "Mana Potion 🧪", "Dev Energy ⚡", "Forge Master Tab 🍺",
            "Coffee Blessing ✨", "Support Craft 🔨", "Binary Beans 🫘",
            "Hot Dev Liquid ☕", "Pixel Caffeine 👾", "Legendary Brew 🍺",
            "Anti-Sleep Serum 🧪", "Code Cruncher Fuel 🍪", "Server Hamster Snacks 🐹",
            "Bug Repellent Fund 🦟", "Infinite Loop Coffee ♾️", "Overclock the Dev ⚡",
            "Dark Mode Power 🌙", "Keyboard Grease ⌨️", "RNG Luck Booster 🍀",
            "Divine Drop Rate Up 💎", "Pet Food for Dev 🍕", "Mount Stable Fund 🐎",
            "Tech Tree Fertilizer 🌱", "XP Boost for Dev 📈", "Sleep is for the Weak 💤",
            "Donation Crit Hit! 🎯", "Anvil Overheat 🌡️", "Magic Brew 🧙",
            "Supporter Aura ✨", "Godly Grind Fuel ⚡", "Bring back advanced chat 💬",
            "Bring Back Hex Colors 🎨"
        ];
        return labels[Math.floor(Math.random() * labels.length)];
    }, []);

    const donationTooltip = useMemo(() => {
        const tooltips = [
            "FORGE NEEDS FUEL! ☕", "DEV NEEDS CAFFEINE! ⚡", "KEEP THE FIRE BURNING! 🔥",
            "UPGRADE MY COFFEE! ☕✨", "HAMMER NEEDS LUBE! 🔨", "ADD SOME FUEL! 🚀",
            "DONATE A BEAN! 🫘", "STAY AWAKE MODE! ⏱️", "FORGE MUST GROW! 🔨📈",
            "SUPPORT THE ANVIL! ⚒️", "ENERGY FOR UPDATES! ⚡💻", "GIVE THE DEV A SNACK! 🥪",
            "CLICK TO PREVENT BURN-OUT! 🕯️", "FEED THE CODING BEAST! 🦁",
            "ERROR 404: COFFEE NOT FOUND! ☕🚫", "WILL CODE FOR CAFFEINE! 💻☕",
            "UNLOCKED: SUPPORTER BADGE! 🏅", "YOUR LUCK JUST INCREASED! (maybe) 🍀",
            "FORGE EFFICIENCY +5% 🔨", "DEV FOCUS MODE: ACTIVATED! 🧘",
            "THE ANVIL IS COLD! HEAT IT UP! 🔥", "BUY A BEAN, SAVE A DEV! 🫘",
            "MAY YOUR DROPS BE LEGENDARY! 💎", "SHARPEN THE DEV'S TOOLS! ⚔️"
        ];
        return tooltips[Math.floor(Math.random() * tooltips.length)];
    }, []);

    useEffect(() => {
        // Track visit frequency
        const visitCount = parseInt(localStorage.getItem('fm_visit_count') || '0') + 1;
        localStorage.setItem('fm_visit_count', visitCount.toString());

        const lastToastTime = parseInt(localStorage.getItem('fm_last_toast_time') || '0');
        const now = Date.now();
        const oneHour = 60 * 60 * 1000;

        const userName = profile.name || 'Forge Master';
        const messages = FRIENDLY_MESSAGES(userName, !!profile.name);

        // Show toast if frequent visitor (every 3rd session/refresh) and it's been an hour
        if (visitCount > 1 && visitCount % 3 === 0 && (now - lastToastTime) > oneHour) {
            const randomMsg = messages[Math.floor(Math.random() * messages.length)];

            setTimeout(() => {
                toast(
                    <div className="flex flex-col gap-0.5 select-none">
                        <div className="font-black text-[10px] uppercase tracking-widest text-[#FFDD00] flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#FFDD00] animate-pulse" />
                            Support the Forge
                        </div>
                        <div className="font-bold text-sm leading-tight text-white">
                            {randomMsg}
                        </div>
                        <div className="text-[9px] mt-1 font-black uppercase text-white/40 flex items-center gap-1">
                            Click to support the developer <span className="animate-bounce text-xs">☕❤️</span>
                        </div>
                    </div>,
                    {
                        icon: <div className="text-xl">🛠️</div>,
                        autoClose: 10000,
                        position: "bottom-left",
                        onClick: () => window.open('https://www.buymeacoffee.com/1vcian', '_blank'),
                        className: "!bg-bg-secondary/90 !backdrop-blur-md !text-white border border-[#FFDD00]/30 shadow-[0_8px_32px_rgba(0,0,0,0.5)] cursor-pointer hover:border-[#FFDD00]/60 transition-all font-sans rounded-2xl",
                        progressClassName: "!bg-[#FFDD00]"
                    }
                );
                localStorage.setItem('fm_last_toast_time', now.toString());
            }, 5000);
        }

        // Expose test function to window for the user
        (window as any).__triggerTestToast = () => {
            const randomMsg = messages[Math.floor(Math.random() * messages.length)];
            toast(
                <div className="flex flex-col gap-0.5 select-none">
                    <div className="font-black text-[10px] uppercase tracking-widest text-[#FFDD00] flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#FFDD00] animate-pulse" />
                        Support the Forge
                    </div>
                    <div className="font-bold text-sm leading-tight text-white">
                        {randomMsg}
                    </div>
                    <div className="text-[9px] mt-1 font-black uppercase text-white/40 flex items-center gap-1">
                        Click to support the developer <span className="animate-bounce text-xs">☕❤️</span>
                    </div>
                </div>,
                {
                    icon: <div className="text-xl">🛠️</div>,
                    autoClose: 10000,
                    position: "bottom-left",
                    onClick: () => window.open('https://www.buymeacoffee.com/1vcian', '_blank'),
                    className: "!bg-bg-secondary/90 !backdrop-blur-md !text-white border border-[#FFDD00]/30 shadow-[0_8px_32px_rgba(0,0,0,0.5)] cursor-pointer hover:border-[#FFDD00]/60 transition-all font-sans rounded-2xl",
                    progressClassName: "!bg-[#FFDD00]"
                }
            );
        };

        return () => {
            delete (window as any).__triggerTestToast;
        };
    }, [profile.name]);

    const CoffeeFountain = () => (
        <div className="absolute inset-0 pointer-events-none overflow-visible">
            {Array.from({ length: 5 }).map((_, i) => (
                <motion.span
                    key={i}
                    initial={{ opacity: 0, scale: 0.5, x: 0, y: 0 }}
                    animate={{
                        opacity: [0, 1, 1, 0],
                        scale: [0.5, 1.2, 0.8],
                        x: (i % 2 === 0 ? 1 : -1) * (Math.random() * 30 + 15),
                        y: -(Math.random() * 80 + 40),
                    }}
                    transition={{
                        duration: 1,
                        repeat: Infinity,
                        delay: i * 0.15,
                    }}
                    className="absolute left-1/2 top-1/2 text-lg"
                >
                    {i % 2 === 0 ? '☕' : '🔥'}
                </motion.span>
            ))}
        </div>
    );

    return (
        <div className="flex h-screen bg-bg-primary text-text-primary overflow-hidden font-sans text-left">
            {/* Hover zone to open sidebar (disabled while pinned) */}
            {!isSidebarPinned && (
                <div
                    className="fixed top-0 left-0 bottom-0 w-4 z-[45] group cursor-pointer"
                    onMouseEnter={() => setIsSidebarOpen(true)}
                >
                    <div className="h-full w-full group-hover:bg-accent-primary/5 transition-colors" />
                </div>
            )}

            {/* Sidebar Navigation */}
            <Sidebar
                isOpen={isSidebarVisible}
                onClose={() => { if (!isSidebarPinned) setIsSidebarOpen(false); }}
                isPinned={isSidebarPinned}
                onTogglePin={() => setIsSidebarPinned(prev => !prev)}
            />

            {/* Main Content Area */}
            <div className={cn(
                "flex-1 flex flex-col h-full overflow-hidden relative transition-all duration-500 ease-in-out",
                isStatsOpen && "lg:pr-[450px]",
                isSidebarPinned && "lg:ml-64"
            )}>
                {/* Header */}
                <Header
                    onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)}
                    onStatsToggle={() => setIsStatsOpen(!isStatsOpen)}
                />

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar pb-20">
                    <Outlet />

                    {/* Footer */}
                    <footer className="mt-12 py-6 border-t border-border text-center text-text-muted text-sm">
                        <div className="flex flex-col gap-2 items-center justify-center">
                            <p>Forge Master Calculator &copy; {new Date().getFullYear()}</p>
                            <div className="flex items-center justify-center gap-4">
                                <a
                                    href="https://1vcian.me"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1.5 text-accent-primary hover:text-accent-secondary transition-colors"
                                >
                                    Visit My Website <ExternalLink className="w-3 h-3" />
                                </a>
                                <span className="text-border">|</span>
                                <a
                                    href="https://github.com/1vcian/fm"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1.5 text-text-secondary hover:text-white transition-colors"
                                >
                                    GitHub <Github className="w-3 h-3" />
                                </a>
                            </div>
                            {selectedVersion && (
                                <div className="mt-2 text-xs opacity-70">
                                    Data Version: {formatVersion(selectedVersion)}
                                </div>
                            )}
                        </div>
                    </footer>
                </main>

                {/* Stats Drawer */}
                <div
                    className={cn(
                        "fixed inset-0 bg-black/60 backdrop-blur-md z-[60] transition-opacity duration-300 lg:hidden",
                        isStatsOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                    )}
                    onClick={() => setIsStatsOpen(false)}
                />
                <div
                    className={cn(
                        "fixed top-0 right-0 bottom-0 w-full sm:w-[450px] bg-bg-primary border-l border-border z-[70] transition-transform duration-500 ease-out shadow-2xl",
                        isStatsOpen ? "translate-x-0" : "translate-x-full"
                    )}
                >
                    <div className="h-full flex flex-col overflow-hidden">
                        <StatsSummaryPanel onClose={() => setIsStatsOpen(false)} />
                    </div>
                </div>

                {/* Buy Me A Coffee - Fixed Floating Button */}
                <motion.a
                    href="https://www.buymeacoffee.com/1vcian"
                    target="_blank"
                    rel="noopener noreferrer"
                    onMouseEnter={() => setIsHoveringCoffee(true)}
                    onMouseLeave={() => setIsHoveringCoffee(false)}
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    layout
                    className={cn(
                        "fixed bottom-8 right-8 z-[100] group flex items-center gap-3 py-3 md:py-4 rounded-full overflow-visible transition-all duration-300",
                        maxAgeVisuals.bg,
                        isSidebarVisible ? "px-3 md:px-4" : "px-5 md:px-6",
                        "shadow-[0_8px_25px_-5px_rgba(0,0,0,0.4)] hover:shadow-[0_12px_35px_-5px_rgba(0,0,0,0.6)]"
                    )}
                >
                    <div 
                        className={cn(maxAgeVisuals.anim, "rounded-full")} 
                        style={{ '--theme-url': `url(${import.meta.env.BASE_URL}Texture2D/${selectedVersion ? `${selectedVersion}/` : ''}${maxAgeVisuals.texture})` } as React.CSSProperties} 
                    >
                        {maxAgeVisuals.id === 'quantum' && Array.from({ length: 8 }).map((_, i) => (
                            <span key={i} />
                        ))}
                    </div>

                    <AnimatePresence>
                        {isHoveringCoffee && (
                            <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.8 }}
                                animate={{ opacity: 1, y: -50, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.8 }}
                                className="absolute bottom-full right-0 mb-4 bg-white text-black px-4 py-2 rounded-2xl shadow-xl text-xs whitespace-nowrap font-black border-2 border-[#FFDD00] origin-bottom-right"
                            >
                                {donationTooltip}
                                <div className="absolute top-full right-6 -mt-1 w-3 h-3 bg-white border-r-2 border-b-2 border-[#FFDD00] rotate-45" />
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {isHoveringCoffee && <CoffeeFountain />}

                    <div className="relative flex items-center gap-2.5 z-10">
                        <Coffee className="w-6 h-6 group-hover:rotate-[15deg] transition-transform duration-300 text-white icon-stroke-sm shrink-0" />
                        <AnimatePresence mode="wait">
                            {!isSidebarVisible && (
                                <motion.span 
                                    initial={{ width: 0, opacity: 0, x: -10 }}
                                    animate={{ width: "auto", opacity: 1, x: 0 }}
                                    exit={{ width: 0, opacity: 0, x: -10 }}
                                    transition={{ duration: 0.2 }}
                                    className="text-sm md:text-base tracking-tight uppercase font-black text-white text-stroke-sm whitespace-nowrap overflow-hidden"
                                >
                                    {donationLabel}
                                </motion.span>
                            )}
                        </AnimatePresence>
                    </div>
                </motion.a>
            </div>
        </div>
    );
}
