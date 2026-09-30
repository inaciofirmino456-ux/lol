import React from 'react';
import { Flame, ArrowUpRight } from 'lucide-react';
import { ActivityEvent } from '../types';

interface LiveTickerProps {
  activities: ActivityEvent[];
  onSelectOutbid: (name: string, amount: number) => void;
}

export const LiveTicker: React.FC<LiveTickerProps> = ({ activities, onSelectOutbid }) => {
  if (!activities || activities.length === 0) return null;

  return (
    <div className="w-full bg-[#f6eee7] border-b border-[#ebdcd4] overflow-hidden py-2 select-none">
      <div className="max-w-2xl mx-auto px-4 flex items-center gap-3">
        <div className="flex items-center gap-1.5 shrink-0 px-2.5 py-0.5 rounded-full bg-[#fde9df] border border-[#f8d0bf] text-[#e05638] text-[11px] font-bold uppercase tracking-wider">
          <Flame className="w-3 h-3 fill-[#e05638] animate-pulse" />
          <span>Live Bids</span>
        </div>

        <div className="relative flex-1 overflow-x-auto scrollbar-none flex items-center gap-5 text-xs text-[#78716c] whitespace-nowrap">
          {activities.map((act) => (
            <div
              key={act.id}
              className="inline-flex items-center gap-1.5 group cursor-pointer hover:text-[#1c1917] transition-colors"
              onClick={() => onSelectOutbid(act.text.split(' ')[0] || '', act.amount)}
            >
              <span className="text-[#a8a29e] font-mono text-[11px]">{act.timestamp}</span>
              <span className="text-[#57534e] font-medium">
                {act.type === 'outbid' && <span className="text-[#e05638] mr-1 font-bold">↑ Outbid:</span>}
                {act.type === 'raise' && <span className="text-emerald-700 mr-1 font-bold">▲ Raised:</span>}
                {act.type === 'new' && <span className="text-sky-700 mr-1 font-bold">★ New:</span>}
                {act.text}
              </span>
              <span className="text-[#e05638] font-mono font-bold bg-[#fbf5f0] px-1.5 py-0.5 rounded border border-[#ebdcd4] text-[11px]">
                ${act.amount.toLocaleString()}
              </span>
              <ArrowUpRight className="w-3 h-3 text-[#a8a29e] group-hover:text-[#e05638] transition-colors" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
