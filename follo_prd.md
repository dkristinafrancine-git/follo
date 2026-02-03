# Follo: Product Requirements Document

**Version:** 1.0  
**Last Updated:** January 22, 2026  
**Product Owner:** OneDollarApp SDS  
**Target Platform:** Android (Cross-platform ready)

---

## 1. Executive Summary

### 1.1 Product Vision
Follo is an **offline-first, privacy-centric health tracking application** that empowers users to manage their daily health routines through intelligent medication tracking, appointment management, activity logging, and supplement monitoring. The app provides a unified calendar-based interface with advanced features like OCR medication scanning, customizable notifications, home widgets, and optional Health Connect synchronization. Multi-language support is a priority.

### 1.2 Core Value Proposition
- **Single Source of Truth:** Unified calendar-based architecture for all health events
- **Offline-First:** Full functionality without internet connectivity
- **Privacy-Focused:** No mandatory data collection; optional cloud sync via Health Connect
- **Intelligent Automation:** OCR scanning paired with medication database integration for more accurate medication name scanning + medication history database for smarter identification of medication name, smart notifications, and home widgets
- **Multi-User Support:** Caregiver-friendly with profile switching
- **Multi-Language Support:** Support for multiple languages

---

## 2. User Personas

### 2.1 Primary Persona: Sarah (Chronic Condition Manager)
- **Age:** 45-65
- **Context:** Manages multiple medications for diabetes and hypertension
- **Needs:** Reliable reminders, adherence tracking, medication information, home widgets, and smart notifications
- **Pain Points:** Forgetting doses, refill management, doctor visit preparation

### 2.2 Secondary Persona: Michael (Caregiver)
- **Age:** 30-50
- **Context:** Manages health tracking for elderly parent
- **Needs:** Multi-profile management, emergency information access
- **Pain Points:** Remote monitoring, ensuring compliance

### 2.3 Tertiary Persona: Emma (Health Optimizer)
- **Age:** 25-35
- **Context:** Tracks supplements and wellness activities
- **Needs:** Trend analysis, export capabilities, Health Connect sync
- **Pain Points:** Data silos, manual logging overhead

---

## 3. Core Features

### 3.1 Health Action Types (4 Core Actions)

#### 3.1.1 Medications
**Purpose:** Track prescription and OTC medications with intelligent reminders

**Key Capabilities:**
- **OCR Scanning:** Capture medication details from prescription labels
- **Medication Database:** Auto-complete with drug name, dosage forms, interactions
- **Scheduling:** One-time, daily, custom intervals, "as needed"
- **Adherence Tracking:** Taken/Missed/Skipped/Postponed states
- **Refill Reminders:** Configurable threshold alerts
- **Photo Attachment:** Store pill images for identification
- **Notes:** Custom instructions per medication
- **Medication History:** Track medication history for smarter identification of medication name

**Data Fields:**
```typescript
interface Medication {
  id: string;
  profileId: string;
  name: string; // From OCR or database
  dosage: string; // e.g., "500mg"
  form: string; // Tablet, Capsule, Liquid, etc.
  frequency: RecurrenceRule; // Custom recurrence
  timeOfDay: string[]; // ["08:00", "20:00"]
  refillThreshold: number; // Days before refill alert
  currentQuantity: number;
  photoUri?: string;
  notes?: string;
  isActive: boolean;
  createdAt: string; // UTC ISO
  updatedAt: string; // UTC ISO
}
```

#### 3.1.2 Appointments
**Purpose:** Manage medical appointments with preparation tools

**Key Capabilities:**
- **Appointment Details:** Doctor name, specialty, location, reason
- **Pre-Appointment Checklist:** Custom tasks (e.g., "Bring lab results")
- **Photo Attachments:** Store doctor photos, clinic logos
- **Reminders:** Configurable pre-appointment notifications
- **Notes:** Post-visit summaries, prescriptions received

**Data Fields:**
```typescript
interface Appointment {
  id: string;
  profileId: string;
  title: string; // e.g., "Dr. Smith - Cardiology Checkup"
  doctorName: string;
  specialty?: string;
  location: string;
  scheduledTime: string; // UTC ISO
  duration: number; // Minutes
  reason?: string;
  photoUri?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
```

#### 3.1.3 Activities
**Purpose:** Log health-related activities and habits

**Key Capabilities:**
- **Activity Types:** Exercise, Sleep, Hydration, Meals, Vital Signs, Supplements, Symptoms
- **Quick Logging:** One-tap entry from widget or timeline
- **Custom Metrics:** User-defined measurement fields
- **Trend Visualization:** Activity frequency and patterns

**Data Fields:**
```typescript
interface Activity {
  id: string;
  profileId: string;
  type: string; // "Exercise", "Sleep", "Water", etc.
  value?: number; // e.g., 30 (minutes), 8 (glasses)
  unit?: string; // "minutes", "glasses", "steps"
  startTime: string; // UTC ISO
  endTime?: string; // UTC ISO
  notes?: string;
  createdAt: string;
}
```

#### 3.1.4 Supplements
**Purpose:** Track vitamins, minerals, and dietary supplements

**Key Capabilities:**
- **Supplement Library:** Pre-populated database of common supplements
- **Custom Scheduling:** Independent from medications
- **Stack Management:** Group supplements (e.g., "Morning Stack")
- **Adherence Tracking:** Same states as medications
- **Inventory Management:** Low-stock alerts
- **Medication History:** Track supplement history for smarter identification of supplement name

**Data Fields:**
```typescript
interface Supplement {
  id: string;
  profileId: string;
  name: string;
  dosage: string; // e.g., "1000 IU"
  form: string; // Tablet, Gummy, Liquid
  frequency: RecurrenceRule;
  timeOfDay: string[];
  currentQuantity: number;
  lowStockThreshold: number;
  photoUri?: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string; 
}
```

---

### 3.2 OCR + Medication Database

#### 3.2.1 OCR Scanning (Vision API / ML Kit)
**Purpose:** Extract medication details from prescription labels

**Implementation:**
- **Technology:** Google ML Kit Text Recognition v2
- **Scan Targets:** Prescription labels, pill bottles, pharmacy receipts
- **Extracted Fields:**
  - Medication name
  - Dosage and form
  - Prescribing doctor
  - Pharmacy details
  - Refill information

**User Flow:**
1. User taps "Scan Medication" button
2. Camera viewfinder with overlay guides
3. Capture image → ML Kit processes text
4. Extracted fields populate form (user reviews/edits)
5. Confirm and save medication

