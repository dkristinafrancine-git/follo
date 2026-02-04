/**
 * Export Service
 * Generates PDF and CSV reports for health data export
 * Uses expo-print for PDF generation and expo-sharing for sharing
 */

import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Paths, File } from 'expo-file-system';
import { format } from 'date-fns';
import {
  Profile,
  MedicationHistory,
  Medication,
  Appointment,
  Activity,
  EmergencyData
} from '../types';

// Report types
export type ReportType =
  | 'health_summary'    // Overall health summary
  | 'medication_log'    // Medication history
  | 'appointment_log'   // Appointment history
  | 'activity_log'      // Activity log
  | 'emergency_card';   // Wallet-sized emergency card

export interface ExportOptions {
  reportType: ReportType;
  profile: Profile;
  startDate: Date;
  endDate: Date;
  format: 'pdf' | 'csv';
}

export const exportService = {
  /**
   * Generate and share a health summary PDF
   */
  async generateHealthSummaryPDF(
    profile: Profile,
    medications: Medication[],
    medicationHistory: MedicationHistory[],
    appointments: Appointment[],
    activities: Activity[],
    startDate: Date,
    endDate: Date
  ): Promise<string> {
    const html = generateHealthSummaryHTML(
      profile,
      medications,
      medicationHistory,
      appointments,
      activities,
      startDate,
      endDate
    );

    const { uri } = await Print.printToFileAsync({ html });
    return uri;
  },

  /**
   * Generate medication log as PDF
   */
  async generateMedicationLogPDF(
    profile: Profile,
    medications: Medication[],
    history: MedicationHistory[],
    startDate: Date,
    endDate: Date
  ): Promise<string> {
    const html = generateMedicationLogHTML(profile, medications, history, startDate, endDate);
    const { uri } = await Print.printToFileAsync({ html });
    return uri;
  },

  /**
   * Generate medication log as CSV
   */
  async generateMedicationLogCSV(
    medications: Medication[],
    history: MedicationHistory[]
  ): Promise<string> {
    // Create medication ID to name map
    const medMap = new Map(medications.map(m => [m.id, m.name]));

    // CSV header
    let csv = 'Date,Time,Medication,Dosage,Status,Notes\n';

    // Add rows
    for (const entry of history) {
      const medName = medMap.get(entry.medicationId) ?? 'Unknown';
      const med = medications.find(m => m.id === entry.medicationId);
      const scheduledDate = new Date(entry.scheduledTime);

      csv += `${format(scheduledDate, 'yyyy-MM-dd')},`;
      csv += `${format(scheduledDate, 'HH:mm')},`;
      csv += `"${medName}",`;
      csv += `"${med?.dosage ?? ''}",`;
      csv += `${entry.status},`;
      csv += `"${entry.notes ?? ''}"\n`;
    }

    // Save to file using expo-file-system v19 API
    const filename = `medication_log_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`;
    const file = new File(Paths.document, filename);
    await file.write(csv);

    return file.uri;
  },

  /**
   * Generate emergency ID card PDF (wallet-sized)
   */
  async generateEmergencyCardPDF(
    profile: Profile,
    emergencyData: EmergencyData,
    medications: Medication[]
  ): Promise<string> {
    const html = generateEmergencyCardHTML(profile, emergencyData, medications);
    const { uri } = await Print.printToFileAsync({ html });
    return uri;
  },

  /**
   * Share a generated file
   */
  async shareFile(uri: string, mimeType?: string): Promise<void> {
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, {
        mimeType: mimeType ?? 'application/pdf',
        dialogTitle: 'Share Health Report',
      });
    } else {
      throw new Error('Sharing is not available on this device');
    }
  },

  /**
   * Generate and immediately share a report
   */
  async exportAndShare(options: ExportOptions): Promise<void> {
    const {
      medicationRepository,
      medicationHistoryRepository,
      appointmentRepository,
      activityRepository,
      emergencyDataRepository
    } = await import('../repositories');

    const profileId = options.profile.id;
    let uri: string;

    switch (options.reportType) {
      case 'health_summary': {
        const medications = await medicationRepository.getAllByProfile(profileId);
        const history = await medicationHistoryRepository.getByProfileDateRange(
          profileId,
          options.startDate.toISOString(),
          options.endDate.toISOString()
        );
        const appointments = await appointmentRepository.getUpcoming(profileId, 50);
        const activities = await activityRepository.getByDateRange(
          profileId,
          options.startDate.toISOString(),
          options.endDate.toISOString()
        );

        uri = await this.generateHealthSummaryPDF(
          options.profile,
          medications,
          history,
          appointments,
          activities,
          options.startDate,
          options.endDate
        );
        break;
      }

      case 'medication_log': {
        const medications = await medicationRepository.getAllByProfile(profileId);
        const history = await medicationHistoryRepository.getByProfileDateRange(
          profileId,
          options.startDate.toISOString(),
          options.endDate.toISOString()
        );

        if (options.format === 'csv') {
          uri = await this.generateMedicationLogCSV(medications, history);
          await this.shareFile(uri, 'text/csv');
          return;
        }

        uri = await this.generateMedicationLogPDF(
          options.profile,
          medications,
          history,
          options.startDate,
          options.endDate
        );
        break;
      }

      case 'emergency_card': {
        const emergencyData = await emergencyDataRepository.getByProfile(profileId);
        const medications = await medicationRepository.getAllByProfile(profileId);

        if (!emergencyData) {
          throw new Error('No emergency data found for this profile');
        }

        uri = await this.generateEmergencyCardPDF(options.profile, emergencyData, medications);
        break;
      }

      default:
        throw new Error(`Report type ${options.reportType} not implemented`);
    }

    await this.shareFile(uri);
  },
};

