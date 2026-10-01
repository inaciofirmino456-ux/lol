import React, { useEffect, useState } from 'react';
import { Globe, Minus, Plus, Trophy, LayoutGrid, Compass, TrendingUp, MousePointerClick } from 'lucide-react';
import { soundFX } from '../utils/audio';
import { Category } from '../types';

interface HeroProps {
  topListingBid: number;
  totalVolume: number;
  totalClicks: number;
  totalListingsCount: number;
  timeframe: 'all' | 'today';
  onChangeTimeframe: (tf: 'all' | 'today') => void;
  onQuickClaim: (urlOrHandle: string, bidAmount: number) => void;
  selectedCategory: Category;
  onChangeCategory: (cat: Category) => void;
  activeNavTab: string;
  setActiveNavTab: (tab: string) => void;
  onOpenExplore: () => void;
}

export const Hero: React.FC<HeroProps> = ({
  topListingBid,
  totalVolume,
  totalClicks,
  selectedCategory,
  onChangeCategory,
  activeNavTab,
  setActiveNavTab,
  onQuickClaim,
  onOpenExplore,
}) => {
  const initialBid = topListingBid > 0 ? topListingBid + 1 : 1;
  const [bidAmount, setBidAmount] = useState<number>(initialBid);
  const [urlInput, setUrlInput] = useState('');

  useEffect(() => {
    setBidAmount(topListingBid > 0 ? topListingBid + 1 : 1);
  }, [topListingBid]);

  const handleIncrement = () => {
    soundFX.playClick();
    setBidAmount((prev) => prev + 1);
  };

  const handleDecrement = () => {
    soundFX.playClick();
    const minBid = topListingBid > 0 ? topListingBid + 1 : 1;
    setBidAmount((prev) => Math.max(minBid, prev - 1));
  };

  const handleClaim = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;
    onQuickClaim(urlInput.trim(), bidAmount);
  };

  return (
    <div className="max-w-xl mx-auto px-4 pt-4 pb-6 flex flex-col items-center text-center">
      <div className="w-full mb-4 flex items-center gap-2">
        <div className="min-w-0 flex-1 overflow-x-auto scrollbar-none touch-pan-x">
          <div className="flex w-max items-center gap-1 text-xs font-semibold">
            {[
              ['all', 'All'], ['leaderboards', 'Leaderboards'], ['marketing', 'Marketing & SEO'],
              ['developer', 'Developer Tools'], ['productivity', 'SaaS & Productivity'],
              ['design', 'Design & Creative'], ['crypto', 'Crypto & Web3'], ['other', 'Side Projects'],
            ].map(([id, label]) => (
              <button key={id} onClick={() => { soundFX.playClick(); setActiveNavTab(id); }}
                className={'shrink-0 px-3 py-1.5 rounded-full whitespace-nowrap transition-all cursor-pointer ' +
                  (activeNavTab === id ? 'bg-[#e05638] text-white shadow-xs' : 'text-[#78716c] hover:text-[#1c1917] hover:bg-[#f3eae4]')}>
                {label}
              </button>
            ))}
          </div>
        </div>
        <button type="button" onClick={() => { soundFX.playClick(); onOpenExplore(); }}
          className="shrink-0 px-3 py-1.5 rounded-full bg-[#f3eae4] border border-[#ebdcd4] text-[#57534e] text-xs font-semibold hover:text-[#1c1917] hover:bg-white transition-all cursor-pointer">
          Explore
        </button>
      </div>

      <div className="flex items-center justify-center gap-1.5 mb-4 text-[10px] font-bold uppercase tracking-[0.14em] text-[#57534e]">
        <span className="w-2 h-2 rounded-full bg-emerald-500" aria-hidden="true"></span>
        <span>Online</span>
      </div>

      <div className="flex items-center justify-center gap-2 mb-4 flex-wrap">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#1c1917] tracking-tight">Claim #1 for</h1>
        <div className="flex items-center gap-2">
          <button type="button" onClick={handleDecrement} className="w-7 h-7 rounded-full bg-[#fde9df] hover:bg-[#fbdcd0] text-[#e05638] font-black flex items-center justify-center active:scale-90 transition-all cursor-pointer">
            <Minus className="w-3.5 h-3.5 stroke-[3]" />
          </button>
          <span className="text-3xl sm:text-4xl font-black text-[#e05638] font-mono tracking-tight">${bidAmount.toLocaleString()}</span>
          <button type="button" onClick={handleIncrement} className="w-7 h-7 rounded-full bg-[#fde9df] hover:bg-[#fbdcd0] text-[#e05638] font-black flex items-center justify-center active:scale-90 transition-all cursor-pointer">
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
          </button>
        </div>
      </div>

      <form onSubmit={handleClaim} className="w-full space-y-3 mb-6">
        <div className="relative w-full">
          <Globe className="w-5 h-5 text-[#a8a29e] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input type="text" required value={urlInput} onChange={(e) => setUrlInput(e.target.value)} placeholder="Your product URL or @handle"
            className="w-full pl-12 pr-4 py-3.5 rounded-full bg-white border border-[#e5d5cc] text-[#1c1917] placeholder-[#a8a29e] text-sm sm:text-base focus:outline-none focus:border-[#e05638] shadow-xs transition-colors" />
        </div>
        <select value={selectedCategory} onChange={(e) => { soundFX.playClick(); onChangeCategory(e.target.value as Category); }}
          className="w-full px-4 py-3 rounded-full bg-white border border-[#e5d5cc] text-[#57534e] text-sm focus:outline-none focus:border-[#e05638] shadow-xs appearance-none">
          <option value="All">Choose a category</option>
          <option value="AI & Agents">AI & Agents</option>
          <option value="Marketing & SEO">Marketing & SEO</option>
          <option value="Developer Tools">Developer Tools</option>
          <option value="SaaS & Productivity">SaaS & Productivity</option>
          <option value="Design & Creative">Design & Creative</option>
          <option value="X / Twitter Profiles">X / Twitter Profiles</option>
          <option value="Crypto & Web3">Crypto & Web3</option>
          <option value="Side Projects">Side Projects</option>
        </select>
        <button type="submit" className="w-full py-3.5 px-6 rounded-full bg-[#f08b70] hover:bg-[#e05638] text-white font-bold text-base transition-all active:scale-[0.99] shadow-md shadow-[#e05638]/20 cursor-pointer flex items-center justify-center">
          Claim rank
        </button>
      </form>

      <div className="w-full grid grid-cols-2 sm:grid-cols-3 gap-2 text-left">
        <div className="p-3 rounded-2xl bg-[#fef4ee] border border-[#f8e5da] shadow-xs">
          <div className="flex items-center gap-1.5 text-[#78716c] text-[10px] font-bold uppercase tracking-wider mb-0.5"><Trophy className="w-3 h-3 text-[#e05638]" /><span>Top #1 Spot</span></div>
          <div className="text-base font-bold font-mono text-[#e05638]">${topListingBid.toLocaleString()}</div>
        </div>
        <div className="p-3 rounded-2xl bg-[#fef4ee] border border-[#f8e5da] shadow-xs">
          <div className="flex items-center gap-1.5 text-[#78716c] text-[10px] font-bold uppercase tracking-wider mb-0.5"><TrendingUp className="w-3 h-3 text-emerald-600" /><span>Total Volume</span></div>
          <div className="text-base font-bold font-mono text-emerald-700">${totalVolume.toLocaleString()}</div>
        </div>
        <div className="p-3 rounded-2xl bg-[#fef4ee] border border-[#f8e5da] shadow-xs">
          <div className="flex items-center gap-1.5 text-[#78716c] text-[10px] font-bold uppercase tracking-wider mb-0.5"><MousePointerClick className="w-3 h-3 text-sky-600" /><span>Direct Clicks</span></div>
          <div className="text-base font-bold font-mono text-sky-800">{totalClicks.toLocaleString()}</div>
        </div>
      </div>
    </div>
  );
};
