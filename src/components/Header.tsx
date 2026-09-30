import React from 'react';

interface HeaderProps {
  onOpenRules: () => void;
  onOpenDaily: () => void;
  onOpenCategories: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenRules, onOpenDaily, onOpenCategories }) => (
  <header className="sticky top-0 z-40 w-full bg-[#faf6f3]/90 backdrop-blur-md border-b border-[#ebdcd4]">
    <div className="max-w-6xl mx-auto px-3 sm:px-5 h-16 flex items-center justify-between gap-4">
      <a href="/" className="flex items-center gap-2.5" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
        <div className="flex flex-col gap-1 items-start justify-center py-1">
          <span className="w-4 h-1.5 rounded-full bg-[#e05638]"></span>
          <span className="w-6 h-1.5 rounded-full bg-[#1c1917]"></span>
          <span className="w-8 h-1.5 rounded-full bg-[#1c1917]"></span>
        </div>
        <span className="text-xl font-black tracking-tight text-[#1c1917]">top<span className="text-[#e05638]">bid</span></span>
      </a>
      <nav className="flex items-center gap-4 text-xs font-semibold text-[#57534e]">
        <button onClick={onOpenDaily} className="hover:text-[#1c1917] transition-colors cursor-pointer">Daily</button>
        <button onClick={onOpenCategories} className="hover:text-[#1c1917] transition-colors cursor-pointer">Categories</button>
        <button onClick={onOpenRules} className="hover:text-[#1c1917] transition-colors cursor-pointer">About</button>
      </nav>
    </div>
  </header>
);