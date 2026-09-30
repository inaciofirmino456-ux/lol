/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { LiveTicker } from './components/LiveTicker';
import { Hero } from './components/Hero';
import { FilterBar } from './components/FilterBar';
import { LeaderboardTable } from './components/LeaderboardTable';
import { OutbidModal } from './components/OutbidModal';
import { RulesModal } from './components/RulesModal';
import { Footer } from './components/Footer';
import { INITIAL_LISTINGS, INITIAL_ACTIVITIES } from './data/initialListings';
import { Listing, Category, ActivityEvent } from './types';
import { soundFX } from './utils/audio';

const STORAGE_LISTINGS_KEY = 'topbid_v6_listings';
const STORAGE_ACTIVITIES_KEY = 'topbid_v6_activities';

const ALL_CATEGORIES: Category[] = [
  'All',
  'AI & Agents',
  'Marketing & SEO',
  'Developer Tools',
  'SaaS & Productivity',
  'Design & Creative',
  'Crypto & Web3',
  'Side Projects'
];

export default function App() {
  const [listings, setListings] = useState<Listing[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_LISTINGS_KEY);
        if (saved) return JSON.parse(saved);
      } catch (err) {
        console.error('Failed to load listings', err);
      }
    }
    return INITIAL_LISTINGS;
  });

  const [activities, setActivities] = useState<ActivityEvent[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_ACTIVITIES_KEY);
        if (saved) return JSON.parse(saved);
      } catch (err) {
        console.error('Failed to load activities', err);
      }
    }
    return INITIAL_ACTIVITIES;
  });

  const [activeNavTab, setActiveNavTab] = useState('all');
  const [timeframe, setTimeframe] = useState<'all' | 'today'>('all');
  const [selectedCategory, setSelectedCategory] = useState<Category>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [targetListingForOutbid, setTargetListingForOutbid] = useState<Listing | null>(null);
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
  const [isExploreOpen, setIsExploreOpen] = useState(false);
  const [quickClaimUrl, setQuickClaimUrl] = useState('');
  const [quickClaimBid, setQuickClaimBid] = useState<number | undefined>(undefined);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_LISTINGS_KEY, JSON.stringify(listings));
    } catch {
      // ignore
    }
  }, [listings]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_ACTIVITIES_KEY, JSON.stringify(activities));
    } catch {
      // ignore
    }
  }, [activities]);


  const totalVolume = useMemo(() => {
    return listings.reduce((sum, item) => sum + item.bid, 0);
  }, [listings]);

  const totalClicks = useMemo(() => {
    return listings.reduce((sum, item) => sum + item.clicks, 0);
  }, [listings]);

  const topListingBid = useMemo(() => {
    if (listings.length === 0) return 0;
    return Math.max(...listings.map((item) => (timeframe === 'today' ? item.todayBid : item.bid)));
  }, [listings, timeframe]);

  // Filter and sort listings
  const filteredAndSortedListings = useMemo(() => {
    let result = [...listings];

    if (selectedCategory !== 'All') {
      result = result.filter((item) => item.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          item.tagline.toLowerCase().includes(q) ||
          item.url.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q)
      );
    }

    result.sort((a, b) => {
      const bidA = timeframe === 'today' ? a.todayBid : a.bid;
      const bidB = timeframe === 'today' ? b.todayBid : b.bid;
      if (bidB !== bidA) return bidB - bidA;
      return a.createdAt - b.createdAt;
    });

    return result;
  }, [listings, selectedCategory, searchQuery, timeframe]);

  const handleListingClick = (listing: Listing) => {
    setListings((prev) =>
      prev.map((item) => (item.id === listing.id ? { ...item, clicks: item.clicks + 1 } : item))
    );
  };

  const handleOutbidListing = (listing: Listing) => {
    setTargetListingForOutbid(listing);
    setQuickClaimUrl('');
    setQuickClaimBid(undefined);
    setIsSubmitModalOpen(true);
  };

  const handleOpenSubmit = () => {
    setTargetListingForOutbid(null);
    setQuickClaimUrl('');
    setQuickClaimBid(undefined);
    setIsSubmitModalOpen(true);
  };

  const handleQuickClaim = (urlOrHandle: string, bidAmount: number) => {
    soundFX.playClick();
    setTargetListingForOutbid(null);
    setQuickClaimUrl(urlOrHandle);
    setQuickClaimBid(bidAmount);
    setIsSubmitModalOpen(true);
  };

  const handleSuccessfulBid = (
    data: Partial<Listing>,
    amount: number,
    isExistingId?: string
  ) => {
    if (isExistingId) {
      setListings((prev) =>
        prev.map((item) => {
          if (item.id === isExistingId) {
            return {
              ...item,
              bid: Math.max(item.bid, amount),
              todayBid: Math.max(item.todayBid, amount),
              tagline: data.tagline || item.tagline,
              name: data.name || item.name,
              category: data.category || item.category,
              icon: data.icon || item.icon,
            };
          }
          return item;
        })
      );

      const target = listings.find((l) => l.id === isExistingId);
      const name = target ? target.name : 'Listing';
      const newActivity: ActivityEvent = {
        id: `act-${Date.now()}`,
        text: `${name} raised bid to $${amount.toLocaleString()}!`,
        timestamp: 'Just now',
        amount,
        type: 'raise',
      };
      setActivities((prev) => [newActivity, ...prev.slice(0, 9)]);
    } else {
      const newListing: Listing = {
        id: `user-${Date.now()}`,
        name: data.name || 'Untitled Project',
        tagline: data.tagline || 'Innovative platform built for the future.',
        url: data.url || 'https://example.com',
        category: data.category || 'AI & Agents',
        bid: amount,
        todayBid: amount,
        clicks: 1,
        icon: data.icon || '⚡',
        createdAt: Date.now(),
        isUserCreated: true,
      };

      setListings((prev) => [newListing, ...prev]);

      const newActivity: ActivityEvent = {
        id: `act-${Date.now()}`,
        text: `${newListing.name} claimed rank with $${amount.toLocaleString()}!`,
        timestamp: 'Just now',
        amount,
        type: 'new',
      };
      setActivities((prev) => [newActivity, ...prev.slice(0, 9)]);
    }
  };

  const handleResetData = () => {
    localStorage.removeItem(STORAGE_LISTINGS_KEY);
    localStorage.removeItem(STORAGE_ACTIVITIES_KEY);
    setListings(INITIAL_LISTINGS);
    setActivities(INITIAL_ACTIVITIES);
    setSelectedCategory('All');
    setSearchQuery('');
  };

  return (
    <div className="min-h-screen bg-[#faf6f3] text-[#1c1917] flex flex-col font-sans selection:bg-[#e05638]/20 selection:text-[#e05638]">
      {/* Header with stepped logo */}
      <Header
        onOpenRules={() => setIsRulesModalOpen(true)}
        onOpenDaily={() => setTimeframe('today')}
        onOpenCategories={() => document.getElementById('leaderboard-filter')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
      />

      {/* Real activity only: this remains empty until real users submit bids. */}
      <LiveTicker
        activities={activities}
        onSelectOutbid={(name) => {
          const match = listings.find((l) => l.name.toLowerCase() === name.toLowerCase());
          if (match) {
            handleOutbidListing(match);
          } else {
            handleOpenSubmit();
          }
        }}
      />

      {/* Main Container */}
      <main className="flex-1">
        {/* Exact Hero Section from Screenshot with Statistics Cards */}
        <Hero
          topListingBid={topListingBid}
          totalVolume={totalVolume}
          totalClicks={totalClicks}
          totalListingsCount={listings.length}
          timeframe={timeframe}
          onChangeTimeframe={setTimeframe}
          onQuickClaim={handleQuickClaim}
          selectedCategory={selectedCategory}
          onChangeCategory={setSelectedCategory}
          activeNavTab={activeNavTab}
          setActiveNavTab={setActiveNavTab}
          onOpenExplore={() => setIsExploreOpen(true)}
        />

        {/* Categories & Search Filter */}
        <div id="leaderboard-filter">
        <FilterBar
          selectedCategory={selectedCategory}
          onChangeCategory={setSelectedCategory}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          categories={ALL_CATEGORIES}
        />
        </div>

        {/* Exact Peach Cards from Screenshot */}
        <LeaderboardTable
          listings={filteredAndSortedListings}
          onOutbidListing={handleOutbidListing}
          onListingClick={handleListingClick}
          isTodayView={timeframe === 'today'}
        />
      </main>

      {/* Footer */}
      {isExploreOpen && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm p-4 flex items-center justify-center" onClick={() => setIsExploreOpen(false)}>
          <div className="w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-3xl bg-[#faf6f3] border border-[#ebdcd4] shadow-2xl p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between gap-3 mb-5">
              <div><h2 className="text-xl font-black text-[#1c1917]">Explore</h2><p className="text-xs text-[#78716c] mt-1">See each category and who is leading it.</p></div>
              <button type="button" onClick={() => setIsExploreOpen(false)} className="px-3 py-1.5 rounded-full bg-[#f3eae4] text-xs font-bold text-[#57534e]">Close</button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {ALL_CATEGORIES.filter((cat) => cat !== 'All').map((cat) => {
                const categoryListings = listings.filter((item) => item.category === cat).sort((a,b) => b.bid-a.bid);
                const leader = categoryListings[0];
                return (
                  <button key={cat} type="button" onClick={() => { setSelectedCategory(cat); setIsExploreOpen(false); window.scrollTo({top: 0, behavior: 'smooth'}); }} className="text-left p-4 rounded-2xl bg-white border border-[#ebdcd4] hover:border-[#e05638] transition-colors">
                    <div className="text-[10px] uppercase tracking-wider font-bold text-[#a8a29e]">{cat}</div>
                    {leader ? (
                      <div className="mt-2"><div className="font-bold text-[#1c1917] truncate">#1 {leader.name}</div><div className="text-xs text-[#e05638] font-mono mt-1">${leader.bid.toLocaleString()}</div></div>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
      <Footer
        onOpenRules={() => setIsRulesModalOpen(true)}
        revenue={totalVolume}
        productsAdded={listings.length}
      />

      {/* Outbid / Claim Modal */}
      <OutbidModal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        targetListing={targetListingForOutbid}
        currentListings={listings}
        categories={ALL_CATEGORIES}
        onSuccessfulBid={handleSuccessfulBid}
        initialUrl={quickClaimUrl}
        initialBid={quickClaimBid}
      />

      {/* Rules Modal */}
      <RulesModal
        isOpen={isRulesModalOpen}
        onClose={() => setIsRulesModalOpen(false)}
      />
    </div>
  );
}
