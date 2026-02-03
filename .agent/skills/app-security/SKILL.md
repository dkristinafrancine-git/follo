---
name: app-security
description: Mobile application security skill for React Native health apps. Use this skill when implementing authentication, encryption, secure storage, or handling sensitive user data. Provides patterns for SQLite encryption, secure notifications, PIN/biometric auth, and secure data export.
---

# App Security Skill for Mobile Health Apps

This skill guides implementation of security best practices for React Native health applications handling sensitive medical data. All patterns prioritize offline-first, privacy-centric architecture.

## Security Principles

### Core Tenets
1. **Minimize data collection** - Only store what's necessary
2. **Encrypt at rest** - All health data encrypted locally
3. **Secure in transit** - HTTPS only, certificate pinning when applicable
4. **Defense in depth** - Multiple security layers
5. **Fail securely** - Errors should not leak sensitive info

## Local Database Security (SQLite)

### Encryption with SQLCipher

```typescript
// Database initialization with encryption
import * as SQLite from 'expo-sqlite';

const DB_CONFIG = {
  name: 'follo_health.db',
  // Key derived from device-specific + user PIN
  encryptionKey: await deriveEncryptionKey(userPin, deviceId),
};

// Key derivation function
async function deriveEncryptionKey(
  userPin: string,
  deviceId: string
): Promise<string> {
  const salt = await SecureStore.getItemAsync('db_salt');
  // PBKDF2 with high iteration count
  return await Crypto.pbkdf2Async(
    userPin + deviceId,
    salt,
    100000, // iterations
    32,     // key length
    'SHA256'
  );
}
```

### Secure Columns Pattern

```sql
-- Sensitive columns encrypted at application layer
CREATE TABLE medications (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL,
  name_encrypted BLOB NOT NULL,      -- AES-256-GCM encrypted
  name_hash TEXT NOT NULL,           -- For indexing/search
  dosage_encrypted BLOB,
  notes_encrypted BLOB,
  -- Non-sensitive metadata
  is_active INTEGER DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

### Query Security

```typescript
// NEVER interpolate user input directly
// ❌ BAD
const query = `SELECT * FROM medications WHERE name = '${userInput}'`;

// ✅ GOOD - Parameterized queries
const query = 'SELECT * FROM medications WHERE name_hash = ?';
const result = await db.executeSql(query, [hashName(userInput)]);
```

## Authentication Patterns

### PIN Lock Implementation

```typescript
interface PINConfig {
  minLength: 4;
  maxLength: 8;
  maxAttempts: 5;
  lockoutDurationMs: 300000; // 5 minutes
  requireOnForeground: true;
  exemptScreens: ['AlarmScreen', 'EmergencyIDScreen'];
}

// PIN verification with timing attack mitigation
async function verifyPIN(enteredPIN: string): Promise<boolean> {
  const storedHash = await SecureStore.getItemAsync('pin_hash');
  const enteredHash = await hashPIN(enteredPIN);
  
  // Constant-time comparison
  return crypto.timingSafeEqual(
    Buffer.from(storedHash),
    Buffer.from(enteredHash)
  );
}

// Failed attempt tracking
async function handleFailedAttempt(): Promise<void> {
  const attempts = await getFailedAttempts();
  
  if (attempts >= PINConfig.maxAttempts) {
    await lockoutUser();
    // Optional: wipe after extreme attempts
    if (attempts >= 10) {
      await secureWipe();
    }
  }
}
```

### Biometric Authentication

```typescript
import * as LocalAuthentication from 'expo-local-authentication';

async function authenticateWithBiometrics(): Promise<AuthResult> {
  const hasHardware = await LocalAuthentication.hasHardwareAsync();
  const isEnrolled = await LocalAuthentication.isEnrolledAsync();
  
  if (!hasHardware || !isEnrolled) {
    return { success: false, fallbackToPIN: true };
  }
  
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: 'Unlock Follo',
    cancelLabel: 'Use PIN',
    disableDeviceFallback: true, // We handle PIN ourselves
  });
  
  return { success: result.success };
}
```

## Secure Notifications

### Notification Content Security

```typescript
// Never include PHI in notification content
// ❌ BAD
notifee.displayNotification({
  title: 'Take your Metformin 500mg',  // Exposes medication
  body: 'Time for your diabetes medication',
});

