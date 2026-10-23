export type BlogCategory =
  | 'Getting Started'
  | 'Protein & Nutrition'
  | 'Everyday Habits'
  | 'Progress & Reflection'

export interface BlogSection {
  title: string
  content: string[]
}

export interface BlogStory {
  id: string
  slug: string
  number: string
  category: BlogCategory
  headline: string
  summary: string
  readTime: string
  publishedDate: string
  videoSrc: string
  videoCaption: string
  aspectRatio?: '16/9' | '9/16'
  posterSrc?: string
  intro: string[]
  sections: BlogSection[]
  conclusion: string[]
  keyTakeaways: string[]
  disclosure: string
}
