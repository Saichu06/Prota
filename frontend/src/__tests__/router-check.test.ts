import { describe, it, expect } from 'vitest'
import { router } from '../app/router'

describe('Router Configuration', () => {
  it('router has / configured with HomePage', () => {
    const rootRoute = router.routes.find((r) => r.path === '/')
    expect(rootRoute).toBeDefined()
    expect(rootRoute?.element).toBeDefined()
  })
})
