import { compare, dateFromSerial, firstError, flatten, numberFromText, numbers, serialFromDate, serialFromParts, toBoolean, toNumber, toText } from './coerce';
import { errorValue, isError, isRangeValue, type Argument, type CellError, type RangeValue, type Scalar } from './types';

/**
 * The functions a formula can call. Each is given its arguments unevaluated,
 * so the few that must not work out what they do not use — `IF`, `IFERROR` —
 * can leave a branch alone; everything else is wrapped in `eager` and sees
 * plain values. A rectangle arrives with its shape, which is what `INDEX`,
 * `MATCH` and `VLOOKUP` read.
 */

export interface FunctionContext {
    now(): Date;
}

export type Thunk = () => Argument;
export type SheetFunction = (args: Thunk[], ctx: FunctionContext) => Argument;

const eager =
    (fn: (values: Argument[], ctx: FunctionContext) => Argument): SheetFunction =>
    (args, ctx) =>
        fn(
            args.map((arg) => arg()),
            ctx
        );

const VALUE = errorValue('#VALUE!');
const NA = errorValue('#N/A');

/** One number from one argument, or the error that stopped it. */
const one = (arg: Argument | undefined): number | CellError => (arg === undefined ? 0 : toNumber(scalar(arg)));
/** A rectangle used where a single value is wanted collapses to its first cell. */
const scalar = (arg: Argument): Scalar => (isRangeValue(arg) ? (arg.values[0] ?? null) : arg);
const text = (arg: Argument | undefined): string | CellError => (arg === undefined ? '' : toText(scalar(arg)));

const round = (value: number, digits: number, how: (n: number) => number) => {
    const factor = 10 ** digits;
    return how(value * factor) / factor;
};

/** `">5"`, `"<=3"`, `"x"`: what `COUNTIF` and `SUMIF` are given to decide with. */
function matcher(criterion: Scalar): (value: Scalar) => boolean {
    if (typeof criterion === 'string') {
        const match = /^(<=|>=|<>|=|<|>)(.*)$/.exec(criterion.trim());
        if (match) {
            const operand: Scalar = numberFromText(match[2]!) ?? (match[2] === '' ? null : match[2]!);
            const op = match[1]!;
            return (value) => {
                const order = compare(value, operand);
                if (isError(order)) return false;
                if (op === '=') return order === 0;
                if (op === '<>') return order !== 0;
                if (op === '<') return order < 0;
                if (op === '<=') return order <= 0;
                if (op === '>') return order > 0;
                return order >= 0;
            };
        }
    }
    return (value) => compare(value, criterion) === 0;
}

/** The cells of a rectangle that the criterion picks, by their place in it. */
function picked(range: Argument, criterion: Scalar): number[] {
    const values = flatten(range);
    const test = matcher(criterion);
    const out: number[] = [];
    values.forEach((value, index) => {
        if (test(value)) out.push(index);
    });
    return out;
}

const asRange = (arg: Argument | undefined): RangeValue | CellError =>
    arg !== undefined && isRangeValue(arg) ? arg : errorValue('#VALUE!');

