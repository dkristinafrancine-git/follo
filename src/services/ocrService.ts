import TextRecognition from 'react-native-mlkit-ocr';
import { drugCorrectionService } from './drugCorrectionService';
import { FREQUENCY_PATTERNS } from '../data/frequencyPatterns';

export interface ParsedMedication {
    name?: string;
    dosage?: string;
    form?: string;
    frequency?: string;
    confidence: number;
}

export class OCRService {
    static async recognizeText(imagePath: string): Promise<string[]> {
        try {
            // The library exports detectFromUri and detectFromFile.
            // Using detectFromUri as we likely have a file:// URI.
            const result = await (TextRecognition as any).detectFromUri(imagePath);

            // Result is typically an array of text blocks
            if (!result || !Array.isArray(result)) {
                console.warn('OCR result is not an array:', result);
                return [];
            }
            return result.map((block: any) => block.text);
        } catch (error) {
            console.error('OCR recognition failed:', error);
            throw error;
        }
    }

    static parseMedicationDetails(lines: string[]): ParsedMedication {
        const combinedText = lines.join('\n');
        let name: string | undefined;
        let dosage: string | undefined;
        let form: string | undefined;
        let frequency: string | undefined;

        // 1. Identify Name using SymSpell for fuzzy matching
        // This handles noisy OCR like "L1pitor" or "Advi1"
        const suggestions = drugCorrectionService.getDrugSuggestions(combinedText);

        if (suggestions.length > 0) {
            name = suggestions[0];
        }

        // Fallback: If no fuzzy match, look for highly capitalized words on single lines
        if (!name) {
            const potentialName = lines.find(l => /^[A-Z][a-z]+(\s[A-Z][a-z]+)?$/.test(l.trim()));
            if (potentialName) name = potentialName.trim();
        }

        // 2. Identify Dosage (e.g., 500mg, 10 mg, 5 ml)
        const dosageRegex = /(\d+(\.\d+)?\s*(mg|g|mcg|ml|L|IU))\b/i;
        const dosageMatch = combinedText.match(dosageRegex);
        if (dosageMatch) {
            dosage = dosageMatch[0];
        }

        // 3. Identify Form (Tablet, Capsule, etc.)
        const forms = ['Tablet', 'Capsule', 'Liquid', 'Syrup', 'Injection', 'Cream', 'Ointment', 'Gel', 'Spray', 'Drop', 'Inhaler'];
        for (const f of forms) {
            if (combinedText.toLowerCase().includes(f.toLowerCase())) {
                form = f;
                break;
            }
        }

        // 4. Identify Frequency parsing logic utilizing centralized patterns
        for (const p of FREQUENCY_PATTERNS) {
            const match = combinedText.match(p.pattern);
            if (match) {
                frequency = p.value.replace('$1', match[1] || '');
                break;
            }
        }

        return {
            name,
            dosage,
            form,
            frequency,
            confidence: name ? 0.8 : 0.4,
        };
    }
}
