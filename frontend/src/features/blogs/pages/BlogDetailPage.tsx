import { useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Clock, Calendar, ArrowRight, CheckCircle2, ShieldCheck } from 'lucide-react'
import { PublicHeader } from '../../../components/layout/PublicHeader'
import { PublicFooter } from '../../../components/layout/PublicFooter'
import { CircularWatermark } from '../../../components/ui/CircularWatermark'
import { Button } from '../../../components/ui/Button'
import { getBlogStoryBySlug } from '../data/blogStories'
import { BlogVideoPlaceholder } from '../components/BlogVideoPlaceholder'

export function BlogDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const story = slug ? getBlogStoryBySlug(slug) : undefined

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    if (story) {
      document.title = `${story.headline.replace(/^[“"]|[”"]$/g, '')} | PROTA Journal`
    }
  }, [story])

  if (!story) {
    return (
      <div className="min-h-screen bg-[#FBFAF7] dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
        <PublicHeader />
        <main className="flex-1 flex items-center justify-center p-6 text-center">
          <div className="max-w-md">
            <h1 className="text-2xl font-bold mb-3">Story Not Found</h1>
            <p className="text-slate-600 dark:text-slate-400 mb-6 text-sm">
              The nutrition story you are looking for does not exist or may have been moved.
            </p>
            <Link to="/blogs">
              <Button variant="primary" size="md" leftIcon={<ArrowLeft className="w-4 h-4" />}>
                Back to all stories
              </Button>
            </Link>
          </div>
        </main>
        <PublicFooter />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FBFAF7] dark:bg-slate-950 text-slate-900 dark:text-slate-100 selection:bg-emerald-500/20 scroll-smooth flex flex-col">
      <PublicHeader />

      <main className="flex-1 relative overflow-hidden">
        {/* Subtle circular watermark in the article header */}
        <CircularWatermark className="absolute -right-24 -top-24 sm:-right-20 sm:-top-20 w-[440px] sm:w-[580px] opacity-70 dark:opacity-50 pointer-events-none z-0" />

        <article className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12 pb-16 sm:pb-24">
          {/* Back Navigation Breadcrumb */}
          <div className="mb-6">
            <Link
              to="/blogs"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors py-1 group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span>Back to all stories</span>
            </Link>
          </div>

          {/* Article Header Meta */}
          <header className="mb-8 sm:mb-10">
            <div className="flex flex-wrap items-center gap-2.5 mb-4">
              <span className="px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-500/30">
                Story {story.number} · {story.category}
              </span>
              <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                {story.readTime}
              </span>
              <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
                {story.publishedDate}
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-950 dark:text-white leading-[1.2]">
              {story.headline}
            </h1>

            <p className="mt-4 sm:mt-5 text-base sm:text-lg leading-relaxed text-slate-600 dark:text-slate-300 max-w-3xl">
              {story.summary}
            </p>

            {/* Subtle Disclosure Notice */}
            <div className="mt-4 flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500 italic">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600/70 dark:text-emerald-400/70 shrink-0" />
              <span>{story.disclosure}</span>
            </div>
          </header>

          {/* Hero Video Player / Placeholder */}
          <div
            className={`mb-10 sm:mb-14 ${
              story.aspectRatio === '9/16' ? 'max-w-xs sm:max-w-sm mx-auto' : 'w-full'
            }`}
          >
            <BlogVideoPlaceholder
              videoSrc={story.videoSrc}
              headline={story.headline}
              caption={story.videoCaption}
              posterSrc={story.posterSrc}
              aspectRatio={story.aspectRatio || '16/9'}
              enablePlay={true}
            />
          </div>

          {/* Story Body Copy */}
          <div className="max-w-3xl mx-auto space-y-8 text-base sm:text-lg leading-relaxed text-slate-700 dark:text-slate-300">
            {/* Introduction Paragraphs */}
            <div className="space-y-4 font-normal">
              {story.intro.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>

            {/* Narrative Sections */}
            {story.sections.map((section, idx) => (
              <section key={idx} className="pt-4 space-y-4">
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                  {section.title}
                </h2>
                {section.content.map((p, pIdx) => (
                  <p key={pIdx}>{p}</p>
                ))}
              </section>
            ))}

            {/* Key Takeaways Callout Card */}
            <aside className="my-8 sm:my-10 p-6 sm:p-7 rounded-3xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-800/60">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Key Discoveries from This Journey
              </h3>
              <ul className="space-y-2.5 text-sm sm:text-base text-slate-700 dark:text-slate-200">
                {story.keyTakeaways.map((takeaway, tIdx) => (
                  <li key={tIdx} className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400 mt-2 shrink-0" />
                    <span>{takeaway}</span>
                  </li>
                ))}
              </ul>
            </aside>

            {/* Conclusion */}
            <div className="pt-2 space-y-4">
              {story.conclusion.map((p, i) => (
                <p key={i} className="font-medium text-slate-800 dark:text-slate-200">
                  {p}
                </p>
              ))}
            </div>
          </div>

          {/* ─── RESTRAINED CTA SECTION ─── */}
          <section className="mt-14 sm:mt-18 pt-10 border-t border-slate-200/80 dark:border-slate-800/80 max-w-3xl mx-auto">
            <div className="rounded-3xl bg-white/90 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 p-8 sm:p-10 shadow-lg shadow-slate-200/50 dark:shadow-none text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-radial from-emerald-500/5 via-transparent to-transparent pointer-events-none" />
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 mb-2 block">
                Your Next Step
              </span>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
                Start your own nutrition journey.
              </h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
                No rigid diets or confusing metrics. Just clear, unhurried visibility into your
                daily protein, calories, and hydration.
              </p>
              <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link to="/register">
                  <Button variant="primary" size="md" rightIcon={<ArrowRight className="w-4 h-4" />}>
                    Get Started Free
                  </Button>
                </Link>
                <Link to="/blogs">
                  <Button variant="ghost" size="md">
                    Explore more stories
                  </Button>
                </Link>
              </div>
            </div>
          </section>
        </article>
      </main>

      <PublicFooter />
    </div>
  )
}
