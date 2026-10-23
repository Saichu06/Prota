import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { ThemeProvider } from '../app/providers/ThemeProvider'
import { AuthProvider } from '../app/providers/AuthProvider'
import { BLOG_STORIES, getBlogStoryBySlug } from '../features/blogs/data/blogStories'
import { BlogsPage } from '../features/blogs/pages/BlogsPage'
import { BlogDetailPage } from '../features/blogs/pages/BlogDetailPage'

const EXPECTED_SLUGS = [
  'starting-small',
  'protein-without-the-guesswork',
  'nutrition-on-busy-days',
  'small-habits-over-time',
  'beyond-the-calorie-count',
  'progress-not-perfection',
]

describe('Prota Stories & Blogs Dataset', () => {
  it('contains exactly six required initial blog stories', () => {
    expect(BLOG_STORIES).toHaveLength(6)
    const slugs = BLOG_STORIES.map((s) => s.slug)
    expect(slugs).toEqual(EXPECTED_SLUGS)
  })

  it('configures valid video paths for each story', () => {
    const expectedVideos = [
      '/videos/blogs/video3.mp4',
      '/videos/blogs/video4.mp4',
      '/videos/blogs/video5.mp4',
      '/videos/blogs/video6.mp4',
      '/videos/blogs/video7.mp4',
      '/videos/blogs/video8.mp4',
    ]
    BLOG_STORIES.forEach((story, index) => {
      expect(story.videoSrc).toBe(expectedVideos[index])
      expect(story.headline).toBeTruthy()
      expect(story.summary).toBeTruthy()
      expect(story.readTime).toMatch(/min read/)
      expect(story.sections.length).toBeGreaterThanOrEqual(2)
      expect(story.keyTakeaways.length).toBeGreaterThanOrEqual(2)
      expect(story.disclosure).toBe('An illustrative nutrition journey inspired by everyday experiences.')
    })
  })

  it('retrieves story by slug correctly', () => {
    const found = getBlogStoryBySlug('starting-small')
    expect(found).toBeDefined()
    expect(found?.headline).toContain('Starting Point')

    const notFound = getBlogStoryBySlug('non-existent-slug')
    expect(notFound).toBeUndefined()
  })
})

describe('BlogsPage Component', () => {
  const renderBlogsPage = () => {
    const router = createMemoryRouter(
      [
        {
          path: '/blogs',
          element: <BlogsPage />,
        },
      ],
      { initialEntries: ['/blogs'] }
    )

    return render(
      <ThemeProvider>
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
      </ThemeProvider>
    )
  }

  it('renders editorial hero headline and all stories', () => {
    renderBlogsPage()
    expect(screen.getByText(/Real Stories\./i)).toBeDefined()
    expect(screen.getByText(/Everyday Progress\./i)).toBeDefined()
    expect(screen.getAllByText(/I Didn’t Need a Perfect Plan/i).length).toBeGreaterThanOrEqual(1)
  })

  it('filters stories via search input and resets properly', () => {
    renderBlogsPage()
    const searchInput = screen.getByPlaceholderText(/Search by topic, habit, or keyword/i)

    // Search for a keyword specific to protein
    fireEvent.change(searchInput, { target: { value: 'Protein Intake' } })
    expect(screen.getAllByText(/I Stopped Guessing and Started Understanding My Protein Intake/i).length).toBeGreaterThanOrEqual(1)

    // Reset filters
    const resetButton = screen.getByText(/Reset filters/i)
    fireEvent.click(resetButton)
    expect(screen.getAllByText(/I Didn’t Need a Perfect Plan/i).length).toBeGreaterThanOrEqual(1)
  })

  it('filters stories by category tab', () => {
    renderBlogsPage()
    const habitsTab = screen.getByRole('tab', { name: 'Everyday Habits' })
    fireEvent.click(habitsTab)

    expect(screen.getAllByText(/Eating Better When Every Day Feels Busy/i).length).toBeGreaterThanOrEqual(1)
  })
})

describe('BlogDetailPage Component', () => {
  const renderDetailPage = (slug: string) => {
    const router = createMemoryRouter(
      [
        {
          path: '/blogs/:slug',
          element: <BlogDetailPage />,
        },
        {
          path: '/blogs',
          element: <div>Blogs Index</div>,
        },
      ],
      { initialEntries: [`/blogs/${slug}`] }
    )

    return render(
      <ThemeProvider>
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
      </ThemeProvider>
    )
  }

  it('renders article detail page with video placeholder and registration CTA', () => {
    renderDetailPage('starting-small')

    expect(screen.getAllByText(/I Didn’t Need a Perfect Plan/i).length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText(/Editorial Film/i)).toBeDefined()
    expect(screen.getByText(/Back to all stories/i)).toBeDefined()
    expect(screen.getByText(/Start your own nutrition journey/i)).toBeDefined()
  })

  it('renders story not found fallback for invalid slug', () => {
    renderDetailPage('unknown-slug')
    expect(screen.getByText(/Story Not Found/i)).toBeDefined()
  })
})