// ✅ GOOD - Generic with in-app detail
notifee.displayNotification({
  title: 'Medication Reminder',
  body: 'Tap to view details',
  data: { medicationId: 'uuid-here' }, // ID only, not PHI
});
```

### Lock Screen Visibility

```typescript
// Configure notification visibility
notifee.createChannel({
  id: 'medications',
  name: 'Medication Reminders',
  visibility: AndroidVisibility.PRIVATE, // Hide content on lock screen
  lights: true,
  vibration: true,
});
```

## Secure Data Export

### PDF Export Security

```typescript
interface ExportOptions {
  includePhotos: boolean;
  dateRange: DateRange;
  password?: string; // Optional PDF password
  watermark: boolean; // Add "Confidential" watermark
}

async function exportHealthReport(options: ExportOptions): Promise<string> {
  // Generate in secure temp directory
  const tempPath = `${FileSystem.cacheDirectory}export_${Date.now()}.pdf`;
  
  // Create PDF with optional password protection
  const pdf = await generatePDF(data, {
    password: options.password,
    permissions: {
      printing: true,
      modifying: false,
      copying: false,
    },
  });
  
  // Clean up after share
  setTimeout(async () => {
    await FileSystem.deleteAsync(tempPath, { idempotent: true });
  }, 60000); // Delete after 1 minute
  
  return tempPath;
}
```

### QR Code Security Warning

```typescript
// Emergency ID QR codes are NOT encrypted by design
// Display clear warning to user
const QR_WARNING = `
⚠️ This QR code contains sensitive medical information.
Only share with trusted individuals or healthcare providers.
Anyone who scans this code will be able to read your medical data.
`;
```

## Input Validation

### Medical Data Validation

```typescript
// Medication name validation
const MEDICATION_NAME_RULES = {
  minLength: 2,
  maxLength: 100,
  pattern: /^[a-zA-Z0-9\s\-\.]+$/, // Alphanumeric + basic punctuation
  sanitize: (input: string) => input.trim().replace(/\s+/g, ' '),
};

// Dosage validation
const DOSAGE_RULES = {
  pattern: /^\d+(\.\d+)?\s*(mg|mcg|g|ml|IU|units?)$/i,
  examples: ['500mg', '10ml', '1000IU'],
};

// Phone number validation (emergency contacts)
const PHONE_RULES = {
  pattern: /^\+?[\d\s\-\(\)]{10,20}$/,
  sanitize: (input: string) => input.replace(/[^\d+]/g, ''),
};
```

### XSS Prevention in Notes

```typescript
// Sanitize user notes before display
import { decode } from 'html-entities';

function sanitizeNotes(input: string): string {
  return decode(input)
    .replace(/<[^>]*>/g, '') // Strip HTML tags
    .replace(/javascript:/gi, '') // Remove JS links
    .trim();
}
```

## Secure Storage

### Expo SecureStore Usage

```typescript
import * as SecureStore from 'expo-secure-store';

// Store sensitive tokens/keys
await SecureStore.setItemAsync('db_key', encryptionKey, {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
});

// Never store in AsyncStorage:
// - Encryption keys
// - PIN hashes
// - API tokens
// - Sensitive profile data
```

### Memory Security

```typescript
// Clear sensitive data from memory when done
function secureClear(sensitiveString: string): void {
  // Overwrite string in memory (limited effectiveness in JS)
  const buffer = Buffer.from(sensitiveString);
  buffer.fill(0);
}
```

## Audit Logging

### Security Event Logging

```typescript
interface SecurityEvent {
  timestamp: string;
  eventType: 'auth_success' | 'auth_failure' | 'data_export' | 'profile_switch';
  profileId?: string;
  metadata?: Record<string, unknown>;
}

async function logSecurityEvent(event: SecurityEvent): Promise<void> {
  // Store locally for debugging
  await appendToLog('security_log', event);
  
  // Never log to external services without consent
}
```

## Security Checklist

### Pre-Release
- [ ] PIN lock enforced on foreground
- [ ] Biometric fallback tested
- [ ] Database encryption verified
- [ ] Notification content doesn't leak PHI
- [ ] PDF export password-protects sensitive data
- [ ] QR code warning displayed
- [ ] Input validation on all forms
- [ ] No hardcoded secrets in codebase
- [ ] Secure storage for all sensitive keys
- [ ] ProGuard/R8 obfuscation enabled (Android)

### Ongoing
- [ ] Dependency vulnerability scanning
- [ ] Regular security testing
- [ ] Incident response plan documented
