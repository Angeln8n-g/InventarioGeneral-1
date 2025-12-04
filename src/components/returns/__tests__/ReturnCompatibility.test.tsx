import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ReturnCartModal } from '../../returns/ReturnCartModal'
import { ReturnCartProvider } from '@/contexts/ReturnCartContext'
import { ReturnableItemsList } from '../../returns/ReturnableItemsList'
import { LanguageProvider } from '@/contexts/LanguageContext'
import { ViewTransitionsProvider } from '@/contexts/ViewTransitionsContext'

function renderWithProviders(ui: React.ReactElement) {
  return render(
    <LanguageProvider>
      <ViewTransitionsProvider>
        <ReturnCartProvider>{ui}</ReturnCartProvider>
      </ViewTransitionsProvider>
    </LanguageProvider>
  )
}

beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(() => ({
      matches: false,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    })),
  })
})

describe('Backward Compatibility - Display', () => {
  test('does not show segment info when markers are absent', async () => {
    const storageKey = 'return_cart'
    const legacyItem = {
      id: 1,
      name: 'Cable coaxial',
      quantity: 2,
      consumption_date: '2025-11-01',
      max_returnable: 10,
      unit_of_measure: 'm',
      consumable_stock_id: 100,
      unique_key: '1-2025-11-01-100',
    }
    const segmentItem = {
      id: 2,
      name: 'Cable UTP',
      quantity: 3,
      consumption_date: '2025-11-01',
      max_returnable: 20,
      unit_of_measure: 'm',
      consumable_stock_id: 200,
      segment_start: 5,
      segment_end: 12,
      unique_key: '2-2025-11-01-200-5-12',
    }
    localStorage.setItem(storageKey, JSON.stringify([legacyItem, segmentItem]))

    renderWithProviders(<ReturnCartModal isOpen={true} onClose={() => {}} onConfirm={async () => {}} />)

    expect(screen.getByText('Carrito de Devolución')).toBeInTheDocument()
    expect(screen.getByText('Cable coaxial')).toBeInTheDocument()
    expect(screen.getByText('Cable UTP')).toBeInTheDocument()

    expect(screen.queryByText(/Segmento:/)).toBeInTheDocument()
    const allSegmentLabels = screen.getAllByText(/Segmento:/)
    expect(allSegmentLabels.length).toBe(1)
  })
})

describe('Backward Compatibility - Returns', () => {
  test('allows quantity-based return for legacy mode on cable items', async () => {
    const items = [
      {
        item_type_id: 10,
        consumable_stock_id: 500,
        item_name: 'Cable HDMI',
        item_description: 'High-speed',
        consumed_quantity: 8,
        returned_quantity: 0,
        returnable_quantity: 8,
        unit_of_measure: 'm',
      },
    ]

    renderWithProviders(
      <ReturnableItemsList items={items as any} consumptionDate={'2025-11-02'} />
    )

    expect(screen.getByText('Cable HDMI')).toBeInTheDocument()
    expect(screen.getByText('Marcadores activos')).toBeInTheDocument()
    expect(screen.getByText('Segment Start Number')).toBeInTheDocument()

    const checkbox = screen.getByLabelText('Devolver sin marcadores (legado)')
    fireEvent.click(checkbox)

    await waitFor(() => {
      expect(screen.getByText('Legado (sin marcadores)')).toBeInTheDocument()
      expect(screen.getByText('m')).toBeInTheDocument()
    })

    expect(screen.getByRole('button', { name: /Agregar al Carrito/i })).not.toBeDisabled()
    expect(screen.getByRole('spinbutton')).toBeInTheDocument()
  })
})

