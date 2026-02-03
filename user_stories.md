# Follo: Comprehensive User Stories

**Version:** 1.0  
**Last Updated:** January 22, 2026  
**Related Documents:** follo_prd.md

---

## Document Structure

Each user story follows this format:

**User Story:** As a [user type], I want to [action], so that [benefit/outcome].

**User Actions:** Step-by-step actions the user takes.

**Expected Outcomes:** What the user sees/experiences at each step.

**Acceptance Criteria:** Measurable conditions for story completion.

---

## Table of Contents

1. [Onboarding & Initial Setup](#1-onboarding--initial-setup)
2. [Medication Management](#2-medication-management)
3. [Daily Routine Use](#3-daily-routine-use)
4. [Appointment Management](#4-appointment-management)
5. [Activity Logging](#5-activity-logging)
6. [Supplement Tracking](#6-supplement-tracking)
7. [Emergency ID](#7-emergency-id)
8. [My Flow & Insights](#8-my-flow--insights)
9. [Widget Usage](#9-widget-usage)
10. [Health Connect Integration](#10-health-connect-integration)
11. [Multi-Profile Management](#11-multi-profile-management)
12. [Notifications & Alarms](#12-notifications--alarms)
13. [PDF Exports](#13-pdf-exports)
14. [Settings & Customization](#14-settings--customization)
15. [Account Management & Deletion](#15-account-management--deletion)

---

## 1. Onboarding & Initial Setup

### Story 1.1: First-Time App Launch

**User Story:** As a new user, I want to be guided through initial setup, so that I can start tracking my health immediately.

**User Actions:**
1. User downloads Follo from Google Play Store
2. User opens app for the first time
3. User sees welcome screen with app overview
4. User taps "Get Started"
5. User is prompted to create first profile

**Expected Outcomes:**
- Welcome screen displays app logo, tagline, and key features (medications, appointments, activities, supplements)
- "Get Started" button is prominent and accessible
- Profile creation screen appears with fields:
  - Profile name (required)
  - Photo (optional, DiceBear avatar shown by default)
  - Birth date (optional)
- After profile creation, user sees empty timeline with onboarding tips

**Acceptance Criteria:**
- [ ] Welcome screen loads within 2 seconds
- [ ] User can create profile with just a name
- [ ] Default DiceBear avatar is generated using profile name as seed
- [ ] User creates the first medication schedule (unskippable)
- [ ] User creates the first appointment (skippable)
- [ ] User creates the first activity (skippable)
- [ ] User creates the first supplement (skippable)
- [ ] User lands on Timeline screen after profile creation
- [ ] Onboarding tooltips appear on first launch

---

### Story 1.2: Onboarding Tutorial

**User Story:** As a new user, I want to learn key app features through a tutorial, so that I can use the app effectively.

**User Actions:**
1. User completes profile creation
2. User sees interactive tutorial overlay
3. User taps through tutorial steps:
   - Step 1: Timeline overview
   - Step 2: Add medication button
   - Step 3: Quick actions FAB
   - Step 4: Profile switcher
   - Step 5: My Flow tab
4. User taps "Finish Tutorial" or "Skip"

**Expected Outcomes:**
- Spotlight highlights appear on key UI elements
- Short descriptions explain each feature (max 2 sentences)
- User can skip tutorial at any time
- Tutorial doesn't repeat on subsequent launches
- "Show Tutorial Again" option available in Settings

**Acceptance Criteria:**
- [ ] Tutorial covers 5 core features
- [ ] User can dismiss tutorial permanently
- [ ] Tutorial state saved locally (doesn't show again)
- [ ] Option to replay tutorial in Settings → Help

---

### Story 1.3: Permission Requests

**User Story:** As a new user, I want to grant necessary permissions, so that app features work correctly.

**User Actions:**
1. User completes onboarding
2. User attempts to add medication with photo scan (triggers camera permission)
3. User attempts to add widget (notification permission requested)
4. User grants or denies each permission

**Expected Outcomes:**
- Camera permission requested only when user taps "Scan Prescription"
- Notification permission requested when user adds first medication or widget
- Storage permission requested when user exports PDF
- Exact alarm permission requested when user enables Heavy Sleeper Mode
- Graceful fallback if permissions denied:
  - Camera denied → Manual entry form shown while showing user why permission is needed
  - Notifications denied → Warning: "Reminders won't work" while showing user why permission is needed
  - Storage denied → Warning: "PDF exports won't work" while showing user why permission is needed
  - Exact alarm denied → Warning: "Heavy Sleeper Mode won't work" while showing user why permission is needed

**Acceptance Criteria:**
- [ ] Permissions requested only when needed (not upfront)
- [ ] Context explanation shown before permission dialog
- [ ] App remains functional if permissions denied
- [ ] User can grant permissions later in Settings

---

## 2. Medication Management

### Story 2.1: Add Medication Manually

**User Story:** As a user, I want to add a medication manually, so that I can track my prescriptions.

**User Actions:**
1. User taps "+" FAB on timeline
2. User selects "Medication"
3. User fills out medication form
4. User taps "Save"

**Expected Outcomes:**
- Medication form opens with clear field labels
- Auto-complete suggestions from medication database
- After save: medication appears on timeline, notifications scheduled
- Success toast: "Metformin added successfully"

**Acceptance Criteria:**
- [ ] Only medication name is required
- [ ] Calendar events generated for next 7 days
- [ ] Widget updates to show new medication

---

## 3. Daily Routine Use

### Story 3.1: Take Medication On Time

**User Story:** As a user, I want to log taking my medication, so that I can track adherence.

**User Actions:**
1. User receives notification at scheduled time
2. User taps "Mark as Taken"

**Expected Outcomes:**
- Notification dismissed
- Medication removed from widget
- Timeline updated with "✓ Taken" badge
- Adherence calculation updated

**Acceptance Criteria:**
- [ ] Notification delivered within ±5 seconds
- [ ] Widget updates within 5 seconds

---

## 4. Appointment Management  

### Story 4.1: Add Appointment

**User Story:** As a user, I want to schedule doctor appointments with reminders.

**User Actions:**
1. User taps "+" FAB
2. User selects "Appointment"
3. User fills appointment details
4. User taps "Save"

**Expected Outcomes:**
- Appointment appears on timeline
- Reminders scheduled (1 day before, 1 hour before)
- Widget shows "Next Appt: Jan 25, 2PM"

**Acceptance Criteria:**
- [ ] Pre-appointment notifications sent
- [ ] Appointment visible on timeline

---

## 5. Activity Logging

### Story 5.1: Log Activity

**User Story:** As a user, I want to quickly log health activities.

**User Actions:**
1. User taps "+" FAB → "Activity"
2. User selects activity type
3. User enters details

**Expected Outcomes:**
- Activity logged instantly
- My Flow count updated

**Acceptance Criteria:**
- [ ] Activity appears on timeline
- [ ] Widget quick stats updated

---

## 6. Supplement Tracking

### Story 6.1: Add Supplement

**User Story:** As a user, I want to track supplements separately from medications.

**User Actions:**
1. User adds supplement with dosage and schedule

**Expected Outcomes:**
- Supplement tracked independently
- Separate adherence calculations

**Acceptance Criteria:**
- [ ] Supplements differentiated from medications
- [ ] My Flow shows supplement adherence

---

## 7. Emergency ID

### Story 7.1: Create Emergency ID

**User Story:** As a user, I want medical information accessible to first responders.

**User Actions:**
1. User fills emergency data form
2. User saves and generates QR code

**Expected Outcomes:**
- Emergency card with QR code created
- Accessible from lock screen

**Acceptance Criteria:**
- [ ] QR code contains all emergency data
- [ ] Lock screen medical ID integration

---

## 8. My Flow & Insights

### Story 8.1: View Adherence Trends

**User Story:** As a user, I want to see adherence patterns over time.

**User Actions:**
1. User navigates to My Flow tab

**Expected Outcomes:**
- Adherence percentage displayed
- Correlation between symptoms + overall well-being and medication adherence displayed
- Trend charts shown

**Acceptance Criteria:**
- [ ] Charts accurate and updated automatically
- [ ] User can view trends for different time periods (daily, weekly, monthly)
- [ ] User can view trends for different medications
- [ ] User can view trends for different activities
- [ ] User can view trends for different supplements
- [ ] User can view trends for different symptoms
- [ ] User can view trends for different overall well-being

---

## 9. Widget Usage

### Story 9.1: Add Widget

**User Story:** As a user, I want home screen widget access with main user actions (Medication Actions, Health Log Reminders, Refill Reminders) that I can toggle on/off to avoid information overload.

**User Actions:**
1. User adds Follo widget to home screen
2. User configures widget features (enable/disable toggles)
3. User interacts with widget actions directly from home screen

**Expected Outcomes:**
- **Medication Actions** (always visible): Take/Skip medications, upcoming medication list
- **Health Log Reminders** (toggleable): Tap opens app to health log entry screen
- **Refill Reminders** (toggleable): Medications needing refill within 7 days
- **Quick Stats** (toggleable): Adherence %, activities logged, next appointment

**Acceptance Criteria:**
- [ ] Widget updates every 15 minutes
- [ ] Medication Actions always visible with Take/Postpone/Skip buttons
- [ ] Health Log reminder action opens app to log entry screen (symptom, activity, etc.)
- [ ] Refill alert banner visible when medication quantity ≤ refill threshold
- [ ] Critical refills (≤3 days) highlighted with red accent
- [ ] Quick stats show adherence %, activities count, next appointment
- [ ] User can toggle Health Logs, Refill Reminders, and Quick Stats on/off
---

## 10. Health Connect Integration

### Story 10.1: Connect Health Connect

**User Story:** As a user, I want to sync with Health Connect.

**User Actions:**
1. User enables Health Connect
2. User grants permissions

**Expected Outcomes:**
- Data synced bidirectionally
- Google Sign-In for auth only

**Acceptance Criteria:**
- [ ] No cloud storage used

---

## 11. Multi-Profile Management

### Story 11.1: Add Profile

**User Story:** As a caregiver, I want to manage multiple profiles.

**User Actions:**
1. User creates new profile

**Expected Outcomes:**
- Profile added to switcher
- Data isolated per profile

**Acceptance Criteria:**
- [ ] All profiles show in switcher

---

## 12. Notifications & Alarms

### Story 12.1: Configure Notification Mode

**User Story:** As a user, I want to choose notification intensity.

**User Actions:**
1. User selects Home Mode or Heavy Sleeper Mode

**Expected Outcomes:**
- Notifications use selected mode
- Heavy Sleeper wakes the user up with a full-screen alarm even on lock screen and vibrates
- Home Mode shows standard notification and vibrates

**Acceptance Criteria:**
- [ ] Modes apply immediately, no matter which action is done first (e.g. user enables heavy sleeper mode, then schedules medication)

---

## 13. PDF Exports

### Story 13.1: Export Health Summary

**User Story:** As a user, I want to export reports for doctors.

**User Actions:**
1. User generates health summary PDF

**Expected Outcomes:**
- PDF includes all health data
- PDF includes all medication data
- PDF includes all activity data
- PDF includes all supplement data  
- PDF includes all symptom data
- PDF includes all overall well-being data
- PDF includes all appointment data
- PDF includes all health connect data
- Share sheet opens

**Acceptance Criteria:**
- [ ] PDF generation <15 seconds

---

## 14. Settings & Customization

### Story 14.1: Enable PIN Lock

**User Story:** As a user, I want to secure my data.

**User Actions:**
1. User sets 4-digit PIN
2. User enables biometric unlock

**Expected Outcomes:**
- App locks after 1 minute of inactivity
- Device biometric unlock available

**Acceptance Criteria:**
- [ ] PIN stored securely
- [ ] Biometric unlock available

---

## 15. Account Management & Deletion

### Story 15.1: Delete All Data

**User Story:** As a user, I want to permanently delete all data.

**User Actions:**
1. User navigates to Settings → Delete All Data
2. User types "DELETE" to confirm
3. User confirms deletion

**Expected Outcomes:**
- All data permanently deleted
- App resets to fresh install state
- No recovery possible

**Acceptance Criteria:**
- [ ] All database records deleted
- [ ] All photos deleted
- [ ] All notifications canceled
- [ ] Widget cleared
- [ ] App returns to onboarding screen  

---

**END OF USER STORIES**

*Total Stories: 62 across 15 categories*
