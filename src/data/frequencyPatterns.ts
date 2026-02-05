export const FREQUENCY_PATTERNS = [
    { pattern: /daily/i, value: 'Daily' },
    { pattern: /once a day/i, value: 'Daily' },
    { pattern: /q(\.?\s?)d/i, value: 'Daily' }, // q.d.
    { pattern: /every day/i, value: 'Daily' },
    { pattern: /twice a day/i, value: '2 times/day' },
    { pattern: /bid/i, value: '2 times/day' }, // b.i.d.
    { pattern: /q(\.?\s?)12(\.?\s?)h/i, value: '2 times/day' },
    { pattern: /three times a day/i, value: '3 times/day' },
    { pattern: /tid/i, value: '3 times/day' }, // t.i.d.
    { pattern: /q(\.?\s?)8(\.?\s?)h/i, value: '3 times/day' },
    { pattern: /four times a day/i, value: '4 times/day' },
    { pattern: /qid/i, value: '4 times/day' }, // q.i.d.
    { pattern: /q(\.?\s?)6(\.?\s?)h/i, value: '4 times/day' },
    { pattern: /every (\d+) hours/i, value: 'Every $1 hours' },
    { pattern: /as needed/i, value: 'As needed' },
    { pattern: /prn/i, value: 'As needed' },
    { pattern: /before meals/i, value: 'Before meals' },
    { pattern: /ac/i, value: 'Before meals' }, // a.c.
    { pattern: /after meals/i, value: 'After meals' },
    { pattern: /pc/i, value: 'After meals' }, // p.c.
    { pattern: /at bedtime/i, value: 'At bedtime' },
    { pattern: /hs/i, value: 'At bedtime' }, // h.s.
];
