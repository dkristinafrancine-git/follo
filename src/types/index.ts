// Base types for all entities
export interface BaseEntity {
    id: string;
    createdAt: string; // UTC ISO string
    updatedAt: string; // UTC ISO string
}

// Profile types
export interface Profile extends BaseEntity {
    name: string;
    avatarUri?: string;
    birthDate?: string;
    isPrimary: boolean;
}

export type CreateProfileInput = Omit<Profile, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateProfileInput = Partial<Omit<Profile, 'id' | 'createdAt' | 'updatedAt'>>;

// Recurrence rule type (iCalendar-style)
export interface RecurrenceRule {
    frequency: 'daily' | 'weekly' | 'monthly' | 'custom';
    interval?: number; // Every N days/weeks/months
    daysOfWeek?: number[]; // 0-6 for Sunday-Saturday
    endDate?: string;
}

// Medication types
export interface Medication extends BaseEntity {
    profileId: string;
    name: string;
    dosage?: string;
    form?: string;
    frequencyRule?: RecurrenceRule;
    timeOfDay: string[]; // ["08:00", "20:00"]
    refillThreshold: number;
    currentQuantity?: number;
    photoUri?: string;
    notes?: string;
    isActive: boolean;
    hideName: boolean;
}

export type CreateMedicationInput = Omit<Medication, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateMedicationInput = Partial<Omit<Medication, 'id' | 'profileId' | 'createdAt' | 'updatedAt'>>;

// Medication history types
export type MedicationStatus = 'taken' | 'missed' | 'skipped' | 'postponed';

export interface MedicationHistory {
    id: string;
    profileId: string;
    medicationId: string;
    scheduledTime: string; // UTC ISO
    actualTime?: string; // UTC ISO when taken
    status: MedicationStatus;
    notes?: string;
    createdAt: string;
}

export type CreateMedicationHistoryInput = Omit<MedicationHistory, 'id' | 'createdAt'>;

// Supplement types
export interface Supplement extends BaseEntity {
    profileId: string;
    name: string;
    dosage?: string;
    form?: string;
    frequencyRule?: RecurrenceRule;
    timeOfDay: string[];
    currentQuantity?: number;
    lowStockThreshold: number;
    photoUri?: string;
    notes?: string;
    isActive: boolean;
}

export type CreateSupplementInput = Omit<Supplement, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateSupplementInput = Partial<Omit<Supplement, 'id' | 'profileId' | 'createdAt' | 'updatedAt'>>;

// Supplement history types
export interface SupplementHistory {
    id: string;
    profileId: string;
    supplementId: string;
    scheduledTime: string;
    actualTime?: string;
    status: MedicationStatus; // Same statuses apply
    notes?: string;
    createdAt: string;
}

export type CreateSupplementHistoryInput = Omit<SupplementHistory, 'id' | 'createdAt'>;

// Appointment types
export interface Appointment extends BaseEntity {
    profileId: string;
    title: string;
    doctorName?: string;
    specialty?: string;
    location?: string;
    scheduledTime: string; // UTC ISO
    duration: number; // Minutes
    reason?: string;
    checklist?: string[]; // Array of strings for checklist items
    photoUri?: string;
    notes?: string;
}

export type CreateAppointmentInput = Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateAppointmentInput = Partial<Omit<Appointment, 'id' | 'profileId' | 'createdAt' | 'updatedAt'>>;

// Activity types
export type ActivityType = 'exercise' | 'sleep' | 'water' | 'meal' | 'vital_signs' | 'symptom' | 'mood' | 'custom' | 'meditation' | 'therapy' | 'journaling' | 'other';

export interface Activity {
    id: string;
    profileId: string;
    type: ActivityType | string;
    title?: string;
    value?: number;
    unit?: string;
    startTime: string; // UTC ISO
    endTime?: string;
    durationMinutes?: number;
    intensity?: 'low' | 'medium' | 'high';
    moodBefore?: number;
    notes?: string;
    createdAt: string;
}

