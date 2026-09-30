import React from 'react';
import { ExternalLink, Bot, Megaphone, Sparkles, Zap, MousePointerClick, Tag, Clock } from 'lucide-react';
import { Listing } from '../types';
import { soundFX } from '../utils/audio';

interface LeaderboardTableProps {
  listings: Listing[];
  onOutbidListing: (listing: Listing) => void;
  onListingClick: (listing: Listing) => void;
  isTodayView?: boolean;
}

export const LeaderboardTable: React.FC<LeaderboardTableProps> = ({
  listings,
  onOutbidListing,
  onListingClick,
  isTodayView = false,
}) => {
  if (listings.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-8">
        <div className="rounded-[24px] bg-[#fef4ee] border border-[#f8e5da] p-8 text-center shadow-xs">
          <div className="w-12 h-12 rounded-full bg-white border border-[#f5ded2] text-[#e05638] flex items-center justify-center mx-auto mb-3 shadow-xs">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-[#1c1917] mb-1">
            No listings yet
          </h3>
          <p className="text-xs text-[#78716c] max-w-sm mx-auto leading-relaxed">
            The leaderboard is completely open. Enter your website URL or @handle above to claim the #1 spot!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 pb-16 space-y-3.5">
      {listings.map((item, index) => {
        const rank = index + 1;
        const bidAmount = isTodayView ? item.todayBid : item.bid;

        // Choose a suitable clean icon matching outbid.lol monoline icons
        const renderIcon = () => {
          if (item.category === 'AI & Agents') return <Bot className="w-6 h-6 text-[#e05638]" />;
          if (item.category === 'Marketing & SEO') return <Megaphone className="w-6 h-6 text-[#e05638]" />;
          return <Sparkles className="w-6 h-6 text-[#e05638]" />;
        };

        // Format clean domain display
        let domain = item.url.replace(/^https?:\/\//, '').replace(/\/$/, '');
        if (domain.includes('/')) domain = domain.split('/')[0];

        return (
          <div
            key={item.id}
            className="rounded-[24px] bg-[#fef4ee] border border-[#f8e5da] p-4 sm:p-5 shadow-xs transition-all hover:border-[#ebd2c3] group"
          >
            <div className="flex items-start gap-3.5">
              {/* Left icon with clean outline style */}
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-white/90 border border-[#f5ded2] flex items-center justify-center shrink-0 shadow-xs">
                {renderIcon()}
              </div>

              {/* Center / Right content */}
              <div className="flex-1 min-w-0">
                {/* Header row: #Rank, Name, and $Price */}
                <div className="flex items-baseline justify-between gap-2">
                  <div className="flex items-baseline gap-1.5 truncate">
                    <span className="font-extrabold text-[#e05638] text-base shrink-0">
                      #{rank}
                    </span>
                    <a
                      href={item.url.startsWith('http') ? item.url : `https://${item.url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => onListingClick(item)}
                      className="font-bold text-[#1c1917] hover:text-[#e05638] transition-colors truncate text-sm sm:text-base"
                    >
                      {item.name}
                    </a>
                  </div>

                  {/* Price in bold terracotta */}
                  <span className="font-black text-[#e05638] font-mono text-base sm:text-lg shrink-0">
                    ${bidAmount.toLocaleString()}
                  </span>
                </div>

                {/* Subtitle / pitch */}
                <p className="text-xs text-[#78716c] line-clamp-2 mt-0.5 leading-relaxed font-normal">
                  {item.tagline}
                </p>

                {/* Metadata footer row matching screenshot */}
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-2.5 text-[11px] text-[#78716c]">
                  <span className="inline-flex items-center gap-1 font-medium text-[#57534e]">
                    <Tag className="w-3 h-3 text-[#a8a29e]" />
                    {item.category.replace(' & Agents', '').replace(' & SEO', '')}
                  </span>

                  <span className="text-[#d6c7be]">·</span>

                  <span>just now</span>

                  <span className="text-[#d6c7be]">·</span>

                  <a
                    href={item.url.startsWith('http') ? item.url : `https://${item.url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => onListingClick(item)}
                    className="hover:text-[#1c1917] underline decoration-[#d6c7be] hover:decoration-[#1c1917]"
                  >
                    {domain}
                  </a>

                  <span className="text-[#d6c7be]">·</span>

                  <span className="font-mono text-[#57534e]">
                    {item.clicks.toLocaleString()} clicks
                  </span>

                  <span className="text-[#d6c7be]">·</span>

                  <button
                    onClick={() => {
                      soundFX.playClick();
                      onOutbidListing(item);
                    }}
                    className="text-[#e05638] hover:text-[#c44125] font-semibold cursor-pointer underline decoration-[#e05638]/40 hover:decoration-[#e05638]"
                  >
                    outbid
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
