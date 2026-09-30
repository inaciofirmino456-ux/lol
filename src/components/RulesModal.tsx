import React from 'react';
import { X, Check, AlertTriangle, ShieldCheck, DollarSign, ExternalLink, HelpCircle } from 'lucide-react';
import { soundFX } from '../utils/audio';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-[28px] bg-[#fffcf9] border border-[#ebdcd4] shadow-2xl overflow-hidden my-8 text-[#1c1917]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#f3eae4] bg-[#fbf6f2]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#fde9df] text-[#e05638] flex items-center justify-center font-bold">
              <HelpCircle className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#1c1917]">How topbid Works & Rules</h2>
              <p className="text-xs text-[#78716c]">Transparent ranking. Pay more, rank higher.</p>
            </div>
          </div>

          <button
            onClick={() => {
              soundFX.playClick();
              onClose();
            }}
            className="p-1.5 rounded-full text-[#78716c] hover:text-[#1c1917] hover:bg-[#f3eae4] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-xs sm:text-sm text-[#57534e] max-h-[75vh] overflow-y-auto">
          {/* Core premise */}
          <div className="p-4 rounded-2xl bg-[#fef4ee] border border-[#f8e5da]">
            <h3 className="font-bold text-[#1c1917] text-sm mb-1">Rank is what you pay</h3>
            <p className="text-xs text-[#78716c] leading-relaxed">
              topbid is a public leaderboard where rankings are decided exclusively by cumulative money paid. 
              Higher bid = higher rank. No hidden algorithms, no black-box rankings, no ads.
            </p>
          </div>

          {/* Rules list */}
          <div className="space-y-2.5">
            <div className="flex items-start gap-3 p-3 rounded-xl bg-white border border-[#ebdcd4]">
              <DollarSign className="w-4 h-4 text-[#e05638] shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-[#1c1917] block text-xs mb-0.5">Bidding Thresholds</span>
                <span className="text-xs text-[#78716c]">
                  Minimum bid to get listed is $1. To claim the #1 spot, your bid must be higher than the current leader.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-white border border-[#ebdcd4]">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-[#1c1917] block text-xs mb-0.5">Only Pay the Difference</span>
                <span className="text-xs text-neutral-500">
                  If someone outbids you, reclaim your rank by simply paying the difference between your previous bid and the new bid.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-white border border-[#ebdcd4]">
              <ExternalLink className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-[#1c1917] block text-xs mb-0.5">Direct Raw Clicks</span>
                <span className="text-xs text-neutral-500">
                  All clicks are direct visits to your site or profile with tracking parameters stripped for a pure directory.
                </span>
              </div>
            </div>
          </div>

          {/* Permitted and Prohibited */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
              <span className="text-emerald-800 font-bold text-xs block mb-1">Permitted</span>
              <ul className="text-[11px] text-emerald-700 space-y-0.5 list-disc list-inside">
                <li>Products & SaaS</li>
                <li>X (@handles)</li>
                <li>Developer tools</li>
                <li>Portfolios & Apps</li>
              </ul>
            </div>

            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200">
              <span className="text-rose-800 font-bold text-xs block mb-1">Prohibited</span>
              <ul className="text-[11px] text-rose-700 space-y-0.5 list-disc list-inside">
                <li>Group invite chats</li>
                <li>Adult / NSFW</li>
                <li>Shortener links</li>
                <li>Malware / Scams</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-[#f3eae4] bg-[#fbf6f2] flex justify-end">
          <button
            onClick={() => {
              soundFX.playClick();
              onClose();
            }}
            className="px-5 py-2 rounded-full bg-[#e05638] text-white text-xs font-bold shadow-xs hover:bg-[#c44125] transition-colors cursor-pointer"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
