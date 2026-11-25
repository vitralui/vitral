import { readValue } from './edit';
import { exportColumns } from './export';
import type { ResolvedColumn } from './state';
import type { Row } from './types';

/**
 * Rows as an Excel workbook, with nothing to install: the few parts of the
 * Office Open XML format a sheet of values needs, in a zip that stores rather
 * than compresses. A number stays a number, a date a date and a boolean a
 * boolean, so the sheet can be added up and sorted as it is opened.
 */

/** How a table is written out as a workbook. */
export interface DataGridXlsxOptions {
    /** The sheet's name, at most 31 characters. Defaults to `Sheet1`. */
    sheetName?: string;
    /** Write the column headings first, in bold, and keep them in view. Defaults to true. */
    header?: boolean;
    /** Which columns, by key; every exportable column on show otherwise. */
    columns?: string[];
}

const encoder = new TextEncoder();

const xml = (text: string) =>
    text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        // Characters XML 1.0 cannot hold at all.
        // eslint-disable-next-line no-control-regex
        .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '');

/** A column's letters: A, B, … Z, AA. */
const letters = (index: number): string => {
    let out = '';
    for (let n = index + 1; n > 0; n = Math.floor((n - 1) / 26)) out = String.fromCharCode(65 + ((n - 1) % 26)) + out;
    return out;
};

/** A date as Excel counts it: days since the last day of 1899, the time of day a fraction. */
const serial = (date: Date) => (Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds()) - Date.UTC(1899, 11, 30)) / 86_400_000;

/** One cell: its kind decided by its value. Style 1 is a heading, 2 a date, 3 a date with a time. */
function cell(ref: string, value: unknown, style?: number): string {
    const s = style ? ` s="${style}"` : '';
    if (value === null || value === undefined || value === '') return '';
    if (typeof value === 'number') return Number.isFinite(value) ? `<c r="${ref}"${s}><v>${value}</v></c>` : '';
    if (typeof value === 'boolean') return `<c r="${ref}" t="b"${s}><v>${value ? 1 : 0}</v></c>`;
    if (value instanceof Date) {
        if (Number.isNaN(value.getTime())) return '';
        const timed = value.getHours() || value.getMinutes() || value.getSeconds();
        return `<c r="${ref}" s="${style ?? (timed ? 3 : 2)}"><v>${serial(value)}</v></c>`;
    }
    const text = typeof value === 'object' ? JSON.stringify(value) : String(value);
    const space = text !== text.trim() || /\n/.test(text) ? ' xml:space="preserve"' : '';
    return `<c r="${ref}" t="inlineStr"${s}><is><t${space}>${xml(text)}</t></is></c>`;
}

/** The sheet's XML: the heading row, then a row for each row, its widths from what it holds. */
function sheetXml<T>(rows: readonly T[], columns: readonly ResolvedColumn<T>[], header: boolean): string {
    const values = rows.map((row) => columns.map((c) => (c.column.exportValue ? c.column.exportValue(row) : readValue(c.column, row, c.field))));
    const headings = columns.map((c) => c.column.exportHeader ?? c.header);
    const width = (at: number) => {
        const longest = Math.max(header ? String(headings[at] ?? '').length : 0, ...values.slice(0, 500).map((line) => (line[at] instanceof Date ? 11 : String(line[at] ?? '').length)));
        return Math.min(60, Math.max(8, longest + 2));
    };
    const cols = columns.length ? `<cols>${columns.map((_, at) => `<col min="${at + 1}" max="${at + 1}" width="${width(at)}" customWidth="1"/>`).join('')}</cols>` : '';
    const out: string[] = [];
    let line = 1;
    if (header) out.push(`<row r="${line++}">${headings.map((text, at) => cell(`${letters(at)}1`, text, 1)).join('')}</row>`);
    for (const row of values) {
        out.push(`<row r="${line}">${row.map((value, at) => cell(`${letters(at)}${line}`, value)).join('')}</row>`);
        line++;
    }
    const frozen = header ? '<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>' : '';
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">${frozen}${cols}<sheetData>${out.join('')}</sheetData></worksheet>`;
}

