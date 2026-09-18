import { formatDate, formatTime, type Locale } from '@vitral/core';
import type { ChartFormatContext, ChartFormatter } from './types';

/**
 * Chart text templates. A template is text with `{field}` or
 * `{field|preset}` placeholders, so a formatter is data and survives JSON:
 *
 * - fields: `value`, `series`, `category`, `x`, `y`, `z`, `percent`, `total`, `index`
 * - presets: `number` (the default for numbers), `integer`, `fixed:2`,
 *   `compact` (1.2K), `percent` (12.3 → 12.3%), `ratio` (0.123 → 12.3%),
 *   `currency:BRL`, `bytes`, `abs`, `date:dd MMM` (a `formatDate` pattern),
 *   `date` (the locale's date format), `time`, `datetime`
 *
 * `'{value|compact} users'`, `'{series}: {value|currency:EUR}'`,
 * `'{value|date:HH:mm}'`. Numbers and dates follow the locale.
 */

const numberFormats = new Map<string, Intl.NumberFormat>();
function intl(locale: string, options: Intl.NumberFormatOptions): Intl.NumberFormat {
    const key = `${locale}|${JSON.stringify(options)}`;
    let format = numberFormats.get(key);
    if (!format) numberFormats.set(key, (format = new Intl.NumberFormat(locale, options)));
    return format;
}

/** A number the way an axis wants it: the locale's separators and no more decimals than needed. */
export function formatNumber(value: number, locale: string, maxFractionDigits = 2, minFractionDigits = 0): string {
    if (!Number.isFinite(value)) return '';
    return intl(locale, { maximumFractionDigits: Math.max(minFractionDigits, maxFractionDigits), minimumFractionDigits: minFractionDigits }).format(value);
}

function toDate(value: unknown): Date | null {
    if (value instanceof Date) return value;
    if (typeof value === 'number' || (typeof value === 'string' && value !== '' && !Number.isNaN(Date.parse(value)))) {
        const d = new Date(value as number | string);
        return Number.isNaN(d.getTime()) ? null : d;
    }
    return null;
}

const UNITS = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];

/** One value through one preset. */
export function applyPreset(value: unknown, preset: string | undefined, locale: Locale, decimals = 2): string {
    if (value === null || value === undefined) return '';
    const [name, ...rest] = (preset ?? '').split(':');
    const arg = rest.join(':');
    const code = locale.code;
    const n = typeof value === 'number' ? value : Number(value);
    switch (name) {
        case '':
        case 'number':
            if (typeof value !== 'number') return String(value);
            return formatNumber(value, code, decimals);
        case 'integer':
            return Number.isFinite(n) ? formatNumber(Math.round(n), code, 0) : String(value);
        case 'fixed': {
            const digits = Math.max(0, Math.min(20, Number(arg) || 0));
            return Number.isFinite(n) ? formatNumber(n, code, digits, digits) : String(value);
        }
        case 'compact':
            return Number.isFinite(n) ? intl(code, { notation: 'compact', maximumFractionDigits: 1 }).format(n) : String(value);
        case 'percent':
            return Number.isFinite(n) ? intl(code, { style: 'percent', maximumFractionDigits: arg ? Number(arg) : 1 }).format(n / 100) : String(value);
        case 'ratio':
            return Number.isFinite(n) ? intl(code, { style: 'percent', maximumFractionDigits: arg ? Number(arg) : 1 }).format(n) : String(value);
        case 'currency':
            return Number.isFinite(n) ? intl(code, { style: 'currency', currency: arg || 'USD' }).format(n) : String(value);
        case 'abs':
            return Number.isFinite(n) ? formatNumber(Math.abs(n), code, decimals) : String(value);
        case 'bytes': {
            if (!Number.isFinite(n)) return String(value);
            let v = Math.abs(n);
            let unit = 0;
            while (v >= 1024 && unit < UNITS.length - 1) {
                v /= 1024;
                unit++;
            }
            return `${n < 0 ? '-' : ''}${formatNumber(v, code, unit ? 1 : 0)} ${UNITS[unit]}`;
        }
        case 'date': {
            const d = toDate(value);
            return d ? formatDate(d, arg || locale.dateFormat, locale) : String(value);
        }
        case 'time': {
            const d = toDate(value);
            return d ? formatTime(d, code) : String(value);
        }
        case 'datetime': {
            const d = toDate(value);
            return d ? `${formatDate(d, locale.dateFormat, locale)} ${formatTime(d, code)}` : String(value);
        }
        default:
            return String(value);
    }
}

export type ChartTemplateFields = Record<string, unknown>;

/** Fills a template's placeholders from `fields`. */
export function formatTemplate(template: string, fields: ChartTemplateFields, locale: Locale, decimals = 2): string {
    return template.replace(/\{(\w+)(?:\|([^{}]*))?\}/g, (whole, key: string, preset?: string) => (key in fields ? applyPreset(fields[key], preset, locale, decimals) : whole));
}

/**
 * Turns a formatter option into a function of the value: a template is filled
 * with `value` plus the context's fields, a function is called, and nothing
 * falls back to `fallback` (itself a template).
 */
export function chartFormatter(formatter: ChartFormatter | undefined, fallback: string, locale: Locale, decimals = 2): (value: unknown, context?: Partial<ChartFormatContext> & ChartTemplateFields) => string {
    return (value, context = {}) => {
        if (typeof formatter === 'function') return formatter(value, { seriesIndex: -1, dataPointIndex: -1, ...context });
        const fields: ChartTemplateFields = { ...context, value, series: context.seriesName, category: context.category, percent: context.percent };
        return formatTemplate(formatter ?? fallback, fields, locale, decimals);
    };
}
