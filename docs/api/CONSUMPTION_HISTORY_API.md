# Consumption History API Documentation

## Endpoint: GET /api/consumables/my-consumption

Returns the consumption history for the authenticated user, including cable marker data and returned segments.

### Query Parameters

- `start_date` (optional): Start date for filtering (YYYY-MM-DD). Defaults to 30 days ago.
- `end_date` (optional): End date for filtering (YYYY-MM-DD).
- `item_type_id` (optional): Filter by specific item type ID.

### Response Structure

```json
{
  "data": [
    {
      "consumption_date": "2024-01-15",
      "items": [
        {
          "item_type_id": 123,
          "consumable_stock_id": 456,
          "item_name": "Cable UTP Cat6",
          "item_description": "Cable de red categoría 6",
          "consumed_quantity": 50.5,
          "returned_quantity": 10.0,
          "returnable_quantity": 40.5,
          "unit_of_measure": "metros",
          "start_marker": 100.0,
          "end_marker": 150.5,
          "returned_segments": [
            {
              "segment_start": 140.0,
              "segment_end": 150.0,
              "return_date": "2024-01-16T10:30:00Z",
              "returned_quantity": 10.0
            }
          ]
        }
      ],
      "total_items": 1,
      "total_consumed": 50.5,
      "total_returnable": 40.5
    }
  ],
  "total_dates": 1
}
```

### Cable Marker Fields

For cable-type consumables (unit_of_measure: "metros", "pies", "m", "ft"):

- `start_marker`: The starting marker number on the cable (null for legacy records)
- `end_marker`: The ending marker number on the cable (null for legacy records)
- `returned_segments`: Array of returned cable segments with:
  - `segment_start`: Starting marker of returned segment
  - `segment_end`: Ending marker of returned segment
  - `return_date`: Date when the segment was returned
  - `returned_quantity`: Calculated length of returned segment

### Legacy Record Handling

For consumption records created before the cable marker feature:
- `start_marker` will be `null`
- `end_marker` will be `null`
- `returned_segments` will be an empty array (or contain quantity-based returns without segment data)

### Example Usage

```javascript
// Fetch consumption history for the last 30 days
const response = await fetch('/api/consumables/my-consumption', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})

const { data } = await response.json()

// Check if a consumption has marker data
data.forEach(consumption => {
  consumption.items.forEach(item => {
    if (item.start_marker !== null && item.end_marker !== null) {
      console.log(`Cable consumed from marker ${item.start_marker} to ${item.end_marker}`)
      
      // Display returned segments
      item.returned_segments.forEach(segment => {
        console.log(`Returned segment: ${segment.segment_start} to ${segment.segment_end}`)
      })
    } else {
      console.log(`Legacy consumption: ${item.consumed_quantity} ${item.unit_of_measure}`)
    }
  })
})
```

### Requirements Validated

- **Requirement 6.3**: Marker information included in consumption history queries
- **Requirement 8.1**: Marker information displayed when available
- **Requirement 8.2**: Quantity-only display for legacy records (null markers)