const STYLES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><numFmts count="1"><numFmt numFmtId="164" formatCode="yyyy-mm-dd hh:mm"/></numFmts><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="1"><border/></borders><cellStyleXfs count="1"><xf/></cellStyleXfs><cellXfs count="4"><xf/><xf fontId="1" applyFont="1"/><xf numFmtId="14" applyNumberFormat="1"/><xf numFmtId="164" applyNumberFormat="1"/></cellXfs></styleSheet>`;

/** The workbook's parts, by their paths in the zip. */
function parts(sheet: string, name: string): [string, string][] {
    return [
        [
            '[Content_Types].xml',
            `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>`
        ],
        [
            '_rels/.rels',
            `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`
        ],
        [
            'xl/workbook.xml',
            `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="${xml(name)}" sheetId="1" r:id="rId1"/></sheets></workbook>`
        ],
        [
            'xl/_rels/workbook.xml.rels',
            `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`
        ],
        ['xl/styles.xml', STYLES],
        ['xl/worksheets/sheet1.xml', sheet]
    ];
}

/** A sheet name Excel accepts: none of `[]:*?/\`, at most 31 characters, never empty. */
const sheetName = (name?: string) => (name ?? 'Sheet1').replace(/[[\]:*?/\\]/g, ' ').slice(0, 31).trim() || 'Sheet1';

/** Rows as the bytes of an `.xlsx` file, in the columns' order. */
export function toXlsx<T = Row>(rows: readonly T[], columns: readonly ResolvedColumn<T>[], options: DataGridXlsxOptions = {}): Uint8Array {
    const chosen = exportColumns(columns, options.columns);
    return zip(parts(sheetXml(rows, chosen, options.header !== false), sheetName(options.sheetName)).map(([path, text]) => [path, encoder.encode(text)]));
}

// ---- a zip that stores ---------------------------------------------------------------

let crcTable: Uint32Array | undefined;

/** The CRC-32 a zip keeps of each file. */
export function crc32(bytes: Uint8Array): number {
    if (!crcTable) {
        crcTable = new Uint32Array(256);
        for (let n = 0; n < 256; n++) {
            let c = n;
            for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
            crcTable[n] = c >>> 0;
        }
    }
    let crc = 0xffffffff;
    for (const byte of bytes) crc = crcTable[(crc ^ byte) & 0xff]! ^ (crc >>> 8);
    return (crc ^ 0xffffffff) >>> 0;
}

/** The first day a zip can say, 1 January 1980: every file is dated so, the workbook says when it was made. */
const DOS_DATE = (1 << 5) | 1;

/** Files in a zip, stored as they are: what every reader of the format opens. */
export function zip(files: [string, Uint8Array][]): Uint8Array {
    const chunks: Uint8Array[] = [];
    const central: Uint8Array[] = [];
    let offset = 0;
    for (const [path, data] of files) {
        const name = encoder.encode(path);
        const crc = crc32(data);
        const local = new DataView(new ArrayBuffer(30));
        local.setUint32(0, 0x04034b50, true);
        local.setUint16(4, 20, true);
        local.setUint16(6, 0x0800, true); // The names are UTF-8.
        local.setUint16(12, DOS_DATE, true);
        local.setUint32(14, crc, true);
        local.setUint32(18, data.length, true);
        local.setUint32(22, data.length, true);
        local.setUint16(26, name.length, true);
        const entry = new DataView(new ArrayBuffer(46));
        entry.setUint32(0, 0x02014b50, true);
        entry.setUint16(4, 20, true);
        entry.setUint16(6, 20, true);
        entry.setUint16(8, 0x0800, true);
        entry.setUint16(14, DOS_DATE, true);
        entry.setUint32(16, crc, true);
        entry.setUint32(20, data.length, true);
        entry.setUint32(24, data.length, true);
        entry.setUint16(28, name.length, true);
        entry.setUint32(42, offset, true);
        chunks.push(new Uint8Array(local.buffer), name, data);
        central.push(new Uint8Array(entry.buffer), name);
        offset += 30 + name.length + data.length;
    }
    const size = central.reduce((sum, chunk) => sum + chunk.length, 0);
    const end = new DataView(new ArrayBuffer(22));
    end.setUint32(0, 0x06054b50, true);
    end.setUint16(8, files.length, true);
    end.setUint16(10, files.length, true);
    end.setUint32(12, size, true);
    end.setUint32(16, offset, true);
    const all = [...chunks, ...central, new Uint8Array(end.buffer)];
    const out = new Uint8Array(all.reduce((sum, chunk) => sum + chunk.length, 0));
    let at = 0;
    for (const chunk of all) {
        out.set(chunk, at);
        at += chunk.length;
    }
    return out;
}
