---
name: architecture-guardian
description: Core architecture consistency skill for maintaining pristine app structure. Use this skill when implementing new features, modifying data flows, or reviewing changes to ensure all architectural layers remain properly connected. Oversees database schema, repository patterns, service layers, UI components, and native bridges.
---

# Architecture Guardian Skill

This skill maintains architectural consistency across the Follo health app. It ensures all layers connect properly, changes propagate correctly, and the codebase remains unified and maintainable.

## Follo Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        UI LAYER                                  │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐     │
│  │  Screens  │  │Components │  │  Widgets  │  │   Hooks   │     │
│  └─────┬─────┘  └─────┬─────┘  └─────┬─────┘  └─────┬─────┘     │
└────────┼──────────────┼──────────────┼──────────────┼───────────┘
         │              │              │              │
         ▼              ▼              ▼              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     SERVICE LAYER                                │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐        │
│  │ Repository    │  │   Services    │  │   Managers    │        │
│  │ (Data Access) │  │ (Business)    │  │ (Orchestrate) │        │
│  └───────┬───────┘  └───────┬───────┘  └───────┬───────┘        │
└──────────┼──────────────────┼──────────────────┼────────────────┘
           │                  │                  │
           ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                      DATA LAYER                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              calendar_events (Single Source of Truth)    │    │
│  └─────────────────────────────────────────────────────────┘    │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐            │
│  │medications│ │appointments│ │activities│ │supplements│          │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘            │
└─────────────────────────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    NATIVE BRIDGE                                 │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐        │
│  │ WidgetModule  │  │NotificationSvc│  │HealthConnect │        │
│  │   (Kotlin)    │  │   (Notifee)   │  │   (Android)   │        │
│  └───────────────┘  └───────────────┘  └───────────────┘        │
└─────────────────────────────────────────────────────────────────┘
```

---

## Core Architectural Rules

### Rule 1: Single Source of Truth (SSOT)

**ALL health events flow through `calendar_events` table.**

```typescript
// ❌ WRONG - Querying medications directly for timeline
const meds = await db.query('SELECT * FROM medications WHERE ...');

// ✅ CORRECT - Query unified calendar_events
const events = await db.query(`
  SELECT ce.*, m.name, m.dosage, m.photo_uri
  FROM calendar_events ce
  LEFT JOIN medications m ON ce.source_id = m.id
  WHERE ce.event_type = 'medication_due'
  AND ce.profile_id = ?
`);
```

**Verification Checklist:**
- [ ] New feature queries `calendar_events` for timeline data
- [ ] Domain tables (medications, appointments) are joined, not queried directly for display
- [ ] Status updates write to BOTH domain history AND `calendar_events`

### Rule 2: Repository Pattern Consistency

Every data entity MUST have a corresponding repository with standard methods:

```typescript
interface BaseRepository<T> {
  // CRUD
  create(entity: Omit<T, 'id' | 'createdAt'>): Promise<T>;
  getById(id: string): Promise<T | null>;
  update(id: string, updates: Partial<T>): Promise<T>;
  delete(id: string): Promise<void>;
  
  // Profile-scoped
  getByProfile(profileId: string): Promise<T[]>;
  deleteByProfile(profileId: string): Promise<void>;
}

// All repositories must extend this pattern
// medicationRepository.ts
// appointmentRepository.ts
// activityRepository.ts
// supplementRepository.ts
// profileRepository.ts
// emergencyDataRepository.ts
// calendarEventRepository.ts
```

**Verification:**
- [ ] Repository file exists for each domain entity
- [ ] All methods follow naming conventions
- [ ] No direct SQL queries in components/screens

### Rule 3: Data Flow Direction

Data flows in ONE direction: **Database → Repository → Service/Hook → Component**

```
┌──────────┐    ┌────────────┐    ┌─────────┐    ┌───────────┐
│ Database │ ←→ │ Repository │ → │  Hook   │ → │ Component │
└──────────┘    └────────────┘    └─────────┘    └───────────┘
                      ↑                               │
                      └───────────────────────────────┘
                           (User Action → Repository.update)
