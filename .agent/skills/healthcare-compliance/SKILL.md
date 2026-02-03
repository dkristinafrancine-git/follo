---
name: healthcare-compliance
description: HIPAA and GDPR compliance skill for health applications handling Protected Health Information (PHI). Use this skill when designing data models, privacy features, consent flows, or audit capabilities. Provides regulatory guidance for U.S. (HIPAA) and EU (GDPR) markets.
---

# Healthcare Compliance Skill: HIPAA & GDPR

This skill guides implementation of regulatory compliance for health applications handling sensitive medical data. Follo's offline-first, local-only architecture significantly reduces compliance scope, but proper patterns must still be followed.

## Regulatory Overview

### HIPAA (U.S. Health Insurance Portability and Accountability Act)

**Scope**: Applies to "covered entities" and their "business associates"

> [!IMPORTANT]
> Follo as a **consumer health app** is NOT a covered entity. Users own their own data. However, implementing HIPAA-aligned practices builds trust and prepares for potential enterprise/healthcare integrations.

### GDPR (EU General Data Protection Regulation)

**Scope**: Applies to processing personal data of EU residents

> [!IMPORTANT]
> Health data is classified as "special category data" under GDPR Article 9, requiring **explicit consent** for processing.

---

## Protected Health Information (PHI) Classification

### PHI Categories in Follo

| Data Type | Classification | Storage | Notes |
|-----------|---------------|---------|-------|
| Medication names | PHI | Encrypted local | Reveals conditions |
| Dosages | PHI | Encrypted local | Medical detail |
| Doctor names | PHI | Encrypted local | Care relationship |
| Appointment notes | PHI | Encrypted local | Medical history |
| Profile name | PII | Encrypted local | Identity |
| Blood type | PHI | Encrypted local | Medical |
| Allergies | PHI | Encrypted local | Critical medical |
| Emergency contacts | PII | Encrypted local | Relationships |

### Non-PHI Data (Still Protect)
- App preferences
- Notification settings
- Device identifiers (hashed)
- Usage analytics (if collected)

---

## HIPAA Compliance Patterns

### Minimum Necessary Standard

Only collect and display the minimum data necessary for the intended purpose.

```typescript
// ❌ BAD - Exposing all medication fields
function displayMedicationCard(med: Medication) {
  return `${med.name} ${med.dosage} ${med.form} prescribed by ${med.prescriber}`;
}

// ✅ GOOD - Widget shows minimum necessary
function displayWidgetCard(med: Medication, settings: Settings) {
  return settings.hideMedicationName
    ? `Medication due at ${med.nextDue}`
    : `${med.name} at ${med.nextDue}`;
}
```

### Encryption Requirements

**HIPAA Technical Safeguard: §164.312(a)(2)(iv)**

```typescript
// AES-256 encryption for all PHI at rest
const ENCRYPTION_CONFIG = {
  algorithm: 'AES-256-GCM',
  keyDerivation: 'PBKDF2',
  iterations: 100000,
  keyLength: 256,
};

// Database encryption
// - SQLCipher for SQLite database
// - Encryption key derived from user PIN + device ID
// - Key stored in device Keychain/Keystore
```

### Audit Logging (HIPAA §164.312(b))

```typescript
interface AuditLog {
  id: string;
  timestamp: string;          // ISO 8601 UTC
  action: AuditAction;
  resourceType: 'medication' | 'appointment' | 'profile' | 'emergency_data';
  resourceId: string;
  profileId: string;
  outcome: 'success' | 'failure';
  details?: string;           // Non-PHI description
}

type AuditAction =
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'export'
  | 'view_emergency_id'
  | 'scan_qr';

// Log all access to PHI
async function logAccess(action: AuditAction, resource: string): Promise<void> {
  const entry: AuditLog = {
    id: uuid(),
    timestamp: new Date().toISOString(),
    action,
    resourceType: resource.type,
    resourceId: resource.id,
    profileId: activeProfileId,
    outcome: 'success',
  };
  await auditRepository.create(entry);
}
```

### Breach Notification Preparation

While Follo is local-only (no breach of external systems), prepare for device loss scenarios:

```typescript
// Remote wipe capability (optional feature)
interface BreachResponse {
  // If device lost/stolen
  enableRemoteWipe: boolean;
  
  // After N failed PIN attempts
  wipeAfterFailedAttempts: number;
  
  // Export audit log before wipe
  preserveAuditLog: boolean;
}
```

---

## GDPR Compliance Patterns

### Lawful Basis for Processing (Article 6 & 9)

For health data (special category), Follo relies on:

```typescript
// Article 9(2)(a) - Explicit consent
const CONSENT_REQUIREMENTS = {
  lawfulBasis: 'explicit_consent',
  dataCategories: ['health', 'identity'],
  purposes: [
    'medication_tracking',
    'appointment_management',
    'health_insights',
    'emergency_access',
  ],
  retentionPeriod: 'until_user_deletion',
  thirdPartySharing: 'none_by_default', // Health Connect is opt-in
};
```

### Consent Management

```typescript
interface ConsentRecord {
  id: string;
  profileId: string;
  consentType: 'data_processing' | 'health_connect_sync' | 'analytics';
  granted: boolean;
  grantedAt?: string;
  revokedAt?: string;
  version: string;          // Consent form version
  ipAddress?: string;       // Hashed, for audit
}

// Consent UI requirements
const CONSENT_UI = {
  // Must be active opt-in, not pre-checked
  defaultState: false,
  
  // Must explain purpose clearly
  explanationRequired: true,
  
  // Must allow withdrawal
  withdrawalEasy: true,
  
  // Cannot bundle unrelated consents
  granularConsent: true,
};
```

