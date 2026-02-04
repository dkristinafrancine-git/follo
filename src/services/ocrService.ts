import TextRecognition from 'react-native-mlkit-ocr';
import medicationNames from '../data/medicationReference.json';

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
            const result = await (TextRecognition as any).recognize(imagePath);
            // Flatten the result to just lines of text
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

        // 1. Identify Name (check against list or Regex for capitalized prominent words)
        // Simple exhaustive check against known list for high confidence
        for (const knownName of medicationNames) {
            if (combinedText.toLowerCase().includes(knownName.toLowerCase())) {
                name = knownName;
                break;
            }
        }

        // Fallback: Look for the first line that looks like a name (Alpha only, caps?) if not found
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

        // 4. Identify Frequency (BID, TID, Daily, etc.)
        const frequencyPatterns = [
            { pattern: /daily/i, value: 'Daily' },
            { pattern: /once a day/i, value: 'Daily' },
            { pattern: /twice a day/i, value: '2 times/day' },
            { pattern: /bid/i, value: '2 times/day' },
            { pattern: /three times a day/i, value: '3 times/day' },
            { pattern: /tid/i, value: '3 times/day' },
            { pattern: /every (\d+) hours/i, value: 'Every $1 hours' },
        ];

        for (const p of frequencyPatterns) {
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
            confidence: name ? 0.8 : 0.4, // Rough confidence metric
        };
    }
}
