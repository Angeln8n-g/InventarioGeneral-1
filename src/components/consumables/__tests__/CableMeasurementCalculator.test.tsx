import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { CableMeasurementCalculator } from '../CableMeasurementCalculator'
import { LanguageProvider } from '@/contexts/LanguageContext'

function renderWithLang(ui: React.ReactElement) {
  return render(<LanguageProvider>{ui}</LanguageProvider>)
}

describe('CableMeasurementCalculator', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  test('renders consumption mode labels', () => {
    renderWithLang(
      <CableMeasurementCalculator mode="consumption" unitOfMeasure="m" />
    )
    expect(screen.getByText('Enter the numbering printed on the cable')).toBeInTheDocument()
    expect(screen.getByText('Start Number')).toBeInTheDocument()
    expect(screen.getByText('End Number')).toBeInTheDocument()
  })

  test('renders return mode labels', () => {
    renderWithLang(
      <CableMeasurementCalculator mode="return" unitOfMeasure="m" />
    )
    expect(screen.getByText('Segment Start Number')).toBeInTheDocument()
    expect(screen.getByText('Segment End Number')).toBeInTheDocument()
  })

  test('updates calculated length in real-time', async () => {
    renderWithLang(
      <CableMeasurementCalculator mode="consumption" unitOfMeasure="m" />
    )

    const inputs = screen.getAllByRole('spinbutton')
    fireEvent.change(inputs[0], { target: { value: '100' } })
    fireEvent.change(inputs[1], { target: { value: '150' } })

    await act(async () => {
      jest.advanceTimersByTime(200)
    })
    await waitFor(() => {
      expect(screen.getByText(/Calculated amount:/)).toBeInTheDocument()
      expect(screen.getByText(/meters/)).toBeInTheDocument()
    })
  })

  test('shows error when end <= start', async () => {
    renderWithLang(
      <CableMeasurementCalculator mode="consumption" unitOfMeasure="m" />
    )

    const inputs = screen.getAllByRole('spinbutton')
    fireEvent.change(inputs[0], { target: { value: '200' } })
    fireEvent.change(inputs[1], { target: { value: '150' } })

    await act(async () => {
      jest.advanceTimersByTime(200)
    })
    expect(
      screen.getAllByText('Final number must be greater than initial').length
    ).toBeGreaterThan(0)
  })
})