```

**Anti-pattern detection:**
```typescript
// ❌ WRONG - Component directly accessing database
function MedicationCard() {
  const db = useDatabase();
  const [med, setMed] = useState(null);
  useEffect(() => {
    db.query('SELECT * FROM medications WHERE id = ?', [id]);
  }, []);
}

// ✅ CORRECT - Using repository via hook
function MedicationCard({ id }) {
  const { medication, isLoading } = useMedication(id);
  // Hook internally calls medicationRepository
}
```

### Rule 4: Profile Isolation

**ALL queries MUST be scoped by `profile_id`.**

```typescript
// ❌ DANGEROUS - No profile scope (data leak between profiles)
async function getAllMedications() {
  return db.query('SELECT * FROM medications');
}

// ✅ CORRECT - Profile-scoped
async function getMedications(profileId: string) {
  return db.query('SELECT * FROM medications WHERE profile_id = ?', [profileId]);
}
```

**Verification:**
- [ ] Every repository method accepts `profileId` or uses active profile
- [ ] No global queries without explicit profile scope
- [ ] Widget displays only active profile data

### Rule 5: Calendar Event Synchronization

When domain entities change, `calendar_events` MUST be updated:

```typescript
// Medication created → Create future calendar_events
async function createMedication(med: Medication): Promise<Medication> {
  // 1. Insert medication
  const created = await medicationRepository.create(med);
  
  // 2. Generate calendar events for next 7 days
  await calendarEventRepository.generateMedicationEvents(created.id, 7);
  
  // 3. Schedule notifications
  await notificationService.scheduleMedicationReminders(created.id);
  
  return created;
}

