import { Link } from 'react-router-dom'
import { ArrowRight, Clock } from 'lucide-react'
import type { BlogStory } from '../types'
import { BlogVideoPlaceholder } from './BlogVideoPlaceholder'

interface BlogStoryCardProps {
  story: BlogStory
  featured?: boolean
}

export function BlogStoryCard({ story, featured = false }: BlogStoryCardProps) {
  if (featured) {
    return (
      <article
        className="group relative rounded-3xl border border-slate-200/90 dark:border-slate-800/80 bg-white/85 dark:bg-slate-900/60 p-6 sm:p-8 lg:p-10 shadow-lg shadow-slate-200/40 dark:shadow-none hover:border-emerald-500/40 transition-all duration-300 backdrop-blur-xs flex flex-col lg:flex-row gap-8 lg:gap-12 items-center"
        aria-labelledby={`featured-story-${story.slug}`}
      >
        <div className="w-full lg:w-7/12 shrink-0">
          <Link
            to={`/blogs/${story.slug}`}
            className="block overflow-hidden rounded-2xl md:rounded-3xl focus:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500"
            tabIndex={-1}
            aria-hidden="true"
          >
            <BlogVideoPlaceholder
              videoSrc={story.videoSrc}
              headline={story.headline}
              caption={story.videoCaption}
              posterSrc={story.posterSrc}
              aspectRatio="16/9"
              enablePlay={false}
            />
          </Link>
        </div>

        <div className="w-full lg:w-5/12 flex flex-col items-start justify-center">
          <div className="flex flex-wrap items-center gap-2.5 mb-3.5">
            <span className="px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-500/30">
              Featured Story · {story.category}
            </span>
            <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
              <Clock className="w-3.5 h-3.5" aria-hidden="true" />
              {story.readTime}
            </span>
          </div>

          <h2
            id={`featured-story-${story.slug}`}
            className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors leading-snug"
          >
            <Link
              to={`/blogs/${story.slug}`}
              className="focus:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500 rounded"
            >
              {story.headline}
            </Link>
          </h2>

          <p className="mt-3.5 text-sm sm:text-base leading-relaxed text-slate-600 dark:text-slate-300 line-clamp-3">
            {story.summary}
          </p>

          <div className="mt-6 flex items-center justify-between w-full pt-4 border-t border-slate-100 dark:border-slate-800">
            <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
              Story {story.number} · {story.publishedDate}
            </span>
            <Link
              to={`/blogs/${story.slug}`}
              className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 transition-colors group/link"
              aria-label={`Read story: ${story.headline}`}
            >
              <span>Read story</span>
              <ArrowRight className="w-4 h-4 group-hover/link:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </article>
    )
  }

  return (
    <article
      className="group relative flex flex-col rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/50 p-5 sm:p-6 shadow-md shadow-slate-200/30 dark:shadow-none hover:border-emerald-500/40 hover:shadow-xl transition-all duration-300 backdrop-blur-xs"
      aria-labelledby={`story-heading-${story.slug}`}
    >
      <div className="mb-4">
        <Link
          to={`/blogs/${story.slug}`}
          className="block overflow-hidden rounded-2xl focus:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500"
          tabIndex={-1}
          aria-hidden="true"
        >
          <BlogVideoPlaceholder
            videoSrc={story.videoSrc}
            headline={story.headline}
            caption={story.videoCaption}
            posterSrc={story.posterSrc}
            aspectRatio="16/9"
            enablePlay={false}
          />
        </Link>
      </div>

      <div className="flex items-center justify-between gap-2 mb-2.5">
        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider bg-slate-100 dark:bg-slate-800/80 text-emerald-700 dark:text-emerald-400 border border-slate-200/60 dark:border-slate-700/60">
          Story {story.number} · {story.category}
        </span>
        <span className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
          <Clock className="w-3 h-3" aria-hidden="true" />
          {story.readTime}
        </span>
      </div>

      <h3
        id={`story-heading-${story.slug}`}
        className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors leading-snug line-clamp-2"
      >
        <Link
          to={`/blogs/${story.slug}`}
          className="focus:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500 rounded"
        >
          {story.headline}
        </Link>
      </h3>

      <p className="mt-2.5 text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-slate-300 line-clamp-2">
        {story.summary}
      </p>

      <div className="mt-auto pt-4 flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80">
        <span className="text-[11px] text-slate-400 dark:text-slate-500">
          {story.publishedDate}
        </span>
        <Link
          to={`/blogs/${story.slug}`}
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 transition-colors group/link"
          aria-label={`Read story: ${story.headline}`}
        >
          <span>Read story</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover/link:translate-x-1 transition-transform" />
        </Link>
      </div>
    </article>
  )
}
