import React from 'react';
import { Search, Moon, Sun, Volume2, VolumeX, HelpCircle, Plus } from 'lucide-react';
import { soundFX } from '../utils/audio';

interface HeaderProps {
  darkMode: boolean;
  onToggleTheme: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onOpenRules: () => void;
  onOpenSubmit: () => void;
  onOpenDaily: () => void;
  onOpenCategories: () => void;
  onOpenSearch: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  darkMode,
  onToggleTheme,
  soundEnabled,
  onToggleSound,
  onOpenRules,
  onOpenSubmit,
  onOpenDaily,
  onOpenCategories,
  onOpenSearch,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full bg-[#faf6f3]/90 backdrop-blur-md border-b border-[#ebdcd4]">
      <div className="max-w-2xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
        {/* Stepped Logo as in screenshot */}
        <div className="flex items-center gap-3">
          <a
            href="/"
            className="flex items-center gap-2.5 group"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            {/* The 3 stepped bars logo from outbid.lol */}
            <div className="flex flex-col gap-1 items-start justify-center py-1">
              <span className="w-4 h-1.5 rounded-full bg-[#e05638] transition-all group-hover:w-5"></span>
              <span className="w-6 h-1.5 rounded-full bg-[#1c1917] transition-all group-hover:w-6"></span>
              <span className="w-8 h-1.5 rounded-full bg-[#1c1917] transition-all group-hover:w-7"></span>
            </div>
            <span className="text-xl font-black tracking-tight text-[#1c1917]">
              top<span className="text-[#e05638]">bid</span>
            </span>
          </a>
        </div>

        {/* Navigation links matching screenshot */}
        <div className="flex items-center gap-4 text-xs font-semibold text-[#57534e]">
          {/* Online status stays visible; no fabricated visitor count. */}
          <div className="hidden sm:flex items-center gap-1.5 uppercase tracking-wider text-[10px] font-bold text-[#57534e]" title="Online">
            <span className="w-2 h-2 rounded-full bg-emerald-500" aria-hidden="true"></span>
            <span>Online</span>
          </div>
          <button
            onClick={onOpenDaily}
            className="hover:text-[#1c1917] transition-colors cursor-pointer"
          >
            Daily
          </button>
          <button
            onClick={onOpenCategories}
            className="hover:text-[#1c1917] transition-colors cursor-pointer"
          >
            Categories
          </button>
          <button
            onClick={onOpenRules}
            className="hover:text-[#1c1917] transition-colors cursor-pointer"
          >
            About
          </button>

          {/* Sound Toggle */}
          <button
            onClick={() => {
              onToggleSound();
              soundFX.playClick();
            }}
            title={soundEnabled ? 'Mute sound effects' : 'Enable sound effects'}
            className="p-1 text-[#78716c] hover:text-[#1c1917] transition-colors cursor-pointer"
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-[#e05638]" />
            ) : (
              <VolumeX className="w-4 h-4 text-[#a8a29e]" />
            )}
          </button>

          {/* Search trigger */}
          <button
            onClick={onOpenSearch}
            className="p-1 text-[#78716c] hover:text-[#1c1917] transition-colors cursor-pointer"
            title="Search"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Rules/Theme toggle */}
          <button
            onClick={() => {
              soundFX.playClick();
              onToggleTheme();
            }}
            className="p-1 text-[#78716c] hover:text-[#1c1917] transition-colors cursor-pointer"
            title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {darkMode ? <Sun className="w-4 h-4 text-[#e05638]" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </header>
  );
};
