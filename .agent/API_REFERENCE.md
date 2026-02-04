# Follo Repository API Reference

Quick lookup for all repository methods to avoid confusion.

---

## calendarEventRepository
| Method | Parameters | Returns | Notes |
|--------|------------|---------|-------|
| `getByDay` | `(profileId, date: YYYY-MM-DD)` | `CalendarEvent[]` | Main timeline query |
| `getPendingToday` | `(profileId)` | `CalendarEvent[]` | Widget/notifications |
| `getUpcoming` | `(profileId, hours=24)` | `CalendarEvent[]` | Next N hours pending |
| `getBySource` | `(sourceId)` | `CalendarEvent[]` | Events for a medication/etc |
| `getById` | `(id)` | `CalendarEvent \| null` | Single event |
| `create` | `(CreateCalendarEventInput)` | `CalendarEvent` | |
| `createBatch` | `(inputs[])` | `CalendarEvent[]` | For recurring |
| `update` | `(id, UpdateCalendarEventInput)` | `CalendarEvent \| null` | |
| `updateStatus` | `(id, status, completedTime?)` | `boolean` | Quick status update |
| `markCompleted` | `(id)` | `boolean` | Shorthand |
| `markMissed` | `(id)` | `boolean` | Shorthand |
| `markSkipped` | `(id)` | `boolean` | Shorthand |
| `delete` | `(id)` | `boolean` | |
| `deleteBySource` | `(sourceId)` | `number` | When entity deleted |
| `getOverdue` | `(profileId)` | `CalendarEvent[]` | Past pending events |
| `getStats` | `(profileId, startDate, endDate)` | `{total, completed, missed, skipped, pending}` | |

---

## medicationRepository
| Method | Parameters | Returns | Notes |
|--------|------------|---------|-------|
| `getAllByProfile` | `(profileId)` | `Medication[]` | |
| `getActiveByProfile` | `(profileId)` | `Medication[]` | isActive=true only |
| `getById` | `(id)` | `Medication \| null` | |
| `create` | `(CreateMedicationInput)` | `Medication` | Requires refillThreshold |
| `update` | `(id, UpdateMedicationInput)` | `Medication \| null` | |
| `delete` | `(id)` | `boolean` | |
| `getLowStock` | `(profileId)` | `Medication[]` | qty < threshold |
| `updateQuantity` | `(id, newQuantity)` | `boolean` | |

---

## medicationHistoryRepository
| Method | Parameters | Returns | Notes |
|--------|------------|---------|-------|
| `getByProfileDateRange` | `(profileId, startISO, endISO)` | `MedicationHistory[]` | For reports |
| `getByMedication` | `(medicationId, limit?)` | `MedicationHistory[]` | |
| `create` | `(CreateMedicationHistoryInput)` | `MedicationHistory` | |
| `getAdherenceStats` | `(profileId, days)` | `{taken, missed, skipped, total}` | |

---

## appointmentRepository
| Method | Parameters | Returns | Notes |
|--------|------------|---------|-------|
| `getAllByProfile` | `(profileId)` | `Appointment[]` | |
| `getUpcoming` | `(profileId, limit?)` | `Appointment[]` | Future only |
| `getPast` | `(profileId, limit?)` | `Appointment[]` | |
| `getById` | `(id)` | `Appointment \| null` | |
| `create` | `(CreateAppointmentInput)` | `Appointment` | |
| `update` | `(id, UpdateAppointmentInput)` | `Appointment \| null` | |
| `delete` | `(id)` | `boolean` | |

---

## profileRepository
| Method | Parameters | Returns | Notes |
|--------|------------|---------|-------|
| `getAll` | `()` | `Profile[]` | |
| `getById` | `(id)` | `Profile \| null` | |
| `getPrimary` | `()` | `Profile \| null` | isPrimary=true |
| `create` | `(CreateProfileInput)` | `Profile` | |
| `update` | `(id, UpdateProfileInput)` | `Profile \| null` | |
| `delete` | `(id)` | `boolean` | |
| `setPrimary` | `(id)` | `boolean` | Clears other primaries |

---

## activityRepository
| Method | Parameters | Returns | Notes |
|--------|------------|---------|-------|
| `getByDateRange` | `(profileId, startISO, endISO)` | `Activity[]` | |
| `getByType` | `(profileId, type)` | `Activity[]` | |
| `create` | `(CreateActivityInput)` | `Activity` | |
| `delete` | `(id)` | `boolean` | |
| `getRecentByType` | `(profileId, type, limit)` | `Activity[]` | |

---

## Key Naming Patterns

- **`getByDay`** = exact date (YYYY-MM-DD string)
- **`getByDateRange`** = ISO datetime range (start/end)
- **`getUpcoming`** = future from now
- **`getPending*`** = status='pending' filter
- **`getAllByProfile`** = all records for profile
- **`getActiveByProfile`** = filtered by isActive
