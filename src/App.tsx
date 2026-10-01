import React, { useEffect, useMemo, useState } from 'react';
import { Header } from './components/Header';
import { LiveTicker } from './components/LiveTicker';
import { Hero } from './components/Hero';
import { FilterBar } from './components/FilterBar';
import { LeaderboardTable } from './components/LeaderboardTable';
import { OutbidModal } from './components/OutbidModal';
import { RulesModal } from './components/RulesModal';
import { Footer } from './components/Footer';
import { Listing, Category, ActivityEvent } from './types';
import { soundFX } from './utils/audio';
import { supabase } from './lib/supabase';

const ALL_CATEGORIES: Category[] = [
  'All','AI & Agents','Marketing & SEO','Developer Tools','SaaS & Productivity',
  'Design & Creative','X / Twitter Profiles','Crypto & Web3','Side Projects'
];

const categoryFromName = (value: string | undefined): Category => {
  const allowed = ALL_CATEGORIES as string[];
  return allowed.includes(value || '') ? (value as Category) : 'Side Projects';
};

export default function App() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [activeNavTab, setActiveNavTab] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState<Category>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [targetListingForOutbid, setTargetListingForOutbid] = useState<Listing | null>(null);
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
  const [isExploreOpen, setIsExploreOpen] = useState(false);
  const [quickClaimUrl, setQuickClaimUrl] = useState('');
  const [quickClaimBid, setQuickClaimBid] = useState<number | undefined>();

  const loadListings = async () => {
    if (!supabase) {
      setLoadError('Supabase não está configurado.');
      setLoading(false);
      return;
    }
    setLoadError('');
    try {
      const { data, error } = await supabase
        .from('listings')
        .select('id, normalized_url, canonical_url, title, description, category_id, total_paid_cents, created_at, clicks, image_url, favicon_url, status, categories(name, slug)')
        .eq('status', 'active')
        .order('total_paid_cents', { ascending: false })
        .order('created_at', { ascending: true });
      if (error) throw error;
      const mapped: Listing[] = (data || []).map((row: any) => ({
        id: row.id,
        name: row.title || row.normalized_url || 'Untitled',
        tagline: row.description || '',
        url: row.canonical_url || row.normalized_url || '',
        category: categoryFromName(row.categories?.name),
        bid: Number(row.total_paid_cents || 0) / 100,
        todayBid: Number(row.total_paid_cents || 0) / 100,
        clicks: Number(row.clicks || 0),
        createdAt: new Date(row.created_at).getTime(),
        image: row.image_url || undefined,
        favicon: row.favicon_url || undefined,
        isUserCreated: true,
      }));
      setListings(mapped);
    } catch (error) {
      console.error(error);
      setLoadError('Não foi possível carregar o ranking real.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadListings();
    if (!supabase) return;
    const channel = supabase.channel('topbid-live-ranking')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'listings' }, () => loadListings())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const totalVolume = useMemo(() => listings.reduce((sum, item) => sum + item.bid, 0), [listings]);
  const totalClicks = useMemo(() => listings.reduce((sum, item) => sum + item.clicks, 0), [listings]);
  const topListingBid = useMemo(() => listings.length ? Math.max(...listings.map(item => item.bid)) : 0, [listings]);

  const filteredAndSortedListings = useMemo(() => {
    let result = [...listings];
    if (selectedCategory !== 'All') result = result.filter(item => item.category === selectedCategory);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(item => item.name.toLowerCase().includes(q) || item.tagline.toLowerCase().includes(q) || item.url.toLowerCase().includes(q) || item.category.toLowerCase().includes(q));
    }
    return result.sort((a,b) => b.bid !== a.bid ? b.bid - a.bid : a.createdAt - b.createdAt);
  }, [listings, selectedCategory, searchQuery]);

  const handleListingClick = async (listing: Listing) => {
    if (supabase) {
      await supabase.from('click_events').insert({ listing_id: listing.id, is_bot: false });
    }
    setListings(prev => prev.map(item => item.id === listing.id ? { ...item, clicks: item.clicks + 1 } : item));
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

  const handleSuccessfulBid = async () => {
    setIsSubmitModalOpen(false);
    setActivities([]);
    await loadListings();
  };

  const filteredActivities = activities;

  return (
    <div className="min-h-screen bg-[#faf6f3] text-[#1c1917] flex flex-col font-sans selection:bg-[#e05638]/20 selection:text-[#e05638]">
      <Header
        onOpenRules={() => setIsRulesModalOpen(true)}
        onOpenDaily={() => undefined}
        onOpenCategories={() => document.getElementById('leaderboard-filter')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
      />

      <LiveTicker activities={filteredActivities} onSelectOutbid={(name) => {
        const match = listings.find(l => l.name.toLowerCase() === name.toLowerCase());
        if (match) handleOutbidListing(match); else handleOpenSubmit();
      }} />

      <main className="flex-1">
        <Hero
          topListingBid={topListingBid}
          totalVolume={totalVolume}
          totalClicks={totalClicks}
          totalListingsCount={listings.length}
          timeframe="all"
          onChangeTimeframe={() => undefined}
          onQuickClaim={handleQuickClaim}
          selectedCategory={selectedCategory}
          onChangeCategory={setSelectedCategory}
          activeNavTab={activeNavTab}
          setActiveNavTab={setActiveNavTab}
          onOpenExplore={() => setIsExploreOpen(true)}
        />

        {loadError && <div className="mx-auto max-w-xl px-4 pb-3 text-center text-sm font-semibold text-[#c2412d]">{loadError}</div>}
        {loading && <div className="mx-auto max-w-xl px-4 pb-6 text-center text-sm text-[#78716c]">A carregar o ranking real…</div>}

        <div id="leaderboard-filter">
          <FilterBar selectedCategory={selectedCategory} onChangeCategory={setSelectedCategory} searchQuery={searchQuery} onSearchChange={setSearchQuery} categories={ALL_CATEGORIES} />
        </div>

        <LeaderboardTable listings={filteredAndSortedListings} onOutbidListing={handleOutbidListing} onListingClick={handleListingClick} isTodayView={false} />
      </main>

      {isExploreOpen && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm p-4 flex items-center justify-center" onClick={() => setIsExploreOpen(false)}>
          <div className="w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-3xl bg-[#faf6f3] border border-[#ebdcd4] shadow-2xl p-5" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between gap-3 mb-5">
              <div><h2 className="text-xl font-black">Explore</h2><p className="text-xs text-[#78716c] mt-1">See each category and who is leading it.</p></div>
              <button type="button" onClick={() => setIsExploreOpen(false)} className="px-3 py-1.5 rounded-full bg-[#f3eae4] text-xs font-bold text-[#57534e]">Close</button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {ALL_CATEGORIES.filter(cat => cat !== 'All').map(cat => {
                const leader = listings.filter(item => item.category === cat).sort((a,b) => b.bid-a.bid)[0];
                return <button key={cat} type="button" onClick={() => { setSelectedCategory(cat); setIsExploreOpen(false); window.scrollTo({top:0,behavior:'smooth'}); }} className="text-left p-4 rounded-2xl bg-white border border-[#ebdcd4] hover:border-[#e05638] transition-colors">
                  <div className="text-[10px] uppercase tracking-wider font-bold text-[#a8a29e]">{cat}</div>
                  {leader && <div className="mt-2"><div className="font-bold truncate">#1 {leader.name}</div><div className="text-xs text-[#e05638] font-mono mt-1">${leader.bid.toLocaleString()}</div></div>}
                </button>;
              })}
            </div>
          </div>
        </div>
      )}

      <Footer onOpenRules={() => setIsRulesModalOpen(true)} revenue={totalVolume} productsAdded={listings.length} />

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

      <RulesModal isOpen={isRulesModalOpen} onClose={() => setIsRulesModalOpen(false)} />
    </div>
  );
}
