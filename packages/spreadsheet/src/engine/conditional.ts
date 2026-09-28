import { keyOf, parseRange, rangeCells } from './a1';
import { compare, numberFromText } from './coerce';
import { isError, type CellAddress, type Scalar } from './types';

/**
 * Conditional formatting: a look a cell takes from what it holds rather than
 * from a format someone set. It is worked out when the sheet is drawn and
 * never stored in the cells, so a rule follows the numbers as they change.
 */

export type ConditionOperator = '>' | '>=' | '<' | '<=' | '=' | '<>' | 'between' | 'contains' | 'empty' | 'notEmpty' | 'error';

export interface ConditionTest {
    op: ConditionOperator;
    value?: string | number | boolean;
    /** The upper end, for `between`. */
    to?: number;
}

export type ConditionTone = 'success' | 'info' | 'warn' | 'danger';

/** What a matching cell looks like. A tone takes the theme's colours for it. */
export interface ConditionStyle {
    tone?: ConditionTone;
    background?: string;
    color?: string;
    bold?: boolean;
    italic?: boolean;
}

interface RuleBase {
    /** Where it applies: `'B2:B20'`, or one cell. */
    range: string;
}

/** Cells that pass a test take a style. */
export interface HighlightRule extends RuleBase {
    type?: 'highlight';
    when: ConditionTest | ((value: Scalar, address: CellAddress) => boolean);
    style: ConditionStyle;
}

/** Numbers shade from one colour to the next, lowest to highest. */
export interface ColorScaleRule extends RuleBase {
    type: 'colorScale';
    /** Two colours, low and high, or three with a midpoint. Any CSS colour, a token's `var()` too. */
    colors: [string, string] | [string, string, string];
    /** The ends of the scale; the range's own lowest and highest when unset. */
    min?: number;
    max?: number;
}

/** A bar behind each number, as long as the number is against the range's highest. */
export interface DataBarRule extends RuleBase {
    type: 'dataBar';
    color?: string;
    min?: number;
    max?: number;
}

export type ConditionalRule = HighlightRule | ColorScaleRule | DataBarRule;

/** What the rules came to for one cell. */
export interface ConditionalLook extends ConditionStyle {
    /** How far along the data bar reaches, 0 to 1. */
    bar?: number;
    barColor?: string;
}

const numeric = (value: Scalar): number | null => {
    if (typeof value === 'number') return Number.isFinite(value) ? value : null;
    if (typeof value === 'string') return numberFromText(value);
    return null;
};

/** Whether a value passes a test. */
export function testCondition(test: ConditionTest, value: Scalar): boolean {
    const { op } = test;
    if (op === 'error') return isError(value);
    if (isError(value)) return false;
    if (op === 'empty') return value === null || value === '';
    if (op === 'notEmpty') return value !== null && value !== '';
    if (op === 'contains') return value !== null && String(value).toLowerCase().includes(String(test.value ?? '').toLowerCase());
    if (op === 'between') {
        const n = numeric(value);
        const low = Number(test.value);
        const high = Number(test.to);
        return n !== null && n >= Math.min(low, high) && n <= Math.max(low, high);
    }
    // A blank cell is not "less than 10": the rules are about what is there.
    if (value === null || value === '') return false;
    const target = typeof test.value === 'string' && numberFromText(test.value) !== null && numeric(value) !== null ? numberFromText(test.value)! : (test.value ?? null);
    const order = compare(numeric(value) ?? value, target);
    if (typeof order !== 'number') return false;
    switch (op) {
        case '>':
            return order > 0;
        case '>=':
            return order >= 0;
        case '<':
            return order < 0;
        case '<=':
            return order <= 0;
        case '=':
            return order === 0;
        case '<>':
            return order !== 0;
    }
}

/** A colour part of the way between two, left to the browser to mix. */
function mix(from: string, to: string, t: number): string {
    const p = Math.round(Math.min(1, Math.max(0, t)) * 100);
    return p <= 0 ? from : p >= 100 ? to : `color-mix(in srgb, ${to} ${p}%, ${from})`;
}

function scaleColor(colors: string[], t: number): string {
    if (colors.length === 3) return t <= 0.5 ? mix(colors[0]!, colors[1]!, t * 2) : mix(colors[1]!, colors[2]!, (t - 0.5) * 2);
    return mix(colors[0]!, colors[1]!, t);
}

/**
 * Every rule worked out over the sheet at once, into a look per cell,
 * keyed by `keyOf`.
 * A scale needs its range's lowest and highest before it can shade any one
 * cell, so this runs once per drawing, not once per cell. Where rules
 * disagree about a property, the earlier one wins.
 */
export function conditionalLooks(rules: readonly ConditionalRule[], value: (address: CellAddress) => Scalar): Map<string, ConditionalLook> {
    const looks = new Map<string, ConditionalLook>();
    const put = (address: CellAddress, look: ConditionalLook) => {
        const key = keyOf(address);
        const current = looks.get(key) ?? {};
        for (const [name, v] of Object.entries(look)) {
            if (v !== undefined && current[name as keyof ConditionalLook] === undefined) (current as Record<string, unknown>)[name] = v;
        }
        looks.set(key, current);
    };
    for (const rule of rules) {
        const range = parseRange(rule.range);
        if (!range) continue;
        const cells = [...rangeCells(range)];
        if (rule.type === 'colorScale' || rule.type === 'dataBar') {
            const numbers = cells.map((address) => ({ address, n: numeric(value(address)) })).filter((c): c is { address: CellAddress; n: number } => c.n !== null);
            if (!numbers.length) continue;
            const low = rule.min ?? (rule.type === 'dataBar' ? Math.min(0, ...numbers.map((c) => c.n)) : Math.min(...numbers.map((c) => c.n)));
            const high = rule.max ?? Math.max(...numbers.map((c) => c.n));
            const span = high - low;
            for (const { address, n } of numbers) {
                const t = span === 0 ? 1 : Math.min(1, Math.max(0, (n - low) / span));
                if (rule.type === 'colorScale') put(address, { background: scaleColor(rule.colors, t) });
                else put(address, { bar: t, barColor: rule.color });
            }
            continue;
        }
        const test = rule.when;
        for (const address of cells) {
            const v = value(address);
            const passes = typeof test === 'function' ? test(v, address) : testCondition(test, v);
            if (passes) put(address, rule.style);
        }
    }
    return looks;
}
