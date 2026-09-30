import React from 'react';
import { RotateCcw, ShieldCheck } from 'lucide-react';
import { soundFX } from '../utils/audio';

interface FooterProps {
  onResetData: () => void;
  onOpenRules: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onResetData, onOpenRules }) => {
  return (
    <footer className="w-full border-t border-[#ebdcd4] bg-[#f7f2ed] py-10 text-xs text-[#78716c]">
      <div className="max-w-xl mx-auto px-4 text-center space-y-4">
        <div className="flex items-center justify-center gap-2">
          {/* Stepped Logo */}
          <div className="flex flex-col gap-0.5 items-start justify-center">
            <span className="w-3 h-1 rounded-full bg-[#e05638]"></span>
            <span className="w-4 h-1 rounded-full bg-[#1c1917]"></span>
            <span className="w-5 h-1 rounded-full bg-[#1c1917]"></span>
          </div>
          <span className="text-base font-extrabold text-[#1c1917] tracking-tight">
            top<span className="text-[#e05638]">bid</span>
          </span>
        </div>

        <p className="text-xs text-[#78716c] max-w-sm mx-auto leading-relaxed">
          The public product leaderboard where rank is what you pay. Pay more, rank higher.
        </p>

        <div className="flex items-center justify-center gap-4 text-xs font-semibold text-[#57534e]">
          <button
            onClick={() => {
              soundFX.playClick();
              onOpenRules();
            }}
            className="hover:text-[#e05638] transition-colors cursor-pointer"
          >
            How it works
          </button>
          <span>·</span>
          <button
            onClick={() => {
              soundFX.playClick();
              onOpenRules();
            }}
            className="hover:text-[#e05638] transition-colors cursor-pointer"
          >
            Rules & FAQ
          </button>
          <span>·</span>
          <button
            onClick={() => {
              soundFX.playClick();
              if (window.confirm('Reset all listings to empty state?')) {
                onResetData();
              }
            }}
            className="hover:text-[#e05638] transition-colors cursor-pointer flex items-center gap-1"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        </div>

        <div className="pt-4 border-t border-[#ebdcd4]/70 text-[11px] text-[#a8a29e]">
          <p>© {new Date().getFullYear()} topbid · Rank is what you pay.</p>
        </div>
      </div>
    </footer>
  );
};
