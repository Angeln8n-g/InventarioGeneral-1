# Requirements Document: Cable Measurement Calculator

## Introduction

This feature implements an advanced cable consumption and return management system for consumables measured in meters or feet. The system replaces manual quantity input with a marker-based calculation system that uses start and end numbering from cable markings, providing precise tracking and reducing human error.

## Glossary

- **Cable Consumable**: Any consumable item whose unit of measure is meters (m) or feet (ft), typically cables with sequential numbering
- **Cable Marker**: The numerical marking printed on cables indicating position/length (e.g., "150m", "200m")
- **Start Marker**: The initial numerical position on the cable before consumption
- **End Marker**: The final numerical position on the cable after consumption
- **Consumed Length**: The calculated difference between end marker and start marker
- **Return Segment**: A portion of consumed cable that is being returned to inventory
- **Measurement Calculator**: The UI component that captures start/end markers and calculates length
- **System**: The Inventory Management System
- **User**: Any authenticated person consuming or returning cable consumables

## Requirements

### Requirement 1: Cable Identification

**User Story:** As a user, I want the system to automatically detect when I'm working with cable consumables, so that I can use the appropriate input method for my item type.

#### Acceptance Criteria

1. WHEN a user selects a consumable for consumption or return, THE System SHALL check if the unit_of_measure is "metros" OR "pies" OR "m" OR "ft"
2. WHEN the unit_of_measure matches cable units, THE System SHALL display the measurement calculator interface instead of the standard quantity input
3. WHEN the unit_of_measure does not match cable units, THE System SHALL display the standard quantity input interface
4. THE System SHALL maintain consistent detection logic across consumption and return workflows

### Requirement 2: Consumption with Measurement Calculator

**User Story:** As a user consuming cable, I want to input the start and end marker numbers from the cable, so that the system accurately calculates how much cable I used.

#### Acceptance Criteria

1. WHEN a user selects a cable consumable for consumption, THE System SHALL display a measurement calculator with two input fields labeled "Número Inicial" and "Número Final"
2. WHEN the user enters both start and end markers, THE System SHALL calculate consumed_length as (end_marker - start_marker)
3. WHEN the calculated consumed_length is less than or equal to zero, THE System SHALL display an error message "El número final debe ser mayor que el número inicial"
4. WHEN the calculated consumed_length exceeds available stock, THE System SHALL display an error message indicating insufficient stock
5. WHEN the user confirms the consumption, THE System SHALL record the start_marker, end_marker, and calculated consumed_length in the database
6. THE System SHALL update the consumable stock by subtracting the consumed_length

### Requirement 3: Return with Measurement Calculator

**User Story:** As a user returning unused cable, I want to input the start and end markers of the segment I'm returning, so that the system accurately credits the returned length to inventory.

#### Acceptance Criteria

1. WHEN a user selects a cable consumable for return, THE System SHALL display a measurement calculator with fields for "Numeración Inicial del Tramo" and "Numeración Final del Tramo"
2. WHEN the user enters both segment markers, THE System SHALL calculate return_length as (segment_end - segment_start)
3. WHEN the calculated return_length is less than or equal to zero, THE System SHALL display an error message "La numeración final debe ser mayor que la inicial"
4. WHEN the calculated return_length exceeds the originally consumed length for that consumption record, THE System SHALL display an error message "No puedes devolver más de lo que consumiste"
5. WHEN the user confirms the return, THE System SHALL record the segment_start, segment_end, and calculated return_length in the consumable_returns table
6. THE System SHALL update the consumable stock by adding the return_length

### Requirement 4: Validation of Marker Inputs

**User Story:** As a user, I want the system to validate my marker inputs, so that I don't accidentally enter invalid data.

#### Acceptance Criteria

1. WHEN a user enters a marker value, THE System SHALL accept only positive numeric values
2. WHEN a user enters non-numeric characters, THE System SHALL prevent the input and display a validation message
3. WHEN a user leaves marker fields empty, THE System SHALL display an error message "Ambos campos son requeridos"
4. WHEN a user enters decimal values, THE System SHALL accept them and calculate with precision to 2 decimal places
5. THE System SHALL display the calculated length in real-time as the user types

