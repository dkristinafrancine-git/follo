export class SymSpell {
    private dictionary: Map<string, number> = new Map();
    private deletes: Map<string, string[]> = new Map();
    private originals: Map<string, string> = new Map();
    private maxEditDistance: number;

    constructor(maxEditDistance: number = 2) {
        this.maxEditDistance = maxEditDistance;
    }

    /**
     * Calculates the Levenshtein distance between two strings.
     * Used for final ranking of candidates.
     */
    private levenshteinDistance(s1: string, s2: string): number {
        if (s1.length < s2.length) [s1, s2] = [s2, s1];
        if (s2.length === 0) return s1.length;

        let prevRow = Array.from({ length: s2.length + 1 }, (_, i) => i);
        for (let i = 0; i < s1.length; i++) {
            let currRow = [i + 1];
            for (let j = 0; j < s2.length; j++) {
                let deletions = prevRow[j + 1] + 1;
                let insertions = currRow[j] + 1;
                let substitutions = prevRow[j] + (s1[i] !== s2[j] ? 1 : 0);
                currRow.push(Math.min(deletions, insertions, substitutions));
            }
            prevRow = currRow;
        }
        return prevRow[s2.length];
    }

    /**
     * Generates all variations of a word with up to maxEditDistance characters removed.
     */
    private getDeletes(word: string): Set<string> {
        const deletes = new Set<string>();
        const queue = [word];
        for (let i = 0; i < this.maxEditDistance; i++) {
            const nextQueue: string[] = [];
            for (const w of queue) {
                if (w.length > 1) {
                    for (let j = 0; j < w.length; j++) {
                        const del = w.slice(0, j) + w.slice(j + 1);
                        if (!deletes.has(del)) {
                            deletes.add(del);
                            nextQueue.push(del);
                        }
                    }
                }
            }
            queue.splice(0, queue.length, ...nextQueue);
        }
        return deletes;
    }

    /**
     * Adds a word to the dictionary and indexes its deletes.
     */
    addWord(word: string, frequency: number) {
        const lowerWord = word.toLowerCase();
        this.originals.set(lowerWord, word);
        this.dictionary.set(lowerWord, (this.dictionary.get(lowerWord) || 0) + frequency);

        const deletes = this.getDeletes(lowerWord);
        for (const del of deletes) {
            const list = this.deletes.get(del) || [];
            if (!list.includes(lowerWord)) {
                list.push(lowerWord);
                this.deletes.set(del, list);
            }
        }
    }

    /**
     * Searches for suggestions for a given input word.
     * Returns the original casing of the matched words.
     */
    lookup(input: string, limit: number = 5, maxDistance: number = this.maxEditDistance): string[] {
        const lowerInput = input.toLowerCase();

        // Exact match
        if (this.dictionary.has(lowerInput)) {
            return [this.originals.get(lowerInput)!];
        }

        const candidates = new Map<string, number>();
        const inputDeletes = this.getDeletes(lowerInput);
        inputDeletes.add(lowerInput);

        for (const del of inputDeletes) {
            const matches = this.deletes.get(del);
            if (matches) {
                for (const match of matches) {
                    // Skip if already found with smaller/same distance
                    if (candidates.has(match)) continue;

                    const dist = this.levenshteinDistance(lowerInput, match);
                    if (dist <= maxDistance) {
                        candidates.set(match, dist);
                    }
                }
            }
        }

        // Sort by distance (asc) then frequency (desc)
        return Array.from(candidates.keys())
            .sort((a, b) => {
                const distA = candidates.get(a)!;
                const distB = candidates.get(b)!;
                if (distA !== distB) return distA - distB;
                return (this.dictionary.get(b) || 0) - (this.dictionary.get(a) || 0);
            })
            .slice(0, limit)
            .map(word => this.originals.get(word)!);
    }
}
