import type { Locale } from '@vitral/core';
import { alignCenter, alignLeft, alignRight, bold, clearFormatting, decimalDecrease, decimalIncrease, dollarSign, italic, percent, redo, undo, type IconDef } from '@vitral/icons';
import type { CellFormat, SpreadsheetToolbarItem } from './engine/types';

/**
 * What every toolbar button is — icon, name, what it does to the selection and
 * what makes it look pressed — as plain data, so the framework-free toolbar,
 * a framework component and anything else draw the same buttons from the same
 * list.
 */

/** What pressing a button does. */
export type SpreadsheetCommand =
    | { kind: 'history'; step: 'undo' | 'redo' }
    /** Merged into the format of every cell in the selection. */
    | { kind: 'format'; format: CellFormat; off?: CellFormat }
    /** More or fewer digits after the point. */
    | { kind: 'decimals'; by: number }
    | { kind: 'clear' };

export interface SpreadsheetButtonSpec {
    icon: IconDef;
    label: (words: Locale['spreadsheet']) => string;
    command: SpreadsheetCommand;
    /** What the button's pressed state reflects, read from the cell the caret is in. */
    active?: (format: CellFormat | undefined) => boolean;
}

/** Everything a plain toolbar button can be. */
export const spreadsheetButtons: Record<Exclude<SpreadsheetToolbarItem, 'numberFormat'>, SpreadsheetButtonSpec> = {
    undo: { icon: undo, label: (t) => t.undo, command: { kind: 'history', step: 'undo' } },
    redo: { icon: redo, label: (t) => t.redo, command: { kind: 'history', step: 'redo' } },
    currency: {
        icon: dollarSign,
        label: (t) => t.currency,
        command: { kind: 'format', format: { kind: 'currency' }, off: { kind: 'general' } },
        active: (format) => format?.kind === 'currency'
    },
    percent: {
        icon: percent,
        label: (t) => t.percent,
        command: { kind: 'format', format: { kind: 'percent' }, off: { kind: 'general' } },
        active: (format) => format?.kind === 'percent'
    },
    decimalDecrease: { icon: decimalDecrease, label: (t) => t.decimalDecrease, command: { kind: 'decimals', by: -1 } },
    decimalIncrease: { icon: decimalIncrease, label: (t) => t.decimalIncrease, command: { kind: 'decimals', by: 1 } },
    bold: { icon: bold, label: (t) => t.bold, command: { kind: 'format', format: { bold: true }, off: { bold: false } }, active: (format) => !!format?.bold },
    italic: { icon: italic, label: (t) => t.italic, command: { kind: 'format', format: { italic: true }, off: { italic: false } }, active: (format) => !!format?.italic },
    alignLeft: {
        icon: alignLeft,
        label: (t) => t.alignLeft,
        command: { kind: 'format', format: { align: 'left' }, off: { align: undefined } },
        active: (format) => format?.align === 'left'
    },
    alignCenter: {
        icon: alignCenter,
        label: (t) => t.alignCenter,
        command: { kind: 'format', format: { align: 'center' }, off: { align: undefined } },
        active: (format) => format?.align === 'center'
    },
    alignRight: {
        icon: alignRight,
        label: (t) => t.alignRight,
        command: { kind: 'format', format: { align: 'right' }, off: { align: undefined } },
        active: (format) => format?.align === 'right'
    },
    clear: { icon: clearFormatting, label: (t) => t.clearFormatting, command: { kind: 'clear' } }
};

/** What the number format select offers, in the order it offers it. */
export const numberFormats: NonNullable<CellFormat['kind']>[] = ['general', 'number', 'percent', 'currency', 'date', 'text'];

/** The toolbar a spreadsheet shows unless it is told otherwise. */
export const defaultToolbar: SpreadsheetToolbarItem[][] = [
    ['undo', 'redo'],
    ['numberFormat'],
    ['currency', 'percent', 'decimalDecrease', 'decimalIncrease'],
    ['bold', 'italic'],
    ['alignLeft', 'alignCenter', 'alignRight'],
    ['clear']
];

/** The icons the toolbar draws, for the registry, so a name resolves without an application registering anything. */
export const toolbarIcons: IconDef[] = [undo, redo, dollarSign, percent, decimalDecrease, decimalIncrease, bold, italic, alignLeft, alignCenter, alignRight, clearFormatting];