### Requirement 5: Visual Calculator Interface

**User Story:** As a user, I want a clear and intuitive calculator interface, so that I can easily understand what information to provide.

#### Acceptance Criteria

1. THE System SHALL display a calculator icon or visual indicator when the measurement calculator is active
2. THE System SHALL show helper text explaining "Ingresa la numeración que aparece en el cable"
3. WHEN the user enters valid markers, THE System SHALL display the calculated result prominently with the format "Cantidad calculada: X metros/pies"
4. THE System SHALL use visual cues (colors, icons) to indicate valid vs invalid calculations
5. THE System SHALL maintain consistent styling with the existing consumables interface

### Requirement 6: Database Schema for Cable Tracking

**User Story:** As a system administrator, I want cable consumption and return data properly stored, so that we can audit and track cable usage accurately.

#### Acceptance Criteria

1. THE System SHALL store start_marker and end_marker fields in the stock_movements table for consumption records
2. THE System SHALL store segment_start and segment_end fields in the consumable_returns table for return records
3. WHEN querying consumption history, THE System SHALL include marker information in the response
4. WHEN generating reports, THE System SHALL display marker ranges alongside quantities
5. THE System SHALL maintain referential integrity between consumption and return records

### Requirement 7: Return Segment Validation

**User Story:** As a user, I want the system to prevent me from returning the same cable segment twice, so that inventory remains accurate.

#### Acceptance Criteria

1. WHEN a user attempts to return a cable segment, THE System SHALL check if any overlapping segment has already been returned for that consumption record
2. WHEN an overlapping segment is detected, THE System SHALL display an error message "Este tramo ya fue registrado como devuelto"
3. WHEN validating segments, THE System SHALL consider a segment overlapping if (new_start < existing_end) AND (new_end > existing_start)
4. THE System SHALL allow non-overlapping segments from the same consumption to be returned separately
5. THE System SHALL display a visual representation of already-returned segments when available

### Requirement 8: Backward Compatibility

**User Story:** As a system administrator, I want the new calculator feature to work alongside existing consumption records, so that historical data remains accessible.

#### Acceptance Criteria

1. WHEN displaying consumption history for cables, THE System SHALL show marker information when available
2. WHEN marker information is not available (legacy records), THE System SHALL display only the quantity consumed
3. WHEN processing returns for legacy consumption records without markers, THE System SHALL fall back to standard quantity-based returns
4. THE System SHALL not require migration of existing consumption records
5. THE System SHALL clearly indicate in the UI whether a consumption record has marker information

### Requirement 9: Mobile Responsiveness

**User Story:** As a mobile user, I want the measurement calculator to work well on my device, so that I can record cable usage in the field.

#### Acceptance Criteria

1. WHEN accessing the calculator on mobile devices, THE System SHALL display input fields with appropriate sizing for touch input
2. WHEN using the calculator on mobile, THE System SHALL trigger numeric keyboards for marker input fields
3. THE System SHALL ensure all calculator elements are accessible without horizontal scrolling on screens ≥ 320px wide
4. THE System SHALL maintain readability of calculated results on small screens
5. THE System SHALL provide adequate touch targets (minimum 44x44px) for all interactive elements

### Requirement 10: Error Recovery and User Guidance

**User Story:** As a user, I want helpful error messages and guidance, so that I can successfully complete cable transactions even if I make mistakes.

#### Acceptance Criteria

1. WHEN a validation error occurs, THE System SHALL display the error message in both English and Spanish based on user language preference
2. WHEN the user corrects an error, THE System SHALL clear the error message immediately
3. THE System SHALL provide example marker formats (e.g., "Ejemplo: 150, 200.5") near input fields
4. WHEN the calculated length seems unusually large (>1000 units), THE System SHALL display a confirmation prompt "¿Estás seguro? La cantidad calculada es muy grande"
5. THE System SHALL provide a "¿Cómo funciona?" help button that explains the marker system
