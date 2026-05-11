import { render, screen } from '@testing-library/react'
import { Pill } from './Pill'

describe('Pill', () => {
  it('renders children', () => {
    render(<Pill>Draft</Pill>)
    expect(screen.getByText('Draft')).toBeInTheDocument()
  })

  it('renders with each tone without throwing', () => {
    const tones = ['neutral', 'paper', 'accent', 'good', 'danger', 'solid', 'plum'] as const
    tones.forEach(tone => {
      const { unmount } = render(<Pill tone={tone}>{tone}</Pill>)
      expect(screen.getByText(tone)).toBeInTheDocument()
      unmount()
    })
  })
})
