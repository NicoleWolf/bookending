import { render, screen } from '@testing-library/react'
import axe from 'axe-core'
import { DarkHeroCard } from './DarkHeroCard'

describe('DarkHeroCard', () => {
  it('renders children', () => {
    render(<DarkHeroCard><p>Hero content</p></DarkHeroCard>)
    expect(screen.getByText('Hero content')).toBeInTheDocument()
  })

  it('applies full density', () => {
    const { container } = render(<DarkHeroCard density="full"><p>Full</p></DarkHeroCard>)
    expect(container.firstChild).toHaveAttribute('data-density', 'full')
  })

  it('defaults to compact density', () => {
    const { container } = render(<DarkHeroCard><p>Compact</p></DarkHeroCard>)
    expect(container.firstChild).toHaveAttribute('data-density', 'compact')
  })

  it('has no axe violations', async () => {
    const { container } = render(
      <DarkHeroCard density="full">
        <h1>Every book starts with a first page.</h1>
        <p>Subtitle copy goes here.</p>
        <button>Start a new manuscript</button>
      </DarkHeroCard>
    )
    const results = await axe.run(container)
    expect(results.violations).toHaveLength(0)
  })
})
