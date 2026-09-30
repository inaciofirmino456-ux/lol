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

const STORAGE_LISTINGS_KEY = 'topbid_v5_listings';
const STORAGE_ACTIVITIES_KEY = 'topbid_v5_activities';
const STORAGE_SOUND_KEY = 'topbid_sound_enabled';

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

  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_SOUND_KEY);
      return saved !== null ? saved === 'true' : true;
    }
    return true;
  });

  const [activeNavTab, setActiveNavTab] = useState('all');
  const [timeframe, setTimeframe] = useState<'all' | 'today'>('all');
  const [selectedCategory, setSelectedCategory] = useState<Category>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [targetListingForOutbid, setTargetListingForOutbid] = useState<Listing | null>(null);
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
  const [quickClaimUrl, setQuickClaimUrl] = useState('');
  const [quickClaimBid, setQuickClaimBid] = useState<number | undefined>(undefined);

  const [onlineCount, setOnlineCount] = useState(35);

  useEffect(() => {
    soundFX.enabled = soundEnabled;
    try {
      localStorage.setItem(STORAGE_SOUND_KEY, soundEnabled.toString());
    } catch {
      // ignore
    }
  }, [soundEnabled]);

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

  useEffect(() => {
    const interval = setInterval(() => {
      setOnlineCount((prev) => {
        const change = Math.floor(Math.random() * 3) - 1;
        return Math.max(28, Math.min(48, prev + change));
      });
    }, 5000);
    return () => clearInterval(interval);
  }, []);

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
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled((prev) => !prev)}
        onOpenRules={() => setIsRulesModalOpen(true)}
        onOpenSubmit={handleOpenSubmit}
        onlineCount={onlineCount}
      />

      {/* Live Activity Ticker */}
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
          onlineCount={onlineCount}
          timeframe={timeframe}
          onChangeTimeframe={setTimeframe}
          onQuickClaim={handleQuickClaim}
          activeNavTab={activeNavTab}
          setActiveNavTab={setActiveNavTab}
        />

        {/* Categories & Search Filter */}
        <FilterBar
          selectedCategory={selectedCategory}
          onChangeCategory={setSelectedCategory}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          categories={ALL_CATEGORIES}
        />

        {/* Exact Peach Cards from Screenshot */}
        <LeaderboardTable
          listings={filteredAndSortedListings}
          onOutbidListing={handleOutbidListing}
          onListingClick={handleListingClick}
          isTodayView={timeframe === 'today'}
        />
      </main>

      {/* Footer */}
      <Footer
        onResetData={handleResetData}
        onOpenRules={() => setIsRulesModalOpen(true)}
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