**Error Handling:**
- Low-confidence extractions flagged for manual review
- Fallback to manual entry if OCR fails

#### 3.2.2 Medication Name Database
**Purpose:** Auto-complete and validate medication names

**Data Source Options:**
1. **RxNorm (NLM):** Open-source, comprehensive drug database
2. **FDA National Drug Code (NDC) Directory:** Free, updated monthly
3. **Offline SQLite Database:** Pre-packaged subset (top 1000 medications)

**Database Schema:**
```sql
CREATE TABLE medication_reference (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  generic_name TEXT,
  brand_names TEXT, -- JSON array
  dosage_forms TEXT, -- JSON array ["Tablet", "Capsule"]
  common_strengths TEXT, -- JSON array ["500mg", "1000mg"]
  interactions TEXT, -- JSON array of interaction warnings
  category TEXT, -- "Antibiotic", "Pain Relief", etc.
  last_updated TEXT
);
```

**Integration:**
- **Search:** Fuzzy matching on user input (Fuse.js or native SQLite FTS)
- **Auto-complete:** Real-time suggestions as user types
- **Validation:** Warn if medication name not in database

---

### 3.3 Notification System (Notifee)

#### 3.3.1 Technology Stack
- **Library:** Notifee (React Native notifications)
- **Scheduling:** AlarmManager (Android) for exact timing
- **Permissions:** POST_NOTIFICATIONS (Android 13+), SCHEDULE_EXACT_ALARM

#### 3.3.2 Notification Modes

##### Mode 1: Home Mode (Default)
**Purpose:** Standard notifications for home environment

**Characteristics:**
- **Sound:** Gentle chime (custom sound file)
- **Vibration:** Single short pulse
- **Display:** Standard notification with actions
- **Persistence:** Remains until dismissed or action taken
- **Full-Screen Intent:** No (notification tray only)

**Actions:**
- ✓ Mark as Taken
- ⏰ Postpone 15min
- ✕ Skip

##### Mode 2: Heavy Sleeper Mode
**Purpose:** Intensive alerts for deep sleepers or critical medications

**Characteristics:**
- **Sound:** Loud alarm tone (looping, increasing volume)
- **Vibration:** Continuous strong pattern
- **Display:** Full-screen activity (locks screen until interaction)
- **Persistence:** Cannot be dismissed without action
- **Override:** Bypasses Do Not Disturb settings

**Actions:**
- ✓ Mark as Taken (requires unlock)
- ⏰ Snooze 5min (max 3 times)

**UI Differentiation:**
- **Home Mode:** Green accent color
- **Heavy Sleeper Mode:** Blue accent color
- **Mode Label:** Displayed on alarm screen ("Home Mode" / "Heavy Sleeper Mode")

#### 3.3.3 Notification Scheduling
**Architecture:**
- **Background Worker:** Expo Background Fetch reschedules daily
- **Calendar Integration:** Queries `calendar_events` table for upcoming events
- **Pre-Scheduling Window:** 24 hours ahead
- **Notification IDs:** Composite key `${eventType}_${eventId}_${timestamp}`

**Rescheduling Triggers:**
- Medication created/updated/deleted
- Notification mode changed
- App launched after being closed >24 hours
- System reboot (via BOOT_COMPLETED receiver)

---

### 3.4 Home Screen Widget

#### 3.4.1 Widget User Interaction Model

**Purpose:** The home screen widget serves as the **primary user interface** for health management actions, enabling users to interact with their health routine without opening the full application.

> [!IMPORTANT]
> The widget shows **main user actions** that can be toggled on/off by the user. By default, only essential actions are enabled to avoid information overload.

**Core Interaction Categories (Main User Actions):**

##### 1. Medication Actions (Always Visible)
The widget provides **direct interaction** for all medication-related actions:
- **Take:** Tap medication card to mark as taken (records in `medication_history` with `status='taken'`)
- **Skip:** Swipe or tap skip button to mark medication as skipped for current dose
- **Upcoming Medications:** List of next 3 due medications with time countdown

##### 2. Health Log Reminders (Toggleable)
The widget displays **contextual reminders** for health logging activities:
- **Log Action Button:** Tapping opens the app directly to the health log entry screen for quick symptom/activity logging
- **Activity Prompts:** "Log a symptom" or "How are you feeling?" contextual reminders
- **Quick Log Types:** Symptom, Exercise, Water, Meal, Mood
- **Streak Indicators:** Visual cues for maintaining logging consistency

##### 3. Refill Reminders (Toggleable)
The widget shows **proactive medication refill alerts**:
- **Refill Alert Banner:** Appears when medication quantity ≤ `refill_threshold` (default: 7 days)
- **Tap to Action:** Opens medication details to update quantity or set reminder
- **Visual Priority:** Red accent color for critical refills (≤3 days supply)
- **List View:** All medications needing refill within 7 days

##### 4. Quick Stats (Toggleable)
Minimal statistics display:
- **Adherence %:** Today's medication adherence percentage
- **Activities Logged:** Count of today's logged activities
- **Next Appointment:** Countdown to next scheduled appointment

**Design Principle:** The widget is designed for **zero-friction health management** - users can complete their most frequent health tasks (taking medications, logging health activities, checking refills) directly from their home screen without navigating through the full app interface.

#### 3.4.2 Widget Types

##### Widget 1: Upcoming Medication Timeline
**Size:** 4x2 (resizable)

**Content:**
- **Header:** Current time, next medication in X hours
- **Timeline:** Next 3 upcoming medications
  - Medication name (respects "Hide Name" setting)
  - Dosage and time
  - Medication photo (circular)
  - Notes (if present)
