import { Search, X, RotateCcw } from 'lucide-react'
import type { BlogCategory } from '../types'
import { BLOG_CATEGORIES } from '../data/blogStories'

interface BlogSearchFiltersProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  selectedCategory: BlogCategory | 'All'
  onSelectCategory: (category: BlogCategory | 'All') => void
  totalResults: number
  onReset: () => void
}

export function BlogSearchFilters({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onSelectCategory,
  totalResults,
  onReset,
}: BlogSearchFiltersProps) {
  const isFiltered = searchQuery.trim().length > 0 || selectedCategory !== 'All'

  return (
    <div className="space-y-4">
      {/* Search Input Bar */}
      <div className="relative max-w-xl mx-auto sm:mx-0">
        <label htmlFor="blog-search" className="sr-only">
          Search nutrition stories
        </label>
        <div className="relative">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
            aria-hidden="true"
          />
          <input
            id="blog-search"
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by topic, habit, or keyword..."
            className="w-full pl-11 pr-10 py-3 rounded-2xl bg-white/90 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm transition-shadow shadow-xs"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              aria-label="Clear search query"
              className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Category Pills & Result Counter */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-1">
        <div
          role="tablist"
          aria-label="Filter stories by category"
          className="flex flex-wrap items-center gap-1.5"
        >
          <button
            type="button"
            role="tab"
            aria-selected={selectedCategory === 'All'}
            onClick={() => onSelectCategory('All')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500 ${
              selectedCategory === 'All'
                ? 'bg-slate-900 text-white dark:bg-emerald-500/20 dark:text-emerald-300 dark:border dark:border-emerald-500/40 shadow-xs'
                : 'bg-white/70 dark:bg-slate-900/50 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-800 hover:border-emerald-500/40 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            All Stories
          </button>
          {BLOG_CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat
            return (
              <button
                key={cat}
                type="button"
                role="tab"
                aria-selected={isSelected}
                onClick={() => onSelectCategory(cat)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                  isSelected
                    ? 'bg-slate-900 text-white dark:bg-emerald-500/20 dark:text-emerald-300 dark:border dark:border-emerald-500/40 shadow-xs'
                    : 'bg-white/70 dark:bg-slate-900/50 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-800 hover:border-emerald-500/40 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {cat}
              </button>
            )
          })}
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
          <span>
            Showing <strong className="text-slate-900 dark:text-slate-100">{totalResults}</strong> {totalResults === 1 ? 'story' : 'stories'}
          </span>
          {isFiltered && (
            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 hover:underline font-medium cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              Reset filters
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
