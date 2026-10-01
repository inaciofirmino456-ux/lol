import React, { useState, useEffect } from 'react';
import { X, Zap, ArrowRight, CheckCircle2, CreditCard, Globe } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Category, Listing } from '../types';
import { WalletPaymentButton } from './WalletPaymentButton';
import { soundFX } from '../utils/audio';

interface OutbidModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetListing: Listing | null;
  currentListings: Listing[];
  categories: Category[];
  onSuccessfulBid: (newListing: Partial<Listing>, bidAmount: number, isExistingId?: string) => void;
  initialUrl?: string;
  initialBid?: number;
}

export const OutbidModal: React.FC<OutbidModalProps> = ({
  isOpen,
  onClose,
  targetListing,
  currentListings,
  categories,
  onSuccessfulBid,
  initialUrl = '',
  initialBid,
}) => {
  const [url, setUrl] = useState('');
  const [name, setName] = useState('');
  const [tagline, setTagline] = useState('');
  const [category, setCategory] = useState<Category>('Developer Tools');
  const [icon, setIcon] = useState('⚡');
  const [bidAmount, setBidAmount] = useState<number>(10);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Top listing bid
  const topBid = currentListings.length > 0 ? Math.max(...currentListings.map(l => l.bid)) : 0;

  useEffect(() => {
    if (targetListing) {
      setUrl(targetListing.url);
      setName(targetListing.name);
      setTagline(targetListing.tagline);
      setCategory(targetListing.category);
      setIcon(targetListing.icon || '⚡');
      setBidAmount(targetListing.bid + 5);
    } else {
      setUrl(initialUrl || '');
      // Try extract name from initialUrl
      if (initialUrl) {
        handleUrlChange(initialUrl);
      } else {
        setName('');
        setTagline('');
      }
      setCategory('Developer Tools');
      setIcon('🚀');
      const minRequired = topBid > 0 ? topBid + 1 : 1;
      setBidAmount(initialBid ? Math.max(minRequired, initialBid) : minRequired);
    }
    setIsSuccess(false);
    setIsProcessing(false);
  }, [targetListing, isOpen, initialUrl, initialBid]);

  const handleUrlChange = (val: string) => {
    setUrl(val);
    if (!targetListing && val.length > 2) {
      try {
        let clean = val.replace(/^https?:\/\//, '').replace(/\/$/, '');
        if (clean.startsWith('x.com/') || clean.startsWith('twitter.com/')) {
          const handle = '@' + clean.split('/')[1];
          if (!name) setName(handle);
          if (!tagline) setTagline('Creator and builder on X');
          setCategory('X / Twitter Profiles');
          setIcon('𝕏');
        } else if (clean.includes('.')) {
          const domainName = clean.split('.')[0];
          const capitalized = domainName.charAt(0).toUpperCase() + domainName.slice(1);
          if (!name) setName(capitalized);
        }
      } catch {
        // ignore parsing
      }
    }
  };

  const calculateEstimatedRank = (amount: number): number => {
    if (targetListing) {
      const otherBids = currentListings.filter(l => l.id !== targetListing.id).map(l => l.bid);
      const higherCount = otherBids.filter(b => b >= amount).length;
      return higherCount + 1;
    } else {
      const higherCount = currentListings.filter(l => l.bid >= amount).length;
      return higherCount + 1;
    }
  };

  const estimatedRank = calculateEstimatedRank(bidAmount);

  const addBid = (delta: number) => {
    soundFX.playClick();
    setBidAmount(prev => Math.max(1, prev + delta));
  };

  const setTargetTopRank = () => {
    soundFX.playClick();
    setBidAmount(topBid > 0 ? topBid + 1 : 1);
  };

  const finalizePaidBid = () => {
    setIsProcessing(false);
    setIsSuccess(true);
    soundFX.playCashRegister();
    soundFX.playRankClimb();

    try {
      confetti({
        particleCount: 90,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#e05638', '#f08b70', '#fbdcd0', '#1c1917', '#ffffff']
      });
    } catch {
      // ignore
    }

    setTimeout(() => {
      onSuccessfulBid(
        {
          name,
          tagline: tagline || 'The future of innovation.',
          url: url.startsWith('http') || url.startsWith('@') ? url : `https://${url}`,
          category,
          icon,
          bid: bidAmount,
          todayBid: bidAmount,
        },
        bidAmount,
        targetListing ? targetListing.id : undefined
      );
      onClose();
    }, 1200);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || !name.trim()) return;
    setIsProcessing(true);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-[28px] bg-[#fffcf9] border border-[#ebdcd4] shadow-2xl overflow-hidden my-8 text-[#1c1917]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#f3eae4] bg-[#fbf6f2]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#fde9df] text-[#e05638] flex items-center justify-center font-bold">
              <Zap className="w-4 h-4 fill-[#e05638]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#1c1917]">
                {targetListing ? `Outbid ${targetListing.name}` : 'Claim Rank on topbid'}
              </h2>
              <p className="text-xs text-[#78716c]">
                {targetListing
                  ? `Pay the difference to beat spot #${currentListings.findIndex(l => l.id === targetListing.id) + 1}`
                  : 'Pay to rank instantly. Minimum bid $1.'}
              </p>
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

        {isSuccess ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto text-2xl">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-[#1c1917]">Rank Claimed!</h3>
            <p className="text-sm text-[#57534e]">
              You secured rank <span className="font-mono font-bold text-[#e05638]">#{estimatedRank}</span> with a bid of <span className="font-mono font-bold text-[#e05638]">${bidAmount.toLocaleString()}</span>.
            </p>
            <p className="text-xs text-[#a8a29e]">Updating leaderboard...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            {/* Target Rank Estimator Pill */}
            <div className="p-3.5 rounded-2xl bg-[#fef4ee] border border-[#f8e5da] flex items-center justify-between">
              <div>
                <span className="text-[11px] text-[#78716c] font-mono block">Estimated Position</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-xl font-extrabold font-mono text-[#e05638]">
                    Rank #{estimatedRank}
                  </span>
                  {estimatedRank === 1 && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#e05638] text-white">
                      👑 KING #1
                    </span>
                  )}
                </div>
              </div>

              <div className="text-right">
                <span className="text-[11px] text-[#78716c] font-mono block">To Claim #1 Spot</span>
                <button
                  type="button"
                  onClick={setTargetTopRank}
                  className="text-xs font-mono font-bold text-[#e05638] underline hover:opacity-80"
                >
                  ${(topBid > 0 ? topBid + 1 : 1).toLocaleString()}
                </button>
              </div>
            </div>

            {/* URL input */}
            <div>
              <label className="block text-xs font-bold text-[#1c1917] mb-1.5">
                Product URL or @handle <span className="text-[#e05638]">*</span>
              </label>
              <div className="relative">
                <Globe className="w-4 h-4 text-[#a8a29e] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={url}
                  onChange={(e) => handleUrlChange(e.target.value)}
                  placeholder="https://mywebsite.com or @twitterhandle"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-[#ebdcd4] text-sm text-[#1c1917] placeholder-[#a8a29e] focus:outline-none focus:border-[#e05638]"
                />
              </div>
            </div>

            {/* Name & Tagline */}
            <div>
              <label className="block text-xs font-bold text-[#1c1917] mb-1.5">
                Product / Profile Name <span className="text-[#e05638]">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Acme Studio"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#ebdcd4] text-sm text-[#1c1917] placeholder-[#a8a29e] focus:outline-none focus:border-[#e05638]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1c1917] mb-1.5">
                Short Description (One sentence)
              </label>
              <input
                type="text"
                maxLength={90}
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="What does your product or project do?"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#ebdcd4] text-sm text-[#1c1917] placeholder-[#a8a29e] focus:outline-none focus:border-[#e05638]"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-bold text-[#1c1917] mb-1.5">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#ebdcd4] text-sm text-[#1c1917] focus:outline-none focus:border-[#e05638] cursor-pointer"
              >
                {categories.filter(c => c !== 'All').map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Bid Amount Controller */}
            <div className="pt-2 border-t border-[#f3eae4]">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-[#1c1917]">
                  Bid Amount ($ USD)
                </label>
                <span className="text-[11px] font-mono text-[#78716c]">
                  Min: $1
                </span>
              </div>

              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-mono text-lg font-bold text-[#e05638]">
                  $
                </span>
                <input
                  type="number"
                  min={1}
                  max={999999}
                  step={1}
                  value={bidAmount}
                  onChange={(e) => setBidAmount(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full pl-9 pr-4 py-3 rounded-2xl bg-white border-2 border-[#e05638] text-xl font-bold font-mono text-[#e05638] focus:outline-none"
                />
              </div>

              {/* Quick Step Buttons */}
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                <button
                  type="button"
                  onClick={() => addBid(1)}
                  className="px-2.5 py-1 rounded-full bg-[#f3eae4] text-[11px] font-mono font-semibold text-[#57534e] hover:bg-[#ebdcd4]"
                >
                  +$1
                </button>
                <button
                  type="button"
                  onClick={() => addBid(5)}
                  className="px-2.5 py-1 rounded-full bg-[#f3eae4] text-[11px] font-mono font-semibold text-[#57534e] hover:bg-[#ebdcd4]"
                >
                  +$5
                </button>
                <button
                  type="button"
                  onClick={() => addBid(25)}
                  className="px-2.5 py-1 rounded-full bg-[#f3eae4] text-[11px] font-mono font-semibold text-[#57534e] hover:bg-[#ebdcd4]"
                >
                  +$25
                </button>
                <button
                  type="button"
                  onClick={setTargetTopRank}
                  className="px-2.5 py-1 rounded-full bg-[#fde9df] text-[11px] font-mono font-bold text-[#e05638] ml-auto hover:bg-[#fbdcd0]"
                >
                  👑 Spot #1
                </button>
              </div>
            </div>

            {/* Real wallet payment */}
            <div className="pt-2 border-t border-[#f3eae4]">
              <WalletPaymentButton
                usdAmount={bidAmount}
                onPaid={finalizePaidBid}
                url={url}
                categorySlug={category.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}
                disabled={!url.trim() || !name.trim() || bidAmount < 1}
              />

              <button
                type="button"
                disabled
                className="w-full mt-2 py-3 px-4 rounded-full border border-[#ebdcd4] bg-[#f8f3ef] text-[#a8a29e] font-semibold text-sm flex items-center justify-center gap-2 cursor-not-allowed"
                title="Card payments will be enabled separately."
              >
                <CreditCard className="w-4 h-4" />
                <span>Pagamento por cartão — em breve</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
