import { render, screen } from '@testing-library/react'
import axe from 'axe-core'
import { ActivityRailItem } from './ActivityRailItem'

describe('ActivityRailItem', () => {
  it('renders body text and timestamp', () => {
    render(
      <ActivityRailItem dotColor="#9A3324" time="2 hr ago">
        Henrik replied to your Ch. 4 note
      </ActivityRailItem>
    )
    expect(screen.getByText('Henrik replied to your Ch. 4 note')).toBeInTheDocument()
    expect(screen.getByText('2 hr ago')).toBeInTheDocument()
  })

  it('dot is aria-hidden', () => {
    const { container } = render(
      <ActivityRailItem dotColor="#3D5440" time="just now">New chapter</ActivityRailItem>
    )
    const dot = container.querySelector('[aria-hidden="true"]')
    expect(dot).toBeInTheDocument()
  })

  it('has no axe violations', async () => {
    const { container } = render(
      <ul>
        <li>
          <ActivityRailItem dotColor="#9A3324" time="2 hr ago">
            Henrik replied to your Ch. 4 note on Hollow Meridian
          </ActivityRailItem>
        </li>
      </ul>
    )
    const results = await axe.run(container)
    expect(results.violations).toHaveLength(0)
  })
})
