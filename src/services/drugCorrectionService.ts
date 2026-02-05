import { SymSpell } from '../utils/symspell';
import drugFrequencies from '../data/drugFrequencies.json';

class DrugCorrectionService {
    private symSpell: SymSpell;
    private initialized: boolean = false;

    constructor() {
        // Symmetric Delete Spelling Correction with max edit distance 2
        this.symSpell = new SymSpell(2);
    }

    /**
     * Lazy-loads and indexes the frequency dictionary.
     * SymSpell indexing is O(N) where N is number of words, 
     * but near-instant for a few thousand items on mobile.
     */
    private init() {
        if (this.initialized) return;

        try {
            Object.entries(drugFrequencies).forEach(([name, freq]) => {
                this.symSpell.addWord(name, freq as number);
            });
            this.initialized = true;
        } catch (error) {
            console.error('Failed to initialize DrugCorrectionService:', error);
        }
    }

    /**
     * Logic:
     * 1. Tokenizes noisy OCR text into individual words.
     * 2. Cleans tokens (removes special characters/numbers).
     * 3. Performs SymSpell lookup on each candidate token.
     * 4. Returns top 5 unique suggestions ranked by confidence.
     */
    public getDrugSuggestions(input: string): string[] {
        this.init();
        if (!input || input.length < 2) return [];

        // Clean and tokenize input (OCR often carries noise or merged alphanumeric chars)
        const tokens = input
            .split(/[\s,\n\r]+/)
            .map(t => t.replace(/[^a-zA-Z]/g, '')) // Focus on alpha chars for drug names
            .filter(t => t.length > 2);

        const allCandidates: string[] = [];

        // Check the whole input string first (for multi-word drug names)
        const wholeMatch = this.symSpell.lookup(input.trim(), 3);
        allCandidates.push(...wholeMatch);

        // Then check individual tokens
        for (const token of tokens) {
            const tokenMatches = this.symSpell.lookup(token, 3);
            allCandidates.push(...tokenMatches);
        }

        // Return unique top 5 suggestions
        return [...new Set(allCandidates)].slice(0, 5);
    }
}

export const drugCorrectionService = new DrugCorrectionService();
