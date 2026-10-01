export type Category = 
  | 'All'
  | 'Developer Tools'
  | 'AI & Agents'
  | 'Marketing & SEO'
  | 'SaaS & Productivity'
  | 'Design & Creative'
  | 'X / Twitter Profiles'
  | 'Crypto & Web3'
  | 'Side Projects';

export interface Listing {
  id: string;
  name: string;
  tagline: string;
  url: string;
  category: Category;
  bid: number; // in USD
  todayBid: number; // daily bid in USD
  clicks: number;
  icon?: string;
  handle?: string;
  createdAt: number; // timestamp
  badge?: string;
  isUserCreated?: boolean;
  image?: string;
  favicon?: string;
}

export interface ActivityEvent {
  id: string;
  text: string;
  timestamp: string;
  amount: number;
  type: 'outbid' | 'new' | 'raise';
}
