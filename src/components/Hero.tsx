import React, { useState, useEffect } from 'react';
import { Globe, Minus, Plus, Trophy, Flame, LayoutGrid, Compass, TrendingUp, MousePointerClick, Clock, Sparkles } from 'lucide-react';
import { soundFX } from '../utils/audio';

interface HeroProps {
  topListingBid: number;
  totalVolume: number;
  totalClicks: number;
  totalListingsCount: number;
  onlineCount: number;
  timeframe: 'all' | 'today';
  onChangeTimeframe: (tf: 'all' | 'today') => void;
  onQuickClaim: (urlOrHandle: string, bidAmount: number) => void;
  activeNavTab: string;
  setActiveNavTab: (tab: string) => void;
}

export const Hero: React.FC<HeroProps> = ({
  topListingBid,
  totalVolume,
  totalClicks,
  totalListingsCount,
  onlineCount,
  timeframe,
  onChangeTimeframe,
  onQuickClaim,
  activeNavTab,
  setActiveNavTab,
}) => {
  const initialBid = topListingBid > 0 ? topListingBid + 1 : 1;
  const [bidAmount, setBidAmount] = useState<number>(initialBid);
  const [urlInput, setUrlInput] = useState('');

  // Daily UTC countdown
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const utcNow = new Date(now.toUTCString().slice(0, -4));
      const nextUtcMidnight = new Date(utcNow);
      nextUtcMidnight.setUTCHours(24, 0, 0, 0);

      const diff = Math.max(0, nextUtcMidnight.getTime() - utcNow.getTime());
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ hours, minutes, seconds });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  const format2 = (n: number) => n.toString().padStart(2, '0');

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
      {/* 1. Nav Filter Capsule: [ All | Leaderboards | Explore ] */}
      <div className="w-full max-w-sm flex items-center justify-between p-1 rounded-full bg-[#f3eae4] border border-[#ebdcd4] text-xs font-semibold mb-4 shadow-xs">
        <button
          onClick={() => {
            soundFX.playClick();
            setActiveNavTab('all');
          }}
          className={`flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-full transition-all cursor-pointer ${
            activeNavTab === 'all'
              ? 'bg-[#e05638] text-white shadow-xs'
              : 'text-[#78716c] hover:text-[#1c1917]'
          }`}
        >
          <LayoutGrid className="w-3.5 h-3.5" />
          <span>All</span>
        </button>

        <button
          onClick={() => {
            soundFX.playClick();
            setActiveNavTab('leaderboards');
          }}
          className={`flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-full transition-all cursor-pointer ${
            activeNavTab === 'leaderboards'
              ? 'bg-[#e05638] text-white shadow-xs'
              : 'text-[#78716c] hover:text-[#1c1917]'
          }`}
        >
          <Trophy className="w-3.5 h-3.5" />
          <span>Leaderboards</span>
        </button>

        <button
          onClick={() => {
            soundFX.playClick();
            setActiveNavTab('explore');
          }}
          className={`flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-full transition-all cursor-pointer ${
            activeNavTab === 'explore'
              ? 'bg-[#e05638] text-white shadow-xs'
              : 'text-[#78716c] hover:text-[#1c1917]'
          }`}
        >
          <Compass className="w-3.5 h-3.5" />
          <span>Explore</span>
        </button>
      </div>

      {/* 2. Live Visitors Pill */}
      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#fbf7f4] border border-[#ebdcd4] text-xs text-[#57534e] font-medium mb-3.5 shadow-xs">
        <span className="flex h-2 w-2 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <span className="font-bold text-emerald-600">{onlineCount} online</span>
        <span className="text-[#a8a29e]">·</span>
        <span>1,894 visitors today</span>
        <span className="text-[#a8a29e]">·</span>
        <span className="text-[#78716c] hover:text-[#e05638] cursor-pointer">stats→</span>
      </div>

      {/* 3. Timeframe Toggle: [ 🏆 All-time | 🔴 Today ] */}
      <div className="inline-flex items-center p-1 rounded-full bg-[#f3eae4] border border-[#ebdcd4] text-xs font-semibold mb-5 shadow-xs">
        <button
          onClick={() => {
            soundFX.playClick();
            onChangeTimeframe('all');
          }}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full transition-all cursor-pointer ${
            timeframe === 'all'
              ? 'bg-[#e05638] text-white shadow-xs'
              : 'text-[#78716c] hover:text-[#1c1917]'
          }`}
        >
          <Trophy className="w-3.5 h-3.5" />
          <span>All-time</span>
        </button>

        <button
          onClick={() => {
            soundFX.playClick();
            onChangeTimeframe('today');
          }}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full transition-all cursor-pointer ${
            timeframe === 'today'
              ? 'bg-[#e05638] text-white shadow-xs'
              : 'text-[#78716c] hover:text-[#1c1917]'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-[#e05638]"></span>
          <span>Today</span>
        </button>
      </div>

      {/* 4. Claim #1 for [-] $Amount [+] */}
      <div className="flex items-center justify-center gap-2 mb-4 flex-wrap">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#1c1917] tracking-tight">
          Claim #1 for
        </h1>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDecrement}
            className="w-7 h-7 rounded-full bg-[#fde9df] hover:bg-[#fbdcd0] text-[#e05638] font-black flex items-center justify-center active:scale-90 transition-all cursor-pointer"
            title="Decrease bid"
          >
            <Minus className="w-3.5 h-3.5 stroke-[3]" />
          </button>

          <span className="text-3xl sm:text-4xl font-black text-[#e05638] font-mono tracking-tight">
            ${bidAmount.toLocaleString()}
          </span>

          <button
            type="button"
            onClick={handleIncrement}
            className="w-7 h-7 rounded-full bg-[#fde9df] hover:bg-[#fbdcd0] text-[#e05638] font-black flex items-center justify-center active:scale-90 transition-all cursor-pointer"
            title="Increase bid"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
          </button>
        </div>
      </div>

      {/* 5. Input Form & Claim Button */}
      <form onSubmit={handleClaim} className="w-full space-y-3 mb-6">
        <div className="relative w-full">
          <Globe className="w-5 h-5 text-[#a8a29e] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            required
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="Your product URL or @handle"
            className="w-full pl-12 pr-4 py-3.5 rounded-full bg-white border border-[#e5d5cc] text-[#1c1917] placeholder-[#a8a29e] text-sm sm:text-base focus:outline-none focus:border-[#e05638] shadow-xs transition-colors"
          />
        </div>

        <button
          type="submit"
          className="w-full py-3.5 px-6 rounded-full bg-[#f08b70] hover:bg-[#e05638] text-white font-bold text-base transition-all active:scale-[0.99] shadow-md shadow-[#e05638]/20 cursor-pointer flex items-center justify-center"
        >
          Claim rank
        </button>
      </form>

      {/* 6. Graphics & Statistics Cards Grid */}
      <div className="w-full grid grid-cols-2 sm:grid-cols-4 gap-2 text-left">
        <div className="p-3 rounded-2xl bg-[#fef4ee] border border-[#f8e5da] shadow-xs">
          <div className="flex items-center gap-1.5 text-[#78716c] text-[10px] font-bold uppercase tracking-wider mb-0.5">
            <Trophy className="w-3 h-3 text-[#e05638]" />
            <span>Top #1 Spot</span>
          </div>
          <div className="text-base font-bold font-mono text-[#e05638]">
            ${topListingBid.toLocaleString()}
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-[#fef4ee] border border-[#f8e5da] shadow-xs">
          <div className="flex items-center gap-1.5 text-[#78716c] text-[10px] font-bold uppercase tracking-wider mb-0.5">
            <TrendingUp className="w-3 h-3 text-emerald-600" />
            <span>Total Volume</span>
          </div>
          <div className="text-base font-bold font-mono text-emerald-700">
            ${totalVolume.toLocaleString()}
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-[#fef4ee] border border-[#f8e5da] shadow-xs">
          <div className="flex items-center gap-1.5 text-[#78716c] text-[10px] font-bold uppercase tracking-wider mb-0.5">
            <MousePointerClick className="w-3 h-3 text-sky-600" />
            <span>Direct Clicks</span>
          </div>
          <div className="text-base font-bold font-mono text-sky-800">
            {totalClicks.toLocaleString()}
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-[#fef4ee] border border-[#f8e5da] shadow-xs">
          <div className="flex items-center gap-1.5 text-[#78716c] text-[10px] font-bold uppercase tracking-wider mb-0.5">
            <Clock className="w-3 h-3 text-[#e05638]" />
            <span>24h Reset</span>
          </div>
          <div className="text-base font-bold font-mono text-[#e05638]">
            {format2(timeLeft.hours)}:{format2(timeLeft.minutes)}:{format2(timeLeft.seconds)}
          </div>
        </div>
      </div>
    </div>
  );
};
