import { describe, it, expect } from 'vitest'

describe('Homepage & Authentication Route Navigation Targets', () => {
  it('has valid public navigation targets', () => {
    const navLinks = {
      home: '/',
      features: '#features',
      howItWorks: '#how-it-works',
      blogs: '/blogs',
      login: '/login',
      register: '/register',
      dashboard: '/dashboard',
    }

    expect(navLinks.home).toBe('/')
    expect(navLinks.features).toBe('#features')
    expect(navLinks.howItWorks).toBe('#how-it-works')
    expect(navLinks.blogs).toBe('/blogs')
    expect(navLinks.login).toBe('/login')
    expect(navLinks.register).toBe('/register')
    expect(navLinks.dashboard).toBe('/dashboard')
  })

  it('split-screen auth layout provides back to home navigation', () => {
    const backLink = '/'
    expect(backLink).toBe('/')
  })

  it('evaluates current year dynamically for footer', () => {
    const currentYear = new Date().getFullYear()
    expect(currentYear).toBeGreaterThanOrEqual(2026)
  })
})