// =====================
// HTML Template Functions
// =====================

function generateHealthSummaryHTML(
  profile: Profile,
  medications: Medication[],
  history: MedicationHistory[],
  appointments: Appointment[],
  activities: Activity[],
  startDate: Date,
  endDate: Date
): string {
  const takenCount = history.filter(h => h.status === 'taken').length;
  const totalCount = history.length;
  const adherenceRate = totalCount > 0 ? Math.round((takenCount / totalCount) * 100) : 0;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Health Summary - ${profile.name}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; color: #1a1a2e; }
        h1 { color: #6366f1; border-bottom: 3px solid #6366f1; padding-bottom: 10px; }
        h2 { color: #252542; margin-top: 30px; }
        .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
        .date-range { color: #6b7280; font-size: 14px; }
        .stat-card { background: #f3f4f6; padding: 20px; border-radius: 12px; margin: 10px 0; }
        .stat-value { font-size: 36px; font-weight: 700; color: #6366f1; }
        .stat-label { color: #6b7280; font-size: 14px; }
        table { width: 100%; border-collapse: collapse; margin-top: 15px; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; }
        th { background: #f9fafb; font-weight: 600; }
        .status-taken { color: #10b981; }
        .status-missed { color: #ef4444; }
        .status-skipped { color: #f59e0b; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #9ca3af; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Health Summary</h1>
        <div class="date-range">${format(startDate, 'MMM d, yyyy')} - ${format(endDate, 'MMM d, yyyy')}</div>
      </div>
      
      <p><strong>Profile:</strong> ${profile.name}</p>
      
      <h2>Medication Adherence</h2>
      <div class="stat-card">
        <div class="stat-value">${adherenceRate}%</div>
        <div class="stat-label">${takenCount} of ${totalCount} doses taken</div>
      </div>
      
      <h2>Active Medications (${medications.filter(m => m.isActive).length})</h2>
      <table>
        <tr><th>Medication</th><th>Dosage</th><th>Schedule</th></tr>
        ${medications.filter(m => m.isActive).map(m => `
          <tr>
            <td>${m.name}</td>
            <td>${m.dosage ?? '-'}</td>
            <td>${m.timeOfDay.join(', ')}</td>
          </tr>
        `).join('')}
      </table>
      
      <h2>Upcoming Appointments (${appointments.length})</h2>
      ${appointments.length > 0 ? `
        <table>
          <tr><th>Date</th><th>Title</th><th>Doctor</th><th>Location</th></tr>
          ${appointments.slice(0, 10).map(a => `
            <tr>
              <td>${format(new Date(a.scheduledTime), 'MMM d, yyyy HH:mm')}</td>
              <td>${a.title}</td>
              <td>${a.doctorName ?? '-'}</td>
              <td>${a.location ?? '-'}</td>
            </tr>
          `).join('')}
        </table>
      ` : '<p>No upcoming appointments</p>'}
      
      <h2>Activities Logged (${activities.length})</h2>
      ${activities.length > 0 ? `
        <table>
          <tr><th>Date</th><th>Type</th><th>Value</th><th>Notes</th></tr>
          ${activities.slice(0, 20).map(a => `
            <tr>
              <td>${format(new Date(a.startTime), 'MMM d, HH:mm')}</td>
              <td>${a.type}</td>
              <td>${a.value ?? '-'} ${a.unit ?? ''}</td>
              <td>${a.notes ?? '-'}</td>
            </tr>
          `).join('')}
        </table>
      ` : '<p>No activities logged</p>'}
      
      <div class="footer">
        Generated by Follo on ${format(new Date(), 'MMMM d, yyyy HH:mm')}
      </div>
    </body>
    </html>
  `;
}

function generateMedicationLogHTML(
  profile: Profile,
  medications: Medication[],
  history: MedicationHistory[],
  startDate: Date,
  endDate: Date
): string {
  const medMap = new Map(medications.map(m => [m.id, m]));

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Medication Log - ${profile.name}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; color: #1a1a2e; }
        h1 { color: #6366f1; }
        .date-range { color: #6b7280; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 10px; text-align: left; border-bottom: 1px solid #e5e7eb; }
        th { background: #f9fafb; font-weight: 600; }
        .status-taken { color: #10b981; font-weight: 600; }
        .status-missed { color: #ef4444; font-weight: 600; }
        .status-skipped { color: #f59e0b; font-weight: 600; }
        .footer { margin-top: 30px; color: #9ca3af; font-size: 12px; }
      </style>
    </head>
    <body>
      <h1>Medication Log</h1>
      <p><strong>Profile:</strong> ${profile.name}</p>
      <p class="date-range">${format(startDate, 'MMM d, yyyy')} - ${format(endDate, 'MMM d, yyyy')}</p>
      
      <table>
        <tr>
          <th>Date</th>
          <th>Time</th>
          <th>Medication</th>
          <th>Dosage</th>
          <th>Status</th>
          <th>Notes</th>
        </tr>
        ${history.map(h => {
    const med = medMap.get(h.medicationId);
    const scheduledDate = new Date(h.scheduledTime);
    return `
            <tr>
              <td>${format(scheduledDate, 'MMM d, yyyy')}</td>
              <td>${format(scheduledDate, 'HH:mm')}</td>
              <td>${med?.name ?? 'Unknown'}</td>
              <td>${med?.dosage ?? '-'}</td>
              <td class="status-${h.status}">${h.status.toUpperCase()}</td>
              <td>${h.notes ?? '-'}</td>
            </tr>
          `;
  }).join('')}
      </table>
      
      <div class="footer">
        Generated by Follo on ${format(new Date(), 'MMMM d, yyyy HH:mm')}
      </div>
    </body>
    </html>
  `;
}

function generateEmergencyCardHTML(
  profile: Profile,
  emergencyData: EmergencyData,
  medications: Medication[]
): string {
  const activeMeds = medications.filter(m => m.isActive);

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Emergency Medical ID</title>
      <style>
        @page { size: 3.5in 2.5in; margin: 0; }
        body { 
          font-family: -apple-system, BlinkMacSystemFont, sans-serif; 
          padding: 15px; 
          margin: 0;
          font-size: 9px;
          color: #1a1a2e;
        }
        .header { 
          background: #ef4444; 
          color: white; 
          padding: 8px; 
          margin: -15px -15px 10px -15px;
          text-align: center;
          font-weight: 700;
          font-size: 12px;
        }
        .name { font-size: 14px; font-weight: 700; margin-bottom: 5px; }
        .section { margin-bottom: 8px; }
        .label { font-weight: 600; color: #6b7280; }
        .value { font-weight: 500; }
        .list { margin: 0; padding-left: 15px; }
        .meds { font-size: 8px; }
        .contact { background: #fef2f2; padding: 5px; border-radius: 4px; margin-top: 8px; }
      </style>
    </head>
    <body>
      <div class="header">⚕️ EMERGENCY MEDICAL ID</div>
      
      <div class="name">${profile.name}</div>
      
      <div class="section">
        <span class="label">Blood Type:</span>
        <span class="value">${emergencyData.bloodType ?? 'Unknown'}</span>
        ${emergencyData.organDonor ? ' | 🫀 Organ Donor' : ''}
      </div>
      
      ${emergencyData.allergies.length > 0 ? `
        <div class="section">
          <span class="label">⚠️ Allergies:</span>
          <span class="value">${emergencyData.allergies.join(', ')}</span>
        </div>
      ` : ''}
      
      ${emergencyData.medicalConditions.length > 0 ? `
        <div class="section">
          <span class="label">Conditions:</span>
          <span class="value">${emergencyData.medicalConditions.join(', ')}</span>
        </div>
      ` : ''}
      
      ${activeMeds.length > 0 ? `
        <div class="section meds">
          <span class="label">Current Medications:</span>
          <span class="value">${activeMeds.map(m => `${m.name} ${m.dosage ?? ''}`).join(', ')}</span>
        </div>
      ` : ''}
      
      ${emergencyData.emergencyContacts.length > 0 ? `
        <div class="contact">
          <span class="label">📞 Emergency Contact:</span>
          <span class="value">${emergencyData.emergencyContacts[0].name} (${emergencyData.emergencyContacts[0].relation}): ${emergencyData.emergencyContacts[0].phone}</span>
        </div>
      ` : ''}
      
      ${emergencyData.notes ? `
        <div class="section">
          <span class="label">Notes:</span> ${emergencyData.notes}
        </div>
      ` : ''}
    </body>
    </html>
  `;
}
