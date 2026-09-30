import React from 'react';
import { Crown, Medal, ExternalLink, Zap, MousePointerClick } from 'lucide-react';
import { Listing } from '../types';
import { soundFX } from '../utils/audio';

interface TopPodiumProps {
  topThree: Listing[];
  onOutbidListing: (listing: Listing) => void;
  onListingClick: (listing: Listing) => void;
  isTodayView?: boolean;
}

export const TopPodium: React.FC<TopPodiumProps> = ({
  topThree,
  onOutbidListing,
  onListingClick,
  isTodayView = false,
}) => {
  if (topThree.length === 0) return null;

  const first = topThree[0];
  const second = topThree[1];
  const third = topThree[2];

  const getBid = (item: Listing) => (isTodayView ? item.todayBid : item.bid);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 mb-8">
      <div className={`grid gap-4 items-stretch ${
        topThree.length === 1 ? 'grid-cols-1 max-w-lg mx-auto' :
        topThree.length === 2 ? 'grid-cols-1 md:grid-cols-2 max-w-2xl mx-auto' :
        'grid-cols-1 md:grid-cols-3'
      }`}>
        {/* Spot #2 - Silver */}
        {second && (
          <div className="order-2 md:order-1 relative p-5 rounded-2xl bg-neutral-900/60 border border-neutral-700/60 backdrop-blur-md flex flex-col justify-between hover:border-neutral-500 transition-all group">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-neutral-800 border border-neutral-700 flex items-center justify-center text-2xl shadow-inner group-hover:scale-105 transition-transform">
                  {second.icon || '🚀'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-neutral-100 text-lg group-hover:text-white transition-colors">
                      {second.name}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] font-mono font-bold text-slate-300 bg-neutral-800 px-2 py-0.5 rounded-full border border-neutral-700">
                      <Medal className="w-3 h-3 text-slate-300" />
                      #2
                    </span>
                  </div>
                  <span className="text-[11px] text-neutral-400">{second.category}</span>
                </div>
              </div>

              <a
                href={second.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => onListingClick(second)}
                className="p-2 rounded-lg bg-neutral-800/80 hover:bg-neutral-700 text-neutral-400 hover:text-white transition-colors"
                title="Visit website"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>

            <p className="text-xs text-neutral-400 line-clamp-2 mb-4 leading-relaxed">
              {second.tagline}
            </p>

            <div className="pt-3 border-t border-neutral-800/80 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-neutral-500 uppercase font-mono block">Current Bid</span>
                <span className="text-xl font-bold font-mono text-slate-200">
                  ${getBid(second).toLocaleString()}
                </span>
                <div className="flex items-center gap-1 text-[11px] text-neutral-400 font-mono mt-0.5">
                  <MousePointerClick className="w-3 h-3 text-neutral-500" />
                  <span>{second.clicks.toLocaleString()} clicks</span>
                </div>
              </div>

              <button
                onClick={() => {
                  soundFX.playClick();
                  onOutbidListing(second);
                }}
                className="px-3.5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-100 font-semibold text-xs tracking-wide border border-neutral-700 hover:border-slate-400 transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>Outbid #2</span>
              </button>
            </div>
          </div>
        )}

        {/* Spot #1 - Gold Champion */}
        {first && (
          <div className="order-1 md:order-2 relative p-6 rounded-2xl bg-gradient-to-b from-amber-500/15 via-neutral-900/90 to-neutral-900/90 border-2 border-amber-500/50 shadow-2xl shadow-amber-500/15 backdrop-blur-md flex flex-col justify-between group hover:border-amber-400 transition-all">
            {/* Top crown badge */}
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-yellow-300 text-neutral-950 text-xs font-extrabold flex items-center gap-1.5 shadow-md shadow-amber-500/30 uppercase tracking-wider">
              <Crown className="w-3.5 h-3.5 fill-neutral-950" />
              <span>#1 Leader</span>
            </div>

            <div className="flex items-start justify-between gap-3 mb-3 mt-1">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-3xl shadow-lg shadow-amber-500/10 group-hover:scale-105 transition-transform">
                  {first.icon || '👑'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-white text-xl group-hover:text-amber-300 transition-colors">
                      {first.name}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-300 text-[11px] font-extrabold font-mono">
                      👑 KING
                    </span>
                  </div>
                  <span className="text-xs text-amber-300/80 font-medium">{first.category}</span>
                </div>
              </div>

              <a
                href={first.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => onListingClick(first)}
                className="p-2 rounded-lg bg-neutral-800/80 hover:bg-amber-400 hover:text-black text-neutral-300 transition-colors"
                title="Visit website"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>

            <p className="text-xs sm:text-sm text-neutral-300 line-clamp-2 mb-4 leading-relaxed font-normal">
              {first.tagline}
            </p>

            <div className="pt-3.5 border-t border-amber-500/20 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-amber-400/80 uppercase font-mono block font-bold">Top Bid</span>
                <span className="text-2xl font-black font-mono text-amber-400">
                  ${getBid(first).toLocaleString()}
                </span>
                <div className="flex items-center gap-1 text-[11px] text-neutral-400 font-mono mt-0.5">
                  <MousePointerClick className="w-3 h-3 text-amber-400" />
                  <span>{first.clicks.toLocaleString()} direct clicks</span>
                </div>
              </div>

              <button
                onClick={() => {
                  soundFX.playCashRegister();
                  onOutbidListing(first);
                }}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 hover:from-amber-300 hover:to-amber-400 text-neutral-950 font-extrabold text-xs sm:text-sm tracking-wide shadow-lg shadow-amber-500/30 active:scale-95 flex items-center gap-1.5 cursor-pointer"
              >
                <Zap className="w-4 h-4 fill-neutral-950 stroke-[2]" />
                <span>Outbid #1 (${(getBid(first) + 5).toLocaleString()})</span>
              </button>
            </div>
          </div>
        )}

        {/* Spot #3 - Bronze */}
        {third && (
          <div className="order-3 relative p-5 rounded-2xl bg-neutral-900/60 border border-neutral-700/60 backdrop-blur-md flex flex-col justify-between hover:border-neutral-500 transition-all group">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-neutral-800 border border-neutral-700 flex items-center justify-center text-2xl shadow-inner group-hover:scale-105 transition-transform">
                  {third.icon || '⚡'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-neutral-100 text-lg group-hover:text-white transition-colors">
                      {third.name}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] font-mono font-bold text-amber-600 bg-neutral-800 px-2 py-0.5 rounded-full border border-neutral-700">
                      <Medal className="w-3 h-3 text-amber-600" />
                      #3
                    </span>
                  </div>
                  <span className="text-[11px] text-neutral-400">{third.category}</span>
                </div>
              </div>

              <a
                href={third.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => onListingClick(third)}
                className="p-2 rounded-lg bg-neutral-800/80 hover:bg-neutral-700 text-neutral-400 hover:text-white transition-colors"
                title="Visit website"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>

            <p className="text-xs text-neutral-400 line-clamp-2 mb-4 leading-relaxed">
              {third.tagline}
            </p>

            <div className="pt-3 border-t border-neutral-800/80 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-neutral-500 uppercase font-mono block">Current Bid</span>
                <span className="text-xl font-bold font-mono text-amber-600/90">
                  ${getBid(third).toLocaleString()}
                </span>
                <div className="flex items-center gap-1 text-[11px] text-neutral-400 font-mono mt-0.5">
                  <MousePointerClick className="w-3 h-3 text-neutral-500" />
                  <span>{third.clicks.toLocaleString()} clicks</span>
                </div>
              </div>

              <button
                onClick={() => {
                  soundFX.playClick();
                  onOutbidListing(third);
                }}
                className="px-3.5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-100 font-semibold text-xs tracking-wide border border-neutral-700 hover:border-amber-600 transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>Outbid #3</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
