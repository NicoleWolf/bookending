import { render, screen } from '@testing-library/react'
import axe from 'axe-core'
import { HeroGrid } from './HeroGrid'

describe('HeroGrid', () => {
  it('renders left content', () => {
    render(
      <HeroGrid
        left={<p>Left column</p>}
        right={<svg viewBox="0 0 100 100" />}
      />
    )
    expect(screen.getByText('Left column')).toBeInTheDocument()
  })

  it('right column is aria-hidden', () => {
    const { container } = render(
      <HeroGrid
        left={<p>Content</p>}
        right={<svg viewBox="0 0 100 100" />}
      />
    )
    const right = container.querySelector('[aria-hidden="true"]')
    expect(right).toBeInTheDocument()
  })

  it('has no axe violations', async () => {
    const { container } = render(
      <HeroGrid
        left={<h1>Every book starts with a first page.</h1>}
        right={<svg viewBox="0 0 100 100" />}
      />
    )
    const results = await axe.run(container)
    expect(results.violations).toHaveLength(0)
  })
})