- **Quick Stats Row:**
  - 📊 Adherence: "85%" (today's adherence %)
  - 📝 Activities: "3 logged" (today's activity count)
  - 📅 Next Appt: "Jan 25, 2PM" (or "None scheduled")
- **Refill Alert Banner:** If any medication <7 days to refill

**Actions:**
- Tap medication → Mark as Taken
- Long-press → Open medication details
- Tap header → Open app to timeline

**Background:** Dark gradient with medication photo overlay (subtle)

##### Widget 2: Quick Log (Future Enhancement)
**Size:** 2x1

**Content:**
- **Quick Activity Buttons:** Water, Exercise, Meal, Sleep
- **Single tap logs activity with current timestamp**

#### 3.4.2 Widget Data Flow
**Native Module Bridge:**
```typescript
// TypeScript (React Native)
widgetService.updateWidget(widgetData);

// Kotlin (Native Module)
@ReactMethod
fun updateWidget(data: ReadableMap) {
  val context = reactApplicationContext
  val intent = Intent(context, MedicationWidgetProvider::class.java)
  intent.action = AppWidgetManager.ACTION_APPWIDGET_UPDATE
  // Update SharedPreferences with data
  // Trigger RemoteViews update
}
```

**Update Triggers:**
- Medication taken/skipped
- New medication created
- Medication postponed
- App brought to foreground
- Every 15 minutes (background update)

#### 3.4.3 Widget Improvements (Requested)
- **Adaptive Theming:** Follows system Material You colors
- **Font:** Gabarito for medication names (improved readability)
- **Interactive Elements:**
  - ✓ Swipe gesture on medication → Mark as Taken
  - ⏰ "Postpone 15min" button directly on widget
- **Contextual Display:** Shows only meds for active profile
- **Loading States:** Skeleton UI while fetching data

---

### 3.5 Health Connect Integration

#### 3.5.1 Purpose
Optional synchronization with Android Health Connect for cross-app data sharing

#### 3.5.2 User Flow
1. **Opt-In:** User navigates to Settings → Health Connect
2. **Google Sign-In:** Triggered only when user taps "Connect to Health Connect"
3. **Permissions Request:** Health Connect requests data type permissions
4. **Sync Options:**
   - Medications → Health Connect (MedicationRecord)
   - Activities → Health Connect (ExerciseSession, Steps, etc.)
   - Appointments → Not synced (HC limitation)
   - Supplements → Health Connect (NutritionRecord)

#### 3.5.3 Data Handling
**Privacy Principles:**
- **No Cloud Storage:** Follo does not store user data on servers
- **Google Sign-In Scope:** Only used for Health Connect API authentication
- **User Control:** Can disconnect Health Connect anytime
- **Sync Direction:** Bidirectional (Follo ↔ Health Connect)

**Implementation:**
```typescript
// Health Connect Service
interface HealthConnectService {
  connect(): Promise<boolean>;
  disconnect(): Promise<void>;
  syncMedication(med: Medication): Promise<void>;
  syncActivity(activity: Activity): Promise<void>;
  fetchExternalData(): Promise<HealthData[]>;
}
```

**Sync Strategy:**
- **Manual Sync:** User-initiated from settings
- **Background Sync:** Daily at 2AM (if enabled in settings)
- **Conflict Resolution:** Last-write-wins (timestamp-based)

---

### 3.6 PDF Export

#### 3.6.1 Export Types

##### Export 1: Health Summary Report
**Content:**
- **Header:** Profile name, date range, export timestamp
- **Sections:**
  - Medications (active list with schedules)
  - Appointments (past and upcoming)
  - Activities (aggregated by type)
  - Supplements (active list)
  - Adherence Statistics (charts and percentages)
  - Care Metrics (My Flow summary)

**Format:** Multi-page PDF with branded header/footer

##### Export 2: Medication Log
**Content:**
- **Filters:** Date range, specific medication
- **Table Columns:** Date, Time, Medication, Dosage, Status, Notes
- **Summary:** Adherence % for selected period

##### Export 3: Emergency Summary (Quick Access)
**Content:**
- **Profile:** Name, DOB, blood type, allergies
- **Current Medications:** List with dosages
- **Emergency Contacts:** Phone numbers
- **Recent Appointments:** Last 3 visits
- **QR Code:** Embedded for Emergency ID

**Use Case:** Print and carry in wallet

#### 3.6.2 Technical Implementation
**Library:** `react-native-pdf-lib` or `react-native-html-to-pdf`

**Generation Flow:**
1. User selects export type and date range
2. App queries database for relevant data
3. HTML template populated with data
4. PDF rendered in background
5. Save to device storage (Documents/Follo/)
6. Share sheet presented (Email, Drive, Print)

---

### 3.7 Emergency ID & QR Scanner

#### 3.7.1 Emergency ID Card
**Purpose:** Store critical medical information for first responders

**Accessible From:**
- Lock screen shortcut (Android 14+ Medical ID)
- App home screen (Emergency ID button)
- Exported PDF QR code

**Data Fields:**
- Full name
- Date of birth
- Blood type
- Allergies (medications, food, environment)
- Current medications
- Medical conditions
- Emergency contacts (2)
- Organ donor status
- Notes (e.g., "Type 1 Diabetic - Check glucose")

**Display Format:**
- **Lock Screen:** Text-only (Android system limitations)
- **App Screen:** Rich UI with icons and QR code
- **PDF Export:** Formatted card template

#### 3.7.2 QR Code Scanning
**Purpose:** Quickly populate Emergency ID when scanning another user's code

**Encoding Format:**
```json
{
  "v": 1,
  "name": "John Doe",
  "dob": "1980-05-15",
  "bloodType": "O+",
  "allergies": ["Penicillin"],
  "medications": ["Metformin 500mg", "Lisinopril 10mg"],
  "conditions": ["Type 2 Diabetes", "Hypertension"],
  "contacts": [
    {"name": "Jane Doe", "phone": "+1234567890", "relation": "Spouse"}
  ]
}
```

**User Flow:**
1. User taps "Scan Emergency ID" in scanner tab
2. Camera opens with QR viewfinder
3. Scans QR code from PDF or another device
4. Extracted data displayed for review
5. User can save as new profile or update existing

**Security:**
- QR codes are NOT encrypted (first responder access priority)
- User warned: "QR contains sensitive medical info"

---

### 3.8 My Flow

#### 3.8.1 Purpose
Personalized health insights dashboard showing trends and patterns

#### 3.8.2 Metrics Displayed

##### Adherence Trends
- **Medication Adherence:** 7-day, 30-day, 90-day percentages
- **Supplement Adherence:** Separate tracking from medications
- **Trend Line Chart:** Visual representation of daily adherence

##### Activity Patterns
- **Most Active Times:** Heatmap of logged activities by hour
- **Streak Tracking:** Consecutive days of logging activities
- **Category Breakdown:** Pie chart of activity types

##### Appointment Summary
- **Upcoming:** Next 3 appointments with countdown
- **Past:** Last 3 visits with ability to add notes
- **Frequency:** Average appointments per month

##### Health Scores (Calculated)
- **Consistency Score:** (Adherence % + Activity Logging %) / 2
- **Care Engagement:** Weighted score based on data completeness
- **Weekly Summary:** "Great week! 95% adherence, 12 activities logged"

#### 3.8.3 Customization
- **Widget Selection:** User chooses which metrics to display
- **Date Range Filters:** Last 7, 30, 90 days, or custom
- **Export to PDF:** Generates "My Flow Report"

---

### 3.9 Care Metrics

#### 3.9.1 Purpose
Advanced analytics for caregivers and health-conscious users

#### 3.9.2 Metric Categories

##### Medication Insights
- **Most Missed Medication:** Identifies compliance gaps
- **Best Adherence Time:** Hour with highest take rate
- **Postpone Frequency:** How often meds are delayed
- **Refill Prediction:** Estimated refill date based on usage

##### Activity Insights
- **Top Activity:** Most frequently logged
- **Activity Gaps:** Days without any logs
- **Goal Progress:** If user sets activity goals (e.g., "Log 5 activities/week")

##### Correlation Analysis (Future)
- **Medication vs. Activity:** Does adherence affect activity levels?
- **Appointment Follow-Up:** Tasks completed after doctor visits

#### 3.9.3 Caregiver View
**Multi-Profile Dashboard:**
- **Overview:** All managed profiles in one view
- **Alerts:** Low adherence flags, missed medications
- **Comparison:** Side-by-side adherence charts

---

### 3.10 Multi-User Profiles

#### 3.10.1 Purpose
Support caregivers managing health tracking for multiple individuals

#### 3.10.2 Profile Management

**Profile Structure:**
```typescript
interface Profile {
  id: string; // UUID
  name: string;
  avatarUri?: string; // DiceBear Lorelei Neutral if null
  birthDate?: string;
  isPrimary: boolean; // First created profile
  createdAt: string;
  updatedAt: string;
}
```

**Profile Switcher:**
- **Location:** Top of home screen (horizontal scrollable list)
- **Display:** Avatar + Name
- **Active Indicator:** Highlighted border
- **Tap to Switch:** All data filtered by active profile

#### 3.10.3 Data Isolation
**Database Architecture:**
- **All tables include `profileId` foreign key**
- **Queries filtered by active profile ID**
- **Calendar events scoped to profile**
- **Notifications generated per profile**

**Privacy:**
- **PIN Lock:** Optional per-profile PIN
- **Profile Visibility:** Can hide profiles from switcher
- **Export Isolation:** PDFs only contain selected profile data

---

## 4. Database Architecture (Single Source of Truth)

### 4.1 Design Principles
1. **Unified Calendar:** All health events stored in `calendar_events` table
2. **Event-Driven:** Domain-specific tables (medications, appointments) link to calendar
3. **UTC Storage:** All timestamps stored as UTC ISO strings
4. **Local Display:** UI converts to local timezone
5. **Immutable Log:** Medication history never deleted, only marked inactive

### 4.2 Core Schema

#### 4.2.1 Calendar Events (Single Source of Truth)
```sql
CREATE TABLE calendar_events (
  id TEXT PRIMARY KEY, -- UUID
  profile_id TEXT NOT NULL,
  event_type TEXT NOT NULL, -- 'medication_due', 'appointment', 'activity', 'supplement_due'
  source_id TEXT NOT NULL, -- ID of linked entity (medication_id, appointment_id, etc.)
  title TEXT NOT NULL,
  scheduled_time TEXT NOT NULL, -- UTC ISO timestamp
  end_time TEXT, -- For appointments, activities (UTC ISO)
  status TEXT, -- 'pending', 'completed', 'missed', 'skipped'
  completed_time TEXT, -- UTC ISO when action taken
  metadata TEXT, -- JSON blob for event-specific data
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
);

CREATE INDEX idx_calendar_profile_time ON calendar_events(profile_id, scheduled_time);
CREATE INDEX idx_calendar_source ON calendar_events(source_id);
```

#### 4.2.2 Medications
```sql
CREATE TABLE medications (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL,
  name TEXT NOT NULL,
  dosage TEXT,
  form TEXT,
  frequency_rule TEXT, -- JSON RecurrenceRule
  time_of_day TEXT, -- JSON array ["08:00", "20:00"]
  refill_threshold INTEGER DEFAULT 7,
  current_quantity INTEGER,
  photo_uri TEXT,
  notes TEXT,
  is_active INTEGER DEFAULT 1,
  hide_name INTEGER DEFAULT 0, -- Widget privacy setting
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
);
```

#### 4.2.3 Medication History
```sql
CREATE TABLE medication_history (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL,
  medication_id TEXT NOT NULL,
  scheduled_time TEXT NOT NULL, -- UTC ISO
  actual_time TEXT, -- UTC ISO when taken
  status TEXT NOT NULL, -- 'taken', 'missed', 'skipped', 'postponed'
  notes TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (medication_id) REFERENCES medications(id) ON DELETE CASCADE,
  FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
);

CREATE INDEX idx_history_medication ON medication_history(medication_id, scheduled_time DESC);
```

#### 4.2.4 Supplements
```sql
CREATE TABLE supplements (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL,
  name TEXT NOT NULL,
  dosage TEXT,
  form TEXT,
  frequency_rule TEXT,time_of_day TEXT,
  current_quantity INTEGER,
  low_stock_threshold INTEGER DEFAULT 10,
  photo_uri TEXT,
  notes TEXT,
  is_active INTEGER DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
);
```

#### 4.2.5 Supplement History
```sql
CREATE TABLE supplement_history (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL,
  supplement_id TEXT NOT NULL,
  scheduled_time TEXT NOT NULL,
  actual_time TEXT,
  status TEXT NOT NULL,
  notes TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (supplement_id) REFERENCES supplements(id) ON DELETE CASCADE,
  FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
);
```

#### 4.2.6 Appointments
```sql
CREATE TABLE appointments (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL,
  title TEXT NOT NULL,
  doctor_name TEXT,
  specialty TEXT,
  location TEXT,
  scheduled_time TEXT NOT NULL, -- UTC ISO
  duration INTEGER DEFAULT 30, -- Minutes
  reason TEXT,
  photo_uri TEXT,
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
);
```

#### 4.2.7 Activities
```sql
CREATE TABLE activities (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL,
  type TEXT NOT NULL,
  value REAL,
  unit TEXT,
  start_time TEXT NOT NULL, -- UTC ISO
  end_time TEXT,
  notes TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
);
```

#### 4.2.8 Profiles
```sql
CREATE TABLE profiles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  avatar_uri TEXT,
  birth_date TEXT,
  is_primary INTEGER DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

#### 4.2.9 Emergency Data
```sql
CREATE TABLE emergency_data (
  id TEXT PRIMARY KEY,
  profile_id TEXT UNIQUE NOT NULL,
  blood_type TEXT,
  allergies TEXT, -- JSON array
  medical_conditions TEXT, -- JSON array
  emergency_contacts TEXT, -- JSON array of {name, phone, relation}
  organ_donor INTEGER DEFAULT 0,
  notes TEXT,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
);
```

### 4.3 Data Flow: Medication Scheduling Example

**Creation Flow:**
1. User creates medication with recurrence rule (e.g., "Daily at 8AM and 8PM")
2. `medications` table: Insert new row
3. `calendar_events` table: Pre-populate next 7 days of `medication_due` events
4. **Background worker:** Runs daily to extend calendar events (maintains 7-day rolling window)

**Update Flow:**
1. User marks medication as taken at 8:05 AM
2. `medication_history` table: Insert row (status='taken', actual_time=8:05 UTC)
3. `calendar_events` table: Update status='completed', completed_time=8:05 UTC
4. **Widget service:** Refreshes widget to remove completed medication

**Query Flow (Timeline Screen):**
```sql
SELECT 
  ce.id,
  ce.event_type,
  ce.title,
  ce.scheduled_time,
  ce.status,
  m.dosage,
  m.photo_uri,
  m.notes,
  m.hide_name
FROM calendar_events ce
LEFT JOIN medications m ON ce.source_id = m.id AND ce.event_type = 'medication_due'
WHERE ce.profile_id = ? 
  AND ce.scheduled_time >= ?
  AND ce.scheduled_time < ?
ORDER BY ce.scheduled_time ASC;
```

### 4.4 Timestamp Handling & Synchronization Strategy

> [!IMPORTANT]
> **Critical Rule:** Follo follows a strict timestamp handling protocol to ensure data consistency across the unified calendar, Health Connect sync, notifications, and widgets.

#### 4.4.1 Core Principles

##### Principle 1: UTC Storage for Absolute Moments
**All actual event timestamps stored as UTC ISO 8601 strings**

```typescript
// ✅ CORRECT: Absolute moments (when something happened)
{
  scheduled_time: "2026-01-22T08:00:00.000Z",  // 8 AM UTC
  actual_time: "2026-01-22T08:05:23.000Z",     // User took at 8:05:23 UTC
  created_at: "2026-01-21T15:30:00.000Z",
  updated_at: "2026-01-22T09:00:00.000Z"
}
```

##### Principle 2: Local Time for Recurring Schedules
**User-defined recurring times stored as "HH:mm" strings (local time)**

```typescript
// ✅ CORRECT: User's preferred daily schedule
{
  time_of_day: ["08:00", "20:00"],  // 8 AM and 8 PM in user's timezone
  frequency_rule: "DAILY"
}

// Why: User expects "8 AM" to mean "8 AM local time" regardless of timezone
```

##### Principle 3: Never Compare Date Objects with ISO Strings
```typescript
// ❌ WRONG: Direct comparison leads to errors
const today = new Date();
const events = query(`WHERE scheduled_time >= ${today}`);

// ✅ CORRECT: Convert to ISO string first
const todayUTC = new Date().toISOString();
const events = query(`WHERE scheduled_time >= ?`, [todayUTC]);
```

#### 4.4.2 Calendar Event Generation

**When creating future events from recurring schedules:**

```typescript
interface RecurringMedication {
  id: string;
  time_of_day: string[];  // ["08:00", "20:00"] - LOCAL
  frequency_rule: string; // "DAILY"
  timezone?: string;      // Optional: Store user's timezone
}

function generateCalendarEvents(
  medication: RecurringMedication,
  daysAhead: number = 7
): CalendarEvent[] {
  const events: CalendarEvent[] = [];
  const userTimezone = medication.timezone || 
    Intl.DateTimeFormat().resolvedOptions().timeZone;
  
  for (let dayOffset = 0; dayOffset < daysAhead; dayOffset++) {
    const localDate = addDays(new Date(), dayOffset);
    
    medication.time_of_day.forEach(localTime => {
      // Combine local date + local time (e.g., "2026-01-22T08:00:00")
      const localDateTimeString = `${format(localDate, 'yyyy-MM-dd')}T${localTime}:00`;
      
      // Convert to UTC using user's timezone
      const utcDateTime = zonedTimeToUtc(localDateTimeString, userTimezone);
      
      events.push({
        id: uuid(),
        event_type: 'medication_due',
        source_id: medication.id,
        scheduled_time: utcDateTime.toISOString(), // ✅ Stored as UTC ISO
        status: 'pending',
        created_at: new Date().toISOString()
      });
    });
  }
  
  return events;
}

// Example Output (Manila timezone UTC+8):
// User schedules "08:00" (8 AM local)
// Generated: scheduled_time = "2026-01-22T00:00:00.000Z" (midnight UTC = 8 AM Manila)
```

#### 4.4.3 Querying "Today's" Events

**CRITICAL:** Derive UTC range from local day boundaries

```typescript
function getLocalDayUTCRange(localDate: Date = new Date()) {
  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  
  // Start of day in user's timezone (e.g., Manila 2026-01-22 00:00:00)
  const localDayStart = startOfDay(localDate);
  const utcStart = zonedTimeToUtc(localDayStart, userTimezone);
  // Result: 2026-01-21T16:00:00.000Z (UTC) = Manila Jan 22 midnight
  
  // End of day in user's timezone (e.g., Manila 2026-01-22 23:59:59)
  const localDayEnd = endOfDay(localDate);
  const utcEnd = zonedTimeToUtc(localDayEnd, userTimezone);
  // Result: 2026-01-22T15:59:59.999Z (UTC) = Manila Jan 22 11:59 PM
  
  return {
    start: utcStart.toISOString(),
    end: utcEnd.toISOString()
  };
}

// Usage: Fetch today's events
const { start, end } = getLocalDayUTCRange();
const todaysEvents = await db.executeSql(
  `SELECT * FROM calendar_events 
   WHERE profile_id = ? 
   AND scheduled_time >= ? 
   AND scheduled_time < ?
   ORDER BY scheduled_time ASC`,
  [profileId, start, end]
);
```

#### 4.4.4 Display Conversion (Always Local)

**UI must always show local time to user:**

```typescript
function formatEventTime(utcIsoString: string): string {
  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  
  // Convert UTC to user's timezone
  const localDate = utcToZonedTime(new Date(utcIsoString), userTimezone);
  
  return format(localDate, 'h:mm a, MMM d'); // "8:00 AM, Jan 22"
}

// Example:
// Database: scheduled_time = "2026-01-22T00:00:00.000Z"
// Manila user sees: "8:00 AM, Jan 22"
// New York user sees: "7:00 PM, Jan 21" (same moment, different local time)
```

#### 4.4.5 Health Connect Synchronization

**Health Connect uses epoch milliseconds (UTC-based):**

```typescript
// Follo → Health Connect (Push)
async function syncToHealthConnect(
  medication: Medication,
  history: MedicationHistory
) {
  const healthConnectRecord = {
    metadata: {
      id: history.id,
      dataOrigin: "com.onedollarapp.follo",
      recordingMethod: RecordingMethod.MANUAL_ENTRY,
      time: new Date(history.actual_time).getTime(), // UTC epoch ms
      lastModifiedTime: new Date(history.updated_at).getTime()
    },
    medication: {
      name: medication.name,
      dosage: medication.dosage
    }
  };
  
  await HealthConnect.insertRecords([healthConnectRecord]);
}

// Health Connect → Follo (Pull)
async function syncFromHealthConnect(profileId: string) {
  const { start, end } = getLocalDayUTCRange();
  
  const records = await HealthConnect.readRecords({
    recordType: 'MedicationRecord',
    timeRangeFilter: {
      startTime: new Date(start).getTime(), // Convert ISO to epoch
      endTime: new Date(end).getTime()
    }
  });
  
  // Convert Health Connect records to Follo format
  const folloRecords = records.map(record => ({
    id: uuid(),
    profile_id: profileId,
    external_id: record.metadata.id,
    actual_time: new Date(record.metadata.time).toISOString(), // ✅ Back to UTC ISO
    status: 'taken',
    source: 'health_connect',
    created_at: new Date().toISOString()
  }));
  
  return folloRecords;
}
```

#### 4.4.6 Notification Scheduling

**Notifee/AlarmManager requires epoch milliseconds:**

```typescript
async function scheduleNotification(calendarEvent: CalendarEvent) {
  // Calendar event stored as UTC ISO
  const utcTime = new Date(calendarEvent.scheduled_time);
  const triggerEpoch = utcTime.getTime(); // Milliseconds since Unix epoch
  
  await notifee.createTriggerNotification(
    {
      id: calendarEvent.id,
      title: calendarEvent.title,
      body: `Time to take ${calendarEvent.metadata.dosage}`,
      android: {
        channelId: 'medication-reminders',
        pressAction: { id: 'mark-taken' }
      }
    },
    {
      type: TriggerType.TIMESTAMP,
      timestamp: triggerEpoch, // ✅ Epoch in UTC (timezone-agnostic)
      alarmManager: {
        allowWhileIdle: true,
        type: AlarmType.RTC_WAKEUP
      }
    }
  );
}

// When user changes timezone (travels):
// 1. Epoch timestamp remains valid (fires at same absolute moment)
// 2. BUT recurring schedules stay at LOCAL time
// 3. New calendar events regenerated with new timezone conversion
```

#### 4.4.7 Conflict Resolution (Bidirectional Sync)

**Last-Write-Wins based on UTC timestamps:**

```typescript
async function resolveSyncConflict(
  folloRecord: MedicationHistory,
  hcRecord: HealthConnectMedicationRecord
): Promise<MedicationHistory> {
  // Compare updated_at timestamps (both converted to UTC epoch)
  const folloTime = new Date(folloRecord.updated_at).getTime();
  const hcTime = hcRecord.metadata.lastModifiedTime;
  
  if (folloTime > hcTime) {
    // Follo is newer → Push to Health Connect
    await healthConnect.updateRecord(hcRecord.metadata.id, folloRecord);
    return folloRecord;
  } else if (hcTime > folloTime) {
    // Health Connect is newer → Update Follo
    await medicationRepository.updateHistory(folloRecord.id, {
      actual_time: new Date(hcRecord.metadata.time).toISOString(),
      updated_at: new Date(hcTime).toISOString()
    });
    
    return {
      ...folloRecord,
      actual_time: new Date(hcRecord.metadata.time).toISOString(),
      updated_at: new Date(hcTime).toISOString()
    };
  } else {
    // Timestamps equal → No conflict
    return folloRecord;
  }
}
```

#### 4.4.8 Widget Data Pipeline

**Kotlin Native Module (Android Widget):**

```kotlin
// WidgetModule.kt
fun updateWidget(context: Context) {
    val timezone = TimeZone.getDefault()
    val calendar = Calendar.getInstance(timezone)
    
    // Get UTC range for "today" in user's timezone
    calendar.set(Calendar.HOUR_OF_DAY, 0)
    calendar.set(Calendar.MINUTE, 0)
    calendar.set(Calendar.SECOND, 0)
    val startUtc = calendar.timeInMillis
    
    calendar.add(Calendar.DAY_OF_MONTH, 1)
    calendar.set(Calendar.MILLISECOND, -1)
    val endUtc = calendar.timeInMillis
    
    // Query calendar_events (stored as UTC ISO strings)
    val events = database.query(
        "SELECT * FROM calendar_events WHERE scheduled_time >= ? AND scheduled_time < ?",
        arrayOf(
            Instant.ofEpochMilli(startUtc).toString(), // Convert epoch to ISO
            Instant.ofEpochMilli(endUtc).toString()
        )
    )
    
    // Display in local time
    val dateFormatter = SimpleDateFormat("h:mm a", Locale.getDefault())
    dateFormatter.timeZone = timezone
    
    events.forEach { event ->
        val utcInstant = Instant.parse(event.scheduled_time)
        val localTime = dateFormatter.format(Date.from(utcInstant))
        
        // Update RemoteViews with localTime (e.g., "8:00 AM")
        remoteViews.setTextViewText(R.id.medication_time, localTime)
    }
}
```

#### 4.4.9 Edge Cases

##### Edge Case 1: Daylight Saving Time (DST)

```typescript
// User schedules "08:00" (8 AM) medication on March 1
// On March 10, DST starts (clocks "spring forward" 1 hour)

// ✅ CORRECT BEHAVIOR:
// - time_of_day remains "08:00" (local time)
// - calendar_events regenerated daily with current UTC offset

// March 9:  scheduled_time = "2026-03-09T16:00:00.000Z" (UTC+8, no DST)
// March 10: scheduled_time = "2026-03-10T15:00:00.000Z" (UTC+9, DST active)

// User still sees "8:00 AM" both days ✅
// Notifications fire at correct local time ✅
```

**Implementation:**
- Background worker detects timezone offset changes
- Regenerates upcoming calendar_events with new offset
- Already-scheduled notifications remain valid (epoch is absolute)

##### Edge Case 2: Traveling Across Timezones

**Scenario:** User in Manila (UTC+8) travels to New York (UTC-5)

**Option 1: Keep Original Timezone (RECOMMENDED for MVP)**
```typescript
// Store timezone with medication
interface Medication {
  // ...
  timezone: string; // "Asia/Manila"
}

// Alarm fires at 8 AM Manila time = 9 PM New York time
// User setting: "Lock to home timezone" (default: enabled)
```

**Option 2: Adapt to New Timezone (Future Feature)**
```typescript
// Detect timezone change on app launch
function detectTimezoneChange() {
  const currentTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const storedTz = await AsyncStorage.getItem('last_timezone');
  
  if (currentTz !== storedTz) {
    // Prompt user
    showDialog({
      title: "Timezone Changed",
      message: `Detected travel from ${storedTz} to ${currentTz}. ` +
               `Keep medication times at 8 AM ${storedTz} time, or ` +
               `switch to 8 AM ${currentTz} time?`,
      actions: ['Keep Original', 'Adapt to New']
    });
  }
}
```

##### Edge Case 3: Midnight Boundary Events

```typescript
// User in Manila schedules 11:30 PM medication
// time_of_day: "23:30" (local)

// Generated calendar event:
// scheduled_time = "2026-01-22T15:30:00.000Z" (3:30 PM UTC = 11:30 PM Manila)

// When querying "January 22" events:
const jan22Range = getLocalDayUTCRange(new Date('2026-01-22'));
// start: "2026-01-21T16:00:00.000Z" (Manila Jan 22 midnight)
// end:   "2026-01-22T15:59:59.999Z" (Manila Jan 22 11:59:59 PM)

// scheduled_time "2026-01-22T15:30:00.000Z" falls within range ✅
```

#### 4.4.10 Summary Table

| **Data Type** | **Storage Format** | **Example** | **Use Case** |
|--------------|-------------------|-------------|--------------|
| Absolute moments | UTC ISO string | `"2026-01-22T08:05:23.000Z"` | When med was taken |
| Recurring schedules | Local "HH:mm" | `["08:00", "20:00"]` | User's daily times |
| Calendar events | UTC ISO string | `"2026-01-22T00:00:00.000Z"` | Pre-generated events |
| DB queries | UTC ISO range | `start: "2026-01-21T16:00:00.000Z"` | Fetch today's events |
| UI display | Local formatted | `"8:00 AM, Jan 22"` | User-facing time |
| Notifications | Epoch milliseconds | `1737504000000` | Notifee trigger |
| Health Connect | Epoch milliseconds | `1737504323000` | HC API sync |
| Conflict resolution | Epoch comparison | `folloTime > hcTime` | Last-write-wins |

#### 4.4.11 Implementation Checklist

- [ ] All `created_at`, `updated_at`, `scheduled_time`, `actual_time` fields use UTC ISO strings
- [ ] `time_of_day` fields store local "HH:mm" format
- [ ] Query functions use `getLocalDayUTCRange()` for date filtering
- [ ] Display functions use `utcToZonedTime()` + `format()` for UI
- [ ] Health Connect sync converts ISO ↔ epoch correctly
- [ ] Notification scheduling converts ISO → epoch
- [ ] Background worker regenerates calendar events daily
- [ ] DST changes trigger calendar event regeneration
- [ ] Timezone detection implemented (future: prompt user)
- [ ] Widget queries use UTC range, displays local time

---

## 5. Offline-First Architecture

### 5.1 Principles
- **Local Database:** SQLite as primary data store
- **No Network Dependency:** Full CRUD operations work offline
- **Background Sync:** Optional Health Connect sync when online
- **Conflict Resolution:** Last-write-wins for sync conflicts

### 5.2 Technical Stack
- **Database:** Expo SQLite
- **Storage:** AsyncStorage for settings, SecureStore for PINs
- **Background Tasks:** Expo Background Fetch, Expo Notifications

### 5.3 Data Persistence
**Critical Flows:**
- Notifications scheduled even when offline (AlarmManager)
- Widget updates from local database
- PDF exports generated from SQLite data
- OCR results saved immediately to local storage

---

## 6. Privacy & Security

### 6.1 Data Storage
- **Location:** Device-only (no cloud database)
- **Encryption:** SQLite database encrypted at rest (SQLCipher)
- **Backups:** User-initiated exports to local storage or cloud (user's choice)

### 6.2 Authentication
- **PIN Lock:** Optional 4-6 digit PIN to unlock app
- **Biometric:** Fingerprint/Face unlock support
- **Timeout:** Re-lock after 5 minutes background (configurable)

### 6.3 Google Sign-In Scope
- **Usage:** Health Connect API authentication ONLY
- **Scopes:** `auth/userinfo.profile` (for display name), Health Connect permissions
- **Data Sharing:** No user data sent to Google beyond Health Connect sync
- **Revocation:** User can disconnect anytime (Settings → Health Connect → Disconnect)

---

## 7. Technical Requirements

### 7.1 Platform
- **Target:** Android SDK 33+ (Android 13+)
- **Cross-Platform:** React Native Expo SDK 52
- **Future:** iOS support (code already cross-platform ready)

### 7.2 Dependencies (Stable Versions)
```json
{
  "expo": "^52.0.0",
  "expo-sqlite": "^14.0.0",
  "react-native-vision-camera": "^4.0.0",
  "notifee": "^7.8.0",
  "@react-native-google-signin/google-signin": "^11.0.0",
  "react-native-pdf-lib": "^1.0.0",
  "expo-background-fetch": "^12.0.0",
  "react-native-svg": "^15.0.0",
  "fuse.js": "^7.0.0"
}
```

### 7.3 Native Modules
- **WidgetModule:** Kotlin module for Android widget bridge
- **OCRModule:** ML Kit Text Recognition wrapper
- **HealthConnectModule:** Health Connect API integration

---

## 8. UI/UX Requirements

### 8.1 Design System
**Following MobileVirtuoso Principles:**
- **Intentional Minimalism:** Every element serves a purpose
- **Avant-Garde Aesthetics:** Unique layouts, asymmetry, distinctive typography
- **Microinteractions:** Smooth transitions, hover states, haptic feedback
- **Accessibility:** WCAG AA compliant, high contrast mode, screen reader support

### 8.2 Typography
- **Primary Font:** Gabarito (medication names, headings)
- **Secondary Font:** Inter (body text, UI labels)

### 8.3 Color Palette
- **Primary:** Dynamic Material You theming
- **Medication Status:**
  - Taken: Green (`#4CAF50`)
  - Missed: Red (`#F44336`)
  - Skipped: Gray (`#9E9E9E`)
  - Postponed: Orange (`#FF9800`)
- **Notification Modes:**
  - Home Mode: Green accent
  - Heavy Sleeper Mode: Blue accent

### 8.4 Key Screens

#### Timeline (Main Screen)
> [!IMPORTANT]
> The main screen is called **Timeline** (not "Home"). This is the primary navigation destination.

**Layout Structure (Top to Bottom):**

1. **Profile Selector Dropdown**
   - Located at top-left with greeting ("Hi, [Name]")
   - Tap reveals dropdown to switch profiles
   - Current profile avatar displayed

2. **Date Carousel**
   - Horizontal scrollable row of date tabs (past 7 days → today → future 7 days)
   - Selected date highlighted with accent color
   - Tapping a date loads that day's schedule
   - Subtle haptic feedback on selection

3. **Stats Slider (Above Schedule)**
   - Auto-playing carousel of stat slides (adherence %, activities logged, upcoming appointments)
   - Each slide displays a single metric with descriptive sentence
   - Manual swipe navigation supported

4. **Daily Schedule View**
   - Displays events for selected date
   - Cards for: Upcoming Medication, Upcoming Appointment
   - Visual timeline layout with time indicators

5. **Quick Action Buttons**
   - "+ Add Medication" button
   - "+ Add Appointment" button
   - Prominently placed for easy access

6. **History Timeline (Vertical Scroll)**
   - Chronological list of past medication takes and health logs
   - Grouped by date headers
   - Status badges (✓ Taken, ✕ Missed, ⏳ Skipped)
   - Infinite scroll loading for older entries

**FAB Quick Actions:**
- Floating Action Button for fast entry
- Expands to: Medication, Appointment, Activity, Supplement

#### Medication Details
- **Sections:** Photo, Dosage, Schedule, Refill Status, History Chart
- **Actions:** Edit, Delete, Pause, View History

#### Scanner
- **Camera Viewfinder:** OCR overlay with guides
- **Results Screen:** Editable form with extracted data highlighted
- **Manual Entry:** Fallback button

#### My Flow Dashboard
- **Grid Layout:** Metric cards in 2-column responsive grid
- **Charts:** Adherence line chart, activity pie chart
- **Filters:** Date range selector

#### Settings
- **Sections:** Profiles, Notifications, Health Connect, Security, Export

### 8.5 Data Presentation & Null Safety
- **Requirement:** For any data types or fields that return `null` or `undefined` (e.g., missing notes, optional dosage, empty location, empty medication history, empty supplement history, empty activity history, empty appointment history), the UI must provide a **user-friendly fallback**.
- **User-Friendly Fallbacks:**
  - Instead of displaying "null" or leaving a blank space that breaks layout, use descriptive placeholders such as "No notes added", "Dosage not specified", "Location not specified", "No medication history", "No supplement history", "No activity history", "No appointment history", or "N/A".
  - For lists (e.g., Timeline, Activity Log), if no data exists for a period, display an empty state with a call-to-action (e.g., "Nothing scheduled. Tap + to add an action").
- **Consistency:** Fallbacks should be consistent across all screens, widgets, and PDF exports.

---

## 9. Success Metrics

### 9.1 User Engagement
- **Daily Active Users (DAU):** 70%+ of installs
- **Medication Adherence Rate:** >80% average
- **Widget Usage:** 50%+ of users add widget

### 9.2 Technical Performance
- **App Launch Time:** <2 seconds (cold start)
- **OCR Accuracy:** >85% field extraction success rate
- **Notification Delivery:** >99% on-time delivery
- **Crash-Free Rate:** >99.5%

### 9.3 User Satisfaction
- **App Store Rating:** 4.5+ stars
- **Feature Request:** Track top requests for roadmap prioritization
- **Support Tickets:** <5% of users require support within 30 days

---

## 10. Roadmap

### 10.1 Phase 1: MVP (Current Scope)
- ✅ 6 core health actions
- ✅ OCR + medication database
- ✅ Notifee notifications with modes (Notifee is free, always check for updated requirements)
- ✅ Home widget with quick stats, quick actions (for medication and health logs), and quick profile switcher
- ✅ PDF exports
- ✅ Emergency ID + QR scanner
- ✅ My Flow + Care Metrics
- ✅ Multi-user profiles
- ✅ Health Connect integration

### 10.2 Phase 2: Enhancements (Q2 2026)
- 📊 Advanced charting (medication effectiveness correlation)
- 🔔 Smart notification timing (ML-based optimal reminder times)
- 🌐 Multi-language support
- 📱 iOS release
- 🔗 Pharmacy integration (auto-refill orders)

### 10.3 Phase 3: Ecosystem (Q4 2026)
- ⌚ Wear OS companion app
- 🏥 Healthcare provider portal (optional data sharing)
- 🤖 AI health assistant (ChatGPT integration for med Q&A)
- 📡 Bluetooth glucose meter integration

---

## 11. Appendices

### 11.1 Glossary
- **Adherence:** Percentage of medications taken on time
- **Recurrence Rule:** iCalendar-style RRULE for event scheduling
- **Calendar Event:** Unified representation of all health actions
- **Home Mode:** Standard notification setting
- **Heavy Sleeper Mode:** Intensive alarm setting
- **Health Connect:** Android's unified health data platform

### 11.2 References
- [Health Connect Documentation](https://developer.android.com/health-and-fitness/guides/health-connect)
- [Notifee Documentation](https://notifee.app/)
- [RxNorm API](https://rxnav.nlm.nih.gov/RxNormAPIs.html)
- [ML Kit Text Recognition](https://developers.google.com/ml-kit/vision/text-recognition)

### 11.3 Open Questions
1. **Medication Interaction Checking:** Should we integrate a drug interaction API (e.g., DrugBank)?
2. **Data Export Format:** Should we support FHIR format for healthcare provider compatibility?
3. **Widget Limit:** Android allows max 5 widgets per provider—prioritize which widget types?
4. **Gamification:** Should we add achievement badges for adherence streaks?

---

**END OF PRD**