// Medication status changed → Update calendar_event
async function recordMedicationTaken(historyEntry: HistoryEntry): Promise<void> {
  // 1. Record in medication_history
  await medicationHistoryRepository.create(historyEntry);
  
  // 2. Update calendar_events status
  await calendarEventRepository.updateStatus(
    historyEntry.medicationId,
    historyEntry.scheduledTime,
    'completed'
  );
  
  // 3. Update medication quantity
  await medicationRepository.decrementQuantity(historyEntry.medicationId);
  
  // 4. Refresh widget
  await widgetService.updateWidget();
}
```

### Rule 6: Native Bridge Consistency

Native modules (Kotlin/Swift) MUST mirror TypeScript interfaces:

```kotlin
// WidgetModule.kt - Must accept same data shape as TypeScript
@ReactMethod
fun updateWidget(data: ReadableMap) {
    // data.getString("medicationName")  → matches TS interface
    // data.getString("dosage")
    // data.getString("scheduledTime")
    // data.getBoolean("hideName")
}
```

```typescript
// widgetService.ts - TypeScript interface
interface WidgetData {
  medicationName: string;
  dosage: string;
  scheduledTime: string;
  hideName: boolean;
}
```

**Verification:**
- [ ] Native module parameter names match TypeScript
- [ ] SharedPreferences keys are documented
- [ ] Widget XML IDs match RemoteViews calls

---

## Change Impact Analysis

Before implementing ANY change, evaluate impact across layers:

### Impact Matrix

| Change Type | Database | Repository | Service | Hook | Component | Widget | Notifications |
|-------------|----------|------------|---------|------|-----------|--------|---------------|
| Add field to medication | ✓ Migration | ✓ Update | - | ✓ Add to type | ✓ Display | Maybe | - |
| Add new action (postpone) | ✓ Add column | ✓ New method | ✓ Logic | ✓ Expose | ✓ Button | ✓ Action | ✓ Reschedule |
| Change notification mode | - | - | ✓ Update | - | ✓ Settings | - | ✓ Config |
| Add new entity type | ✓ New table | ✓ New file | ✓ New file | ✓ New hook | ✓ New screens | Maybe | Maybe |

### Pre-Change Checklist

Before coding, answer:

1. **Database Impact?**
   - [ ] New migration needed?
   - [ ] Affects `calendar_events` schema?
   - [ ] Breaks existing data?

2. **Repository Impact?**
   - [ ] New methods needed?
   - [ ] Existing method signatures change?
   - [ ] Need to update multiple repositories?

3. **Service Layer Impact?**
   - [ ] Business logic changes?
   - [ ] Affects notification scheduling?
   - [ ] Affects widget data?

4. **UI Impact?**
   - [ ] New components needed?
   - [ ] Existing hooks need updates?
   - [ ] Navigation changes?

5. **Native Bridge Impact?**
   - [ ] Widget module changes?
   - [ ] Notification channel changes?
   - [ ] Health Connect sync changes?

---

## Verification Procedures

### Post-Implementation Verification

Run these checks after ANY architecture change:

#### 1. Data Flow Verification
```typescript
// Test: Create medication → Verify calendar_events created
const med = await medicationRepository.create(testMedication);
const events = await calendarEventRepository.getBySourceId(med.id);
assert(events.length > 0, 'Calendar events must be created for new medication');
```

#### 2. Profile Isolation Test
```typescript
// Test: Data from profile A should NOT appear in profile B
const profile1Meds = await medicationRepository.getByProfile('profile-1');
const profile2Meds = await medicationRepository.getByProfile('profile-2');
assert(
  !profile1Meds.some(m => profile2Meds.find(m2 => m2.id === m.id)),
  'Profile data must be isolated'
);
```

#### 3. Widget Sync Verification
```typescript
// Test: Widget displays current data after update
await medicationRepository.update(medId, { name: 'Updated Name' });
await widgetService.updateWidget();
// Manually verify widget shows 'Updated Name'
```

#### 4. Notification Consistency
```typescript
// Test: Notifications match calendar_events
const scheduledNotifs = await notifee.getTriggerNotifications();
const upcomingEvents = await calendarEventRepository.getUpcoming();
assert(
  scheduledNotifs.length === upcomingEvents.length,
  'Notification count must match upcoming events'
);
```

---

## File Naming Conventions

```
src/
├── database/
│   ├── schema.ts              # Schema definitions
│   └── migrations/            # Migration files
├── repositories/
│   ├── medicationRepository.ts
│   ├── appointmentRepository.ts
│   ├── activityRepository.ts
│   ├── supplementRepository.ts
│   ├── profileRepository.ts
│   ├── calendarEventRepository.ts
│   └── index.ts               # Re-exports all
├── services/
│   ├── notificationService.ts
│   ├── widgetService.ts
│   ├── healthConnectService.ts
│   └── exportService.ts
├── hooks/
│   ├── useMedications.ts
│   ├── useTimeline.ts
│   ├── useProfile.ts
│   └── use[Entity].ts
├── components/
│   ├── cards/
│   │   ├── MedicationCard.tsx
│   │   ├── AppointmentCard.tsx
│   │   └── ActivityCard.tsx
│   └── common/
└── screens/
    ├── HomeScreen.tsx
    ├── TimelineScreen.tsx
    └── [Feature]Screen.tsx
```

---

## Breaking Change Protocol

When a change could break existing functionality:

1. **Document the change** in CHANGELOG.md
2. **Create migration** for any database changes
3. **Update all affected repositories** before changing UI
4. **Test data flow end-to-end** from DB → Widget
5. **Rebuild native modules** if Kotlin/Swift changed
6. **Clear app data** and test fresh install

### Red Flags (Stop and Review)

🚩 **Modifying `calendar_events` schema** - Impacts ALL features
🚩 **Changing repository method signatures** - Breaks all consumers
🚩 **Modifying widget SharedPreferences keys** - Breaks native bridge
🚩 **Changing notification channel IDs** - Users lose notification settings
🚩 **Altering profile_id foreign keys** - Breaks data isolation

---

## Quick Reference Card

| Layer | Responsibility | Files |
|-------|----------------|-------|
| Database | Schema, migrations | `schema.ts`, `migrations/` |
| Repository | CRUD, queries | `*Repository.ts` |
| Service | Business logic | `*Service.ts` |
| Hook | React state, data fetching | `use*.ts` |
| Component | UI rendering | `*Card.tsx`, `*Screen.tsx` |
| Native | Widgets, notifications, OS integration | `*.kt`, `*.swift` |

**Golden Rule:** If you change Layer N, verify Layers N-1 and N+1 still connect.