export const functions: Record<string, SheetFunction> = {
    // ---- arithmetic
    SUM: eager((args) => {
        const list = numbers(args);
        return isError(list) ? list : list.reduce((total, value) => total + value, 0);
    }),
    PRODUCT: eager((args) => {
        const list = numbers(args);
        return isError(list) ? list : list.reduce((total, value) => total * value, 1);
    }),
    AVERAGE: eager((args) => {
        const list = numbers(args);
        if (isError(list)) return list;
        return list.length ? list.reduce((total, value) => total + value, 0) / list.length : errorValue('#DIV/0!');
    }),
    MEDIAN: eager((args) => {
        const list = numbers(args);
        if (isError(list)) return list;
        if (!list.length) return errorValue('#DIV/0!');
        const sorted = [...list].sort((a, b) => a - b);
        const middle = Math.floor(sorted.length / 2);
        return sorted.length % 2 ? sorted[middle]! : (sorted[middle - 1]! + sorted[middle]!) / 2;
    }),
    MIN: eager((args) => {
        const list = numbers(args);
        return isError(list) ? list : list.length ? Math.min(...list) : 0;
    }),
    MAX: eager((args) => {
        const list = numbers(args);
        return isError(list) ? list : list.length ? Math.max(...list) : 0;
    }),
    COUNT: eager((args) => args.flatMap(flatten).filter((value) => typeof value === 'number').length),
    COUNTA: eager((args) => args.flatMap(flatten).filter((value) => value !== null && value !== '').length),
    COUNTBLANK: eager((args) => args.flatMap(flatten).filter((value) => value === null || value === '').length),
    COUNTIF: eager((args) => picked(args[0] ?? null, scalar(args[1] ?? null)).length),
    SUMIF: eager((args) => {
        const indexes = picked(args[0] ?? null, scalar(args[1] ?? null));
        const source = flatten(args[2] ?? args[0] ?? null);
        let total = 0;
        for (const index of indexes) {
            const value = source[index];
            if (isError(value)) return value;
            if (typeof value === 'number') total += value;
        }
        return total;
    }),
    ABS: eager((args) => apply(one(args[0]), Math.abs)),
    SIGN: eager((args) => apply(one(args[0]), Math.sign)),
    SQRT: eager((args) => apply(one(args[0]), (value) => (value < 0 ? errorValue('#VALUE!') : Math.sqrt(value)))),
    EXP: eager((args) => apply(one(args[0]), Math.exp)),
    LN: eager((args) => apply(one(args[0]), (value) => (value <= 0 ? errorValue('#VALUE!') : Math.log(value)))),
    LOG10: eager((args) => apply(one(args[0]), (value) => (value <= 0 ? errorValue('#VALUE!') : Math.log10(value)))),
    PI: eager(() => Math.PI),
    INT: eager((args) => apply(one(args[0]), Math.floor)),
    TRUNC: eager((args) => apply(one(args[0]), Math.trunc)),
    POWER: eager((args) => pair(one(args[0]), one(args[1]), (base, exponent) => base ** exponent)),
    MOD: eager((args) => pair(one(args[0]), one(args[1]), (value, divisor) => (divisor === 0 ? errorValue('#DIV/0!') : value - divisor * Math.floor(value / divisor)))),
    ROUND: eager((args) => pair(one(args[0]), one(args[1] ?? 0), (value, digits) => round(value, digits, (n) => Math.round(Math.abs(n)) * Math.sign(n)))),
    ROUNDUP: eager((args) => pair(one(args[0]), one(args[1] ?? 0), (value, digits) => round(value, digits, (n) => Math.ceil(Math.abs(n)) * Math.sign(n)))),
    ROUNDDOWN: eager((args) => pair(one(args[0]), one(args[1] ?? 0), (value, digits) => round(value, digits, (n) => Math.floor(Math.abs(n)) * Math.sign(n)))),
    CEILING: eager((args) => pair(one(args[0]), one(args[1] ?? 1), (value, step) => (step === 0 ? 0 : Math.ceil(value / step) * step))),
    FLOOR: eager((args) => pair(one(args[0]), one(args[1] ?? 1), (value, step) => (step === 0 ? errorValue('#DIV/0!') : Math.floor(value / step) * step))),

    // ---- logic
    TRUE: eager(() => true),
    FALSE: eager(() => false),
    NOT: eager((args) => apply(toBoolean(scalar(args[0] ?? null)), (value) => !value)),
    AND: eager((args) => every(args, true)),
    OR: eager((args) => every(args, false)),
    IF: (args, ctx) => {
        const condition = toBoolean(scalar(args[0]?.() ?? null));
        if (isError(condition)) return condition;
        // The branch not taken is never worked out: `IF(A1=0, 0, 1/A1)` is the
        // reason a spreadsheet has this rule at all.
        const branch = condition ? args[1] : args[2];
        return branch ? branch() : condition;
    },
    IFERROR: (args) => {
        const value = args[0]?.() ?? null;
        const failed = isRangeValue(value) ? firstError(value.values) : isError(value) ? value : null;
        return failed ? (args[1]?.() ?? null) : value;
    },
    ISBLANK: eager((args) => scalar(args[0] ?? null) === null),
    ISNUMBER: eager((args) => typeof scalar(args[0] ?? null) === 'number'),
    ISTEXT: eager((args) => typeof scalar(args[0] ?? null) === 'string'),
    ISERROR: eager((args) => isError(scalar(args[0] ?? null))),
    NA: eager(() => NA),

    // ---- text
    CONCAT: eager((args) => join(args.flatMap(flatten), '')),
    CONCATENATE: eager((args) => join(args.flatMap(flatten), '')),
    TEXTJOIN: eager((args) => {
        const separator = text(args[0]);
        if (isError(separator)) return separator;
        const skipEmpty = toBoolean(scalar(args[1] ?? true));
        if (isError(skipEmpty)) return skipEmpty;
        const values = args.slice(2).flatMap(flatten);
        return join(skipEmpty ? values.filter((value) => value !== null && value !== '') : values, separator);
    }),
    LEN: eager((args) => apply(text(args[0]), (value) => value.length)),
    UPPER: eager((args) => apply(text(args[0]), (value) => value.toUpperCase())),
    LOWER: eager((args) => apply(text(args[0]), (value) => value.toLowerCase())),
    TRIM: eager((args) => apply(text(args[0]), (value) => value.trim().replace(/\s+/g, ' '))),
    LEFT: eager((args) => pair(text(args[0]), one(args[1] ?? 1), (value, count) => value.slice(0, Math.max(0, count)))),
    RIGHT: eager((args) => pair(text(args[0]), one(args[1] ?? 1), (value, count) => (count <= 0 ? '' : value.slice(-count)))),
    MID: eager((args) => {
        const source = text(args[0]);
        const start = one(args[1]);
        const count = one(args[2]);
        const error = firstError([source, start, count]);
        if (error) return error;
        return (source as string).slice(Math.max(0, (start as number) - 1), Math.max(0, (start as number) - 1) + (count as number));
    }),
    FIND: eager((args) => {
        const needle = text(args[0]);
        const haystack = text(args[1]);
        const error = firstError([needle, haystack]);
        if (error) return error;
        const at = (haystack as string).indexOf(needle as string, Math.max(0, one(args[2] ?? 1) as number) - 1);
        return at < 0 ? VALUE : at + 1;
    }),
    SUBSTITUTE: eager((args) => {
        const source = text(args[0]);
        const from = text(args[1]);
        const to = text(args[2]);
        const error = firstError([source, from, to]);
        if (error) return error;
        return from === '' ? source : (source as string).split(from as string).join(to as string);
    }),
    REPT: eager((args) => pair(text(args[0]), one(args[1]), (value, count) => (count < 0 ? VALUE : value.repeat(Math.floor(count))))),
    VALUE: eager((args) => apply(text(args[0]), (value) => numberFromText(value) ?? VALUE)),

    // ---- dates, which are the number of days since 1899-12-30
    TODAY: eager((_args, ctx) => Math.floor(serialFromDate(ctx.now()))),
    NOW: eager((_args, ctx) => serialFromDate(ctx.now())),
    DATE: eager((args) => {
        const year = one(args[0]);
        const month = one(args[1]);
        const day = one(args[2]);
        const error = firstError([year, month, day]);
        return error ?? serialFromParts(year as number, month as number, day as number);
    }),
    YEAR: eager((args) => apply(one(args[0]), (serial) => dateFromSerial(serial).getUTCFullYear())),
    MONTH: eager((args) => apply(one(args[0]), (serial) => dateFromSerial(serial).getUTCMonth() + 1)),
    DAY: eager((args) => apply(one(args[0]), (serial) => dateFromSerial(serial).getUTCDate())),
    WEEKDAY: eager((args) => apply(one(args[0]), (serial) => dateFromSerial(serial).getUTCDay() + 1)),

    // ---- looking things up
    INDEX: eager((args) => {
        const range = asRange(args[0]);
        if (isError(range)) return range;
        const row = one(args[1] ?? 1);
        const col = one(args[2] ?? (range.cols === 1 ? 1 : 0));
        const error = firstError([row, col]);
        if (error) return error;
        const r = (row as number) - 1;
        const c = Math.max(0, (col as number) - 1);
        if (r < 0 || r >= range.rows || c >= range.cols) return errorValue('#REF!');
        return range.values[r * range.cols + c] ?? null;
    }),
    MATCH: eager((args) => {
        const needle = scalar(args[0] ?? null);
        const range = asRange(args[1]);
        if (isError(range)) return range;
        const at = range.values.findIndex((value) => compare(value, needle) === 0);
        return at < 0 ? NA : at + 1;
    }),
    VLOOKUP: eager((args) => {
        const needle = scalar(args[0] ?? null);
        const range = asRange(args[1]);
        if (isError(range)) return range;
        const column = one(args[2] ?? 1);
        if (isError(column)) return column;
        const c = (column as number) - 1;
        if (c < 0 || c >= range.cols) return errorValue('#REF!');
        for (let row = 0; row < range.rows; row++) {
            if (compare(range.values[row * range.cols]!, needle) === 0) return range.values[row * range.cols + c] ?? null;
        }
        return NA;
    })
};

/** A function over a value that may be an error, which passes the error on. */
function apply<T, R>(value: T | CellError, fn: (value: T) => R | CellError): R | CellError {
    return isError(value) ? value : fn(value);
}

function pair<A, B, R>(a: A | CellError, b: B | CellError, fn: (a: A, b: B) => R | CellError): R | CellError {
    if (isError(a)) return a;
    if (isError(b)) return b;
    return fn(a, b);
}

function join(values: Scalar[], separator: string): string | CellError {
    const parts: string[] = [];
    for (const value of values) {
        const part = toText(value);
        if (isError(part)) return part;
        parts.push(part);
    }
    return parts.join(separator);
}

/** `AND` wants every one; `OR` wants any. Both skip what is not a condition. */
function every(args: Argument[], all: boolean): boolean | CellError {
    let seen = false;
    let result = all;
    for (const value of args.flatMap(flatten)) {
        if (value === null) continue;
        const truth = toBoolean(value);
        if (isError(truth)) return truth;
        seen = true;
        result = all ? result && truth : result || truth;
    }
    return seen ? result : false;
}