### Data Subject Rights Implementation

#### Right to Access (Article 15)

```typescript
// Export all user data in machine-readable format
async function exportUserData(profileId: string): Promise<DataExport> {
  return {
    profile: await profileRepository.getById(profileId),
    medications: await medicationRepository.getByProfile(profileId),
    medicationHistory: await historyRepository.getByProfile(profileId),
    appointments: await appointmentRepository.getByProfile(profileId),
    activities: await activityRepository.getByProfile(profileId),
    supplements: await supplementRepository.getByProfile(profileId),
    emergencyData: await emergencyRepository.getByProfile(profileId),
    auditLog: await auditRepository.getByProfile(profileId),
    exportedAt: new Date().toISOString(),
    format: 'JSON',
  };
}
```

#### Right to Erasure (Article 17) - "Right to be Forgotten"

```typescript
async function deleteAllProfileData(profileId: string): Promise<void> {
  // Cascade delete all related data
  await medicationHistoryRepository.deleteByProfile(profileId);
  await medicationRepository.deleteByProfile(profileId);
  await appointmentRepository.deleteByProfile(profileId);
  await activityRepository.deleteByProfile(profileId);
  await supplementHistoryRepository.deleteByProfile(profileId);
  await supplementRepository.deleteByProfile(profileId);
  await emergencyDataRepository.deleteByProfile(profileId);
  await calendarEventsRepository.deleteByProfile(profileId);
  
  // Keep audit log for compliance (anonymized)
  await auditRepository.anonymizeByProfile(profileId);
  
  // Finally delete profile
  await profileRepository.delete(profileId);
  
  // Clear cached data
  await clearProfileCache(profileId);
}
```

#### Right to Rectification (Article 16)

```typescript
// All data must be editable by user
// - Medication details ✓
// - Profile information ✓
// - Emergency data ✓
// - Appointment notes ✓

// Implement edit history for compliance
interface EditHistory {
  resourceId: string;
  fieldName: string;
  previousValue: string; // Encrypted
  newValue: string;      // Encrypted
  changedAt: string;
  changedBy: string;     // Profile ID
}
```

#### Right to Data Portability (Article 20)

```typescript
// Export in common formats
const EXPORT_FORMATS = {
  json: 'application/json',      // Machine readable
  pdf: 'application/pdf',        // Human readable
  csv: 'text/csv',               // Interoperable
};

// Standard health data formats (optional enhancement)
const HEALTH_STANDARDS = {
  fhir: 'HL7 FHIR R4',           // Healthcare interoperability
  healthConnect: 'Android Health Connect format',
};
```

### Data Minimization (Article 5(1)(c))

```typescript
// Only collect necessary fields
const REQUIRED_FIELDS = {
  medication: ['name', 'dosage', 'frequency'],
  appointment: ['title', 'scheduledTime'],
  profile: ['name'],
};

const OPTIONAL_FIELDS = {
  medication: ['form', 'notes', 'photo', 'prescriber'],
  appointment: ['doctor', 'location', 'notes'],
  profile: ['birthDate', 'avatar'],
};

// Don't require optional fields
function validateMedication(data: unknown): ValidationResult {
  const required = validateRequired(data, REQUIRED_FIELDS.medication);
  if (!required.valid) return required;
  
  // Optional fields validated only if present
  return validateOptional(data, OPTIONAL_FIELDS.medication);
}
```

### Storage Limitation (Article 5(1)(e))

```typescript
// Data retention policies
const RETENTION_POLICIES = {
  // Active data: Keep until user deletes
  medications: { active: 'indefinite', inactive: '1_year' },
  
  // Historical data: User configurable
  medicationHistory: { default: '2_years', max: '5_years' },
  
  // Audit logs: Compliance minimum
  auditLogs: { minimum: '6_years', anonymizeAfter: '1_year' },
  
  // Cached data: Short-lived
  cache: { max: '7_days' },
};

// Automatic cleanup job
async function enforceRetention(): Promise<void> {
  const cutoffDate = subtractYears(new Date(), 2);
  await medicationHistoryRepository.deleteOlderThan(cutoffDate);
}
```

---

## Privacy by Design Principles

### 1. Proactive not Reactive
- Encrypt by default, not as afterthought
- Consent before data collection

### 2. Privacy as Default
- Minimal permissions requested upfront
- Health Connect opt-in, not automatic
- Widget hides medication names by default option

### 3. Full Functionality without Sacrifice
- App fully functional offline
- No forced cloud sync
- No mandatory account creation

### 4. End-to-End Security
- Encryption at rest (SQLCipher)
- Secure key storage (Keychain/Keystore)
- PIN/biometric authentication

### 5. Visibility and Transparency
- Clear privacy policy
- In-app data access explanations
- Consent records viewable by user

### 6. User-Centric Design
- Easy data export
- One-tap data deletion
- Granular privacy controls

---

## Compliance Checklist

### HIPAA Alignment
- [ ] PHI encrypted at rest
- [ ] Access controls (PIN/biometric)
- [ ] Audit logging implemented
- [ ] Minimum necessary principle followed
- [ ] Breach response plan documented

### GDPR Compliance
- [ ] Explicit consent obtained
- [ ] Right to access implemented (data export)
- [ ] Right to erasure implemented (delete all)
- [ ] Right to rectification implemented (edit)
- [ ] Data portability supported (JSON/PDF export)
- [ ] Privacy notice accessible
- [ ] Consent records maintained
- [ ] Retention policies enforced

### App Store Requirements
- [ ] Privacy nutrition label accurate (iOS)
- [ ] Data safety section complete (Android)
- [ ] No undisclosed data collection
