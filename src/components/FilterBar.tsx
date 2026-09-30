import React from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { Category } from '../types';
import { soundFX } from '../utils/audio';

interface FilterBarProps {
  selectedCategory: Category;
  onChangeCategory: (cat: Category) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  categories: Category[];
}

export const FilterBar: React.FC<FilterBarProps> = ({
  selectedCategory,
  onChangeCategory,
  searchQuery,
  onSearchChange,
  categories,
}) => {
  return (
    <div className="max-w-xl mx-auto px-4 mb-4 space-y-2.5">
      {/* Search Input */}
      <div className="relative w-full">
        <Search className="w-4 h-4 text-[#a8a29e] absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search products or categories..."
          className="w-full pl-10 pr-8 py-2 rounded-full bg-white border border-[#ebdcd4] text-xs sm:text-sm text-[#1c1917] placeholder-[#a8a29e] focus:outline-none focus:border-[#e05638] shadow-2xs transition-colors"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a8a29e] hover:text-[#1c1917]"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Horizontal categories list */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
        {categories.map((cat) => {
          const isActive = selectedCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => {
                soundFX.playClick();
                onChangeCategory(cat);
              }}
              className={`px-3 py-1.5 rounded-full whitespace-nowrap font-medium text-xs transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#e05638] text-white shadow-xs font-semibold'
                  : 'bg-[#f3eae4] text-[#78716c] hover:text-[#1c1917] hover:bg-[#ebdcd4]'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>
    </div>
  );
};
