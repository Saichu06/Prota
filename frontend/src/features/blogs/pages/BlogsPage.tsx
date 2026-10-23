import { useState, useMemo, useEffect } from 'react'
import { Sparkles, BookOpen } from 'lucide-react'
import { PublicHeader } from '../../../components/layout/PublicHeader'
import { PublicFooter } from '../../../components/layout/PublicFooter'
import { CircularWatermark } from '../../../components/ui/CircularWatermark'
import { BLOG_STORIES } from '../data/blogStories'
import { BlogStoryCard } from '../components/BlogStoryCard'
import { BlogSearchFilters } from '../components/BlogSearchFilters'
import type { BlogCategory } from '../types'

export function BlogsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<BlogCategory | 'All'>('All')

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    document.title = 'Stories & Editorial | PROTA Nutrition'
  }, [])

  // Filter stories based on search query and category
  const filteredStories = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    return BLOG_STORIES.filter((story) => {
      const matchesCategory =
        selectedCategory === 'All' || story.category === selectedCategory
      if (!matchesCategory) return false

      if (!query) return true

      const inHeadline = story.headline.toLowerCase().includes(query)
      const inSummary = story.summary.toLowerCase().includes(query)
      const inCategory = story.category.toLowerCase().includes(query)
      const inTakeaways = story.keyTakeaways.some((t) => t.toLowerCase().includes(query))

      return inHeadline || inSummary || inCategory || inTakeaways
    })
  }, [searchQuery, selectedCategory])

  const handleResetFilters = () => {
    setSearchQuery('')
    setSelectedCategory('All')
  }

  // Determine featured story: default to the first story when not actively searching
  const isFiltered = searchQuery.trim().length > 0 || selectedCategory !== 'All'
  const featuredStory = !isFiltered && filteredStories.length > 0 ? filteredStories[0] : null
  const gridStories = !isFiltered && featuredStory ? filteredStories.slice(1) : filteredStories

  return (
    <div className="min-h-screen bg-[#FBFAF7] dark:bg-slate-950 text-slate-900 dark:text-slate-100 selection:bg-emerald-500/20 scroll-smooth flex flex-col">
      <PublicHeader />

      <main className="flex-1 relative overflow-hidden">
        {/* Subtle circular watermark motif in hero background */}
        <CircularWatermark className="absolute -right-24 -top-20 sm:-right-20 sm:-top-16 w-[420px] sm:w-[560px] lg:w-[680px] opacity-70 dark:opacity-50 z-0 pointer-events-none" />

        {/* ─── EDITORIAL HERO SECTION ─── */}
        <section className="relative z-10 pt-12 sm:pt-16 lg:pt-20 pb-10 sm:pb-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200/60 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-4">
              <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
              Prota Journal
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-950 dark:text-white leading-[1.15]">
              Real Stories.{' '}
              <span className="text-emerald-700 dark:text-emerald-400">
                Everyday Progress.
              </span>
            </h1>

            <p className="mt-4 sm:mt-5 text-base sm:text-lg leading-relaxed text-slate-600 dark:text-slate-300">
              Every nutrition journey looks different. Explore the small choices, changing
              habits, and personal discoveries that add up over time.
            </p>
          </div>

          {/* Search & Filter Controls */}
          <div className="mt-8 sm:mt-10 pt-6 border-t border-slate-200/80 dark:border-slate-800/80">
            <BlogSearchFilters
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              totalResults={filteredStories.length}
              onReset={handleResetFilters}
            />
          </div>
        </section>

        {/* ─── STORIES CONTENT SECTION ─── */}
        <section className="relative z-10 pb-16 sm:pb-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Empty State */}
          {filteredStories.length === 0 ? (
            <div className="py-16 text-center max-w-md mx-auto rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/40 p-8 shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-4 border border-emerald-200/50 dark:border-emerald-500/20">
                <BookOpen className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                No matching stories found
              </h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                We couldn’t find any stories matching your search or filter. Try a different
                keyword or view all categories.
              </p>
              <button
                type="button"
                onClick={handleResetFilters}
                className="mt-5 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 text-white dark:bg-emerald-500/20 dark:text-emerald-300 dark:border dark:border-emerald-500/40 hover:bg-slate-800 transition-colors"
              >
                Reset filters
              </button>
            </div>
          ) : (
            <div className="space-y-10 sm:space-y-12">
              {/* Featured Story (when not searching/filtered) */}
              {featuredStory && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      Editor’s Selection
                    </span>
                  </div>
                  <BlogStoryCard story={featuredStory} featured />
                </div>
              )}

              {/* Grid of Remaining or Filtered Stories */}
              {gridStories.length > 0 && (
                <div>
                  {featuredStory && (
                    <div className="flex items-center justify-between mb-5">
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                        All Articles
                      </span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                    {gridStories.map((story) => (
                      <BlogStoryCard key={story.id} story={story} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Editorial Disclaimer Footer Banner */}
          <div className="mt-16 pt-8 border-t border-slate-200/70 dark:border-slate-800/70 text-center">
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
              Prota Journal stories are illustrative nutrition journeys inspired by everyday
              experiences. They do not constitute medical advice or guarantee individual results.
            </p>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  )
}