export type CreateActivityInput = Omit<Activity, 'id' | 'createdAt'>;

// Calendar event types (SSOT)
export type CalendarEventType = 'medication_due' | 'supplement_due' | 'appointment' | 'activity' | 'reminder' | 'gratitude' | 'symptom';
export type CalendarEventStatus = 'pending' | 'completed' | 'missed' | 'skipped';

export interface CalendarEvent extends BaseEntity {
    profileId: string;
    eventType: CalendarEventType;
    sourceId: string; // ID of linked entity
    title: string;
    scheduledTime: string; // UTC ISO
    endTime?: string;
    status: CalendarEventStatus;
    completedTime?: string;
    metadata?: Record<string, unknown>;
}

export type CreateCalendarEventInput = Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateCalendarEventInput = Partial<Omit<CalendarEvent, 'id' | 'profileId' | 'createdAt' | 'updatedAt'>>;

// Emergency data types
export interface EmergencyContact {
    name: string;
    phone: string;
    relation: string;
}

export interface EmergencyData {
    id: string;
    profileId: string;
    bloodType?: string;
    allergies: string[];
    medicalConditions: string[];
    emergencyContacts: EmergencyContact[];
    organDonor: boolean;
    notes?: string;
    updatedAt: string;
}

export type CreateEmergencyDataInput = Omit<EmergencyData, 'id' | 'updatedAt'>;
export type UpdateEmergencyDataInput = Partial<Omit<EmergencyData, 'id' | 'profileId' | 'updatedAt'>>;

// Medication reference types (drug database)
export interface MedicationReference {
    id: number;
    name: string;
    genericName?: string;
    brandNames: string[];
    dosageForms: string[];
    commonStrengths: string[];
    interactions: string[];
    category?: string;
    lastUpdated?: string;
}

// Gratitude types
export interface Gratitude extends BaseEntity {
    profileId: string;
    content: string;
    positivityLevel: number; // 1-5
    imageUri?: string;
    createdAt: string; // UTC ISO
}

export type CreateGratitudeInput = Omit<Gratitude, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateGratitudeInput = Partial<Omit<Gratitude, 'id' | 'profileId' | 'createdAt' | 'updatedAt'>>;

// Reminder types
export type ReminderType = 'supplement' | 'activity' | 'gratitude' | 'symptom';

export interface Reminder extends BaseEntity {
    profileId: string;
    type: ReminderType;
    frequencyRule: RecurrenceRule;
    timeOfDay: string[]; // ["08:00", "20:00"]
    isActive: boolean;
}

export type CreateReminderInput = Omit<Reminder, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateReminderInput = Partial<Omit<Reminder, 'id' | 'profileId' | 'createdAt' | 'updatedAt'>>;

// Symptom types
export interface Symptom {
    id: string;
    profile_id: string; // Note: Repository uses snake_case, but other types use camelCase. Keeping snake_case to match DB/Repo for now, or should I normalize? 
    // The repo uses snake_case: profile_id, occurred_at.
    // Let's stick to the repo definition for now to avoid breaking changes, usually types in index.ts are camelCase though. 
    // Actually, looking at other types in index.ts, they are camelCase (profileId). 
    // The symptomRepository defines it as snake_case. 
    // I should probably map it. But `calendarService` uses it. 
    // Let's define it as it is in the repository for now to ensure compatibility, OR update the repository to match the project standard.
    // Given the task is just to add logs, I will define it as is.
    name: string;
    severity: number; // 1-10
    frequency?: string;
    notes?: string;
    occurred_at: string; // ISO string
    created_at: string;
    updated_at: string;
}

export type CreateSymptomDTO = Omit<Symptom, 'id' | 'created_at' | 'updated_at'>;
export type UpdateSymptomDTO = Partial<Omit<Symptom, 'id' | 'profile_id' | 'created_at' | 'updated_at'>>;
