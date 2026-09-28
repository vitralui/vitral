/**
 * A QR Code encoder, after ISO/IEC 18004: numeric, alphanumeric and byte
 * (UTF-8) text, versions 1 to 40, the four error-correction levels, and the
 * mask the standard's penalty rules pick. No DOM: the answer is a square of
 * booleans, which a component draws however it likes.
 */

export type QRErrorCorrection = 'L' | 'M' | 'Q' | 'H';
export type QRMode = 'numeric' | 'alphanumeric' | 'byte';

export interface QROptions {
    /** How much of the code can be lost and still read: L 7%, M 15%, Q 25%, H 30%. Defaults to `'M'`. */
    ecc?: QRErrorCorrection;
    /** Raise the level when the text fits the same size at a higher one. Defaults to true. */
    boostEcc?: boolean;
    minVersion?: number;
    maxVersion?: number;
    /** 0–7; the standard's choice when left out. */
    mask?: number;
    /** The encoding; the tightest that fits the text when left out. */
    mode?: QRMode;
}

export interface QRCode {
    version: number;
    size: number;
    ecc: QRErrorCorrection;
    mask: number;
    mode: QRMode;
    /** `modules[y][x]`: true where the square is dark. */
    modules: boolean[][];
}

// Codewords of error correction per block, and blocks, by level and version (index 0 unused).
const ECC_PER_BLOCK: Record<QRErrorCorrection, number[]> = {
    L: [-1, 7, 10, 15, 20, 26, 18, 20, 24, 30, 18, 20, 24, 26, 30, 22, 24, 28, 30, 28, 28, 28, 28, 30, 30, 26, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
    M: [-1, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26, 30, 22, 22, 24, 24, 28, 28, 26, 26, 26, 26, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28],
    Q: [-1, 13, 22, 18, 26, 18, 24, 18, 22, 20, 24, 28, 26, 24, 20, 30, 24, 28, 28, 26, 30, 28, 30, 30, 30, 30, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
    H: [-1, 17, 28, 22, 16, 22, 28, 26, 26, 24, 28, 24, 28, 22, 24, 24, 30, 28, 28, 26, 28, 30, 24, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30]
};
const BLOCKS: Record<QRErrorCorrection, number[]> = {
    L: [-1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 4, 4, 4, 4, 4, 6, 6, 6, 6, 7, 8, 8, 9, 9, 10, 12, 12, 12, 13, 14, 15, 16, 17, 18, 19, 19, 20, 21, 22, 24, 25],
    M: [-1, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5, 5, 8, 9, 9, 10, 10, 11, 13, 14, 16, 17, 17, 18, 20, 21, 23, 25, 26, 28, 29, 31, 33, 35, 37, 38, 40, 43, 45, 47, 49],
    Q: [-1, 1, 1, 2, 2, 4, 4, 6, 6, 8, 8, 8, 10, 12, 16, 12, 17, 16, 18, 21, 20, 23, 23, 25, 27, 29, 34, 34, 35, 38, 40, 43, 45, 48, 51, 53, 56, 59, 62, 65, 68],
    H: [-1, 1, 1, 2, 4, 4, 4, 5, 6, 8, 8, 11, 11, 16, 16, 18, 16, 19, 21, 25, 25, 25, 34, 30, 32, 35, 37, 40, 42, 45, 48, 51, 54, 57, 60, 63, 66, 70, 74, 77, 81]
};
const FORMAT_BITS: Record<QRErrorCorrection, number> = { L: 1, M: 0, Q: 3, H: 2 };
const ALPHANUMERIC = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:';
const MODE_BITS: Record<QRMode, number> = { numeric: 1, alphanumeric: 2, byte: 4 };
const COUNT_BITS: Record<QRMode, [number, number, number]> = { numeric: [10, 12, 14], alphanumeric: [9, 11, 13], byte: [8, 16, 16] };

const countBits = (mode: QRMode, version: number) => COUNT_BITS[mode][version <= 9 ? 0 : version <= 26 ? 1 : 2];

function rawDataModules(version: number): number {
    let result = (16 * version + 128) * version + 64;
    if (version >= 2) {
        const align = Math.floor(version / 7) + 2;
        result -= (25 * align - 10) * align - 55;
        if (version >= 7) result -= 36;
    }
    return result;
}

const dataCodewords = (version: number, ecc: QRErrorCorrection) => Math.floor(rawDataModules(version) / 8) - ECC_PER_BLOCK[ecc][version]! * BLOCKS[ecc][version]!;

/** The tightest encoding the whole text fits. */
export function qrModeOf(text: string): QRMode {
    if (/^[0-9]*$/.test(text)) return 'numeric';
    if ([...text].every((c) => ALPHANUMERIC.includes(c))) return 'alphanumeric';
    return 'byte';
}

class Bits {
    readonly bits: number[] = [];
    push(value: number, length: number) {
        for (let i = length - 1; i >= 0; i--) this.bits.push((value >>> i) & 1);
    }
}

/** The segment's data, without its mode and count: how its characters are packed. */
function segmentData(text: string, mode: QRMode): { bits: number[]; count: number } {
    const out = new Bits();
    if (mode === 'numeric') {
        for (let i = 0; i < text.length; i += 3) {
            const chunk = text.slice(i, i + 3);
            out.push(Number(chunk), chunk.length * 3 + 1);
        }
        return { bits: out.bits, count: text.length };
    }
    if (mode === 'alphanumeric') {
        for (let i = 0; i < text.length; i += 2) {
            if (i + 1 < text.length) out.push(ALPHANUMERIC.indexOf(text[i]!) * 45 + ALPHANUMERIC.indexOf(text[i + 1]!), 11);
            else out.push(ALPHANUMERIC.indexOf(text[i]!), 6);
        }
        return { bits: out.bits, count: text.length };
    }
    const bytes = new TextEncoder().encode(text);
    for (const b of bytes) out.push(b, 8);
    return { bits: out.bits, count: bytes.length };
}

// ---- Reed–Solomon over GF(2^8), modulo x^8 + x^4 + x^3 + x^2 + 1 ----

function multiply(x: number, y: number): number {
    let z = 0;
    for (let i = 7; i >= 0; i--) {
        z = (z << 1) ^ ((z >>> 7) * 0x11d);
        z ^= ((y >>> i) & 1) * x;
    }
    return z;
}

function divisor(degree: number): number[] {
    const result = new Array<number>(degree).fill(0);
    result[degree - 1] = 1;
    let root = 1;
    for (let i = 0; i < degree; i++) {
        for (let j = 0; j < result.length; j++) {
            result[j] = multiply(result[j]!, root);
            if (j + 1 < result.length) result[j] ^= result[j + 1]!;
        }
        root = multiply(root, 0x02);
    }
    return result;
}

function remainder(data: readonly number[], div: readonly number[]): number[] {
    const result = new Array<number>(div.length).fill(0);
    for (const b of data) {
        const factor = b ^ result.shift()!;
        result.push(0);
        div.forEach((coef, i) => (result[i] ^= multiply(coef, factor)));
    }
    return result;
}

/** The codewords with their error correction, in blocks, interleaved as the standard lays them out. */
function withErrorCorrection(data: number[], version: number, ecc: QRErrorCorrection): number[] {
    const numBlocks = BLOCKS[ecc][version]!;
    const blockEcc = ECC_PER_BLOCK[ecc][version]!;
    const raw = Math.floor(rawDataModules(version) / 8);
    const shortBlocks = numBlocks - (raw % numBlocks);
    const shortLength = Math.floor(raw / numBlocks);
    const div = divisor(blockEcc);
    const blocks: number[][] = [];
    for (let i = 0, k = 0; i < numBlocks; i++) {
        const dat = data.slice(k, k + shortLength - blockEcc + (i < shortBlocks ? 0 : 1));
        k += dat.length;
        const tail = remainder(dat, div);
        if (i < shortBlocks) dat.push(0);
        blocks.push(dat.concat(tail));
    }
    const result: number[] = [];
    for (let i = 0; i < blocks[0]!.length; i++) {
        blocks.forEach((block, j) => {
            // The padding put in the short blocks is not a codeword.
            if (i !== shortLength - blockEcc || j >= shortBlocks) result.push(block[i]!);
        });
    }
    return result;
}

// ---- the matrix ----

class Matrix {
    readonly modules: boolean[][];
    readonly reserved: boolean[][];

    constructor(readonly size: number) {
        this.modules = Array.from({ length: size }, () => new Array<boolean>(size).fill(false));
        this.reserved = Array.from({ length: size }, () => new Array<boolean>(size).fill(false));
    }

    fixed(x: number, y: number, dark: boolean) {
        this.modules[y]![x] = dark;
        this.reserved[y]![x] = true;
    }
}

function alignmentPositions(version: number): number[] {
    if (version === 1) return [];
    const count = Math.floor(version / 7) + 2;
    const step = version === 32 ? 26 : Math.ceil((version * 4 + 4) / (count * 2 - 2)) * 2;
    const result = [6];
    for (let pos = version * 4 + 17 - 7; result.length < count; pos -= step) result.splice(1, 0, pos);
    return result;
}

function drawFunctionPatterns(m: Matrix, version: number) {
    const size = m.size;
    for (let i = 0; i < size; i++) {
        m.fixed(6, i, i % 2 === 0);
        m.fixed(i, 6, i % 2 === 0);
    }
    const finder = (cx: number, cy: number) => {
        for (let dy = -4; dy <= 4; dy++)
            for (let dx = -4; dx <= 4; dx++) {
                const dist = Math.max(Math.abs(dx), Math.abs(dy));
                const x = cx + dx;
                const y = cy + dy;
                if (x >= 0 && x < size && y >= 0 && y < size) m.fixed(x, y, dist !== 2 && dist !== 4);
            }
    };
    finder(3, 3);
    finder(size - 4, 3);
    finder(3, size - 4);
    const positions = alignmentPositions(version);
    const last = positions.length - 1;
    positions.forEach((py, i) =>
        positions.forEach((px, j) => {
            // Not over the three finder patterns.
            if ((i === 0 && j === 0) || (i === 0 && j === last) || (i === last && j === 0)) return;
            for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) m.fixed(px + dx, py + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
        })
    );
    drawFormatBits(m, 'M', 0);
    drawVersion(m, version);
}

function drawFormatBits(m: Matrix, ecc: QRErrorCorrection, mask: number) {
    const data = (FORMAT_BITS[ecc] << 3) | mask;
    let rem = data;
    for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
    const bits = ((data << 10) | rem) ^ 0x5412;
    const bit = (i: number) => ((bits >>> i) & 1) !== 0;
    const size = m.size;
    for (let i = 0; i <= 5; i++) m.fixed(8, i, bit(i));
    m.fixed(8, 7, bit(6));
    m.fixed(8, 8, bit(7));
    m.fixed(7, 8, bit(8));
    for (let i = 9; i < 15; i++) m.fixed(14 - i, 8, bit(i));
    for (let i = 0; i < 8; i++) m.fixed(size - 1 - i, 8, bit(i));
    for (let i = 8; i < 15; i++) m.fixed(8, size - 15 + i, bit(i));
    m.fixed(8, size - 8, true);
}

function drawVersion(m: Matrix, version: number) {
    if (version < 7) return;
    let rem = version;
    for (let i = 0; i < 12; i++) rem = (rem << 1) ^ ((rem >>> 11) * 0x1f25);
    const bits = (version << 12) | rem;
    for (let i = 0; i < 18; i++) {
        const dark = ((bits >>> i) & 1) !== 0;
        const a = m.size - 11 + (i % 3);
        const b = Math.floor(i / 3);
        m.fixed(a, b, dark);
        m.fixed(b, a, dark);
    }
}

function drawCodewords(m: Matrix, data: number[]) {
    const size = m.size;
    let i = 0;
    for (let right = size - 1; right >= 1; right -= 2) {
        if (right === 6) right = 5;
        for (let vert = 0; vert < size; vert++) {
            for (let j = 0; j < 2; j++) {
                const x = right - j;
                const upward = ((right + 1) & 2) === 0;
                const y = upward ? size - 1 - vert : vert;
                if (!m.reserved[y]![x] && i < data.length * 8) {
                    m.modules[y]![x] = ((data[i >>> 3]! >>> (7 - (i & 7))) & 1) !== 0;
                    i++;
                }
            }
        }
    }
}

const MASKS: ((x: number, y: number) => boolean)[] = [
    (x, y) => (x + y) % 2 === 0,
    (_x, y) => y % 2 === 0,
    (x) => x % 3 === 0,
    (x, y) => (x + y) % 3 === 0,
    (x, y) => (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0,
    (x, y) => ((x * y) % 2) + ((x * y) % 3) === 0,
    (x, y) => (((x * y) % 2) + ((x * y) % 3)) % 2 === 0,
    (x, y) => (((x + y) % 2) + ((x * y) % 3)) % 2 === 0
];

function applyMask(m: Matrix, mask: number) {
    const test = MASKS[mask]!;
    for (let y = 0; y < m.size; y++) for (let x = 0; x < m.size; x++) if (!m.reserved[y]![x] && test(x, y)) m.modules[y]![x] = !m.modules[y]![x];
}

/** The standard's penalty for a finished matrix: long runs, blocks, finder look-alikes and imbalance. */
function penalty(m: Matrix): number {
    const size = m.size;
    const mod = m.modules;
    let result = 0;
    const addHistory = (length: number, history: number[]) => {
        if (history[0] === 0) length += size;
        history.pop();
        history.unshift(length);
    };
    const countPatterns = (h: number[]) => {
        const n = h[1]!;
        const core = n > 0 && h[2] === n && h[3] === n * 3 && h[4] === n && h[5] === n;
        return (core && h[0]! >= n * 4 && h[6]! >= n ? 1 : 0) + (core && h[6]! >= n * 4 && h[0]! >= n ? 1 : 0);
    };
    const terminate = (color: boolean, length: number, h: number[]) => {
        if (color) {
            addHistory(length, h);
            length = 0;
        }
        length += size;
        addHistory(length, h);
        return countPatterns(h);
    };
    for (const horizontal of [true, false]) {
        for (let a = 0; a < size; a++) {
            let color = false;
            let run = 0;
            const history = [0, 0, 0, 0, 0, 0, 0];
            for (let b = 0; b < size; b++) {
                const dark = horizontal ? mod[a]![b]! : mod[b]![a]!;
                if (dark === color) {
                    run++;
                    if (run === 5) result += 3;
                    else if (run > 5) result++;
                } else {
                    addHistory(run, history);
                    if (!color) result += countPatterns(history) * 40;
                    color = dark;
                    run = 1;
                }
            }
            result += terminate(color, run, history) * 40;
        }
    }
    for (let y = 0; y < size - 1; y++)
        for (let x = 0; x < size - 1; x++) {
            const c = mod[y]![x];
            if (c === mod[y]![x + 1] && c === mod[y + 1]![x] && c === mod[y + 1]![x + 1]) result += 3;
        }
    let dark = 0;
    for (const row of mod) for (const cell of row) if (cell) dark++;
    const total = size * size;
    result += (Math.ceil(Math.abs(dark * 20 - total * 10) / total) - 1) * 10;
    return result;
}

/** Encodes text as a QR Code. Throws when it does not fit version 40 at the level asked. */
export function encodeQR(text: string, options: QROptions = {}): QRCode {
    const mode = options.mode ?? qrModeOf(text);
    let ecc = options.ecc ?? 'M';
    const min = Math.max(1, options.minVersion ?? 1);
    const max = Math.min(40, options.maxVersion ?? 40);
    const segment = segmentData(text, mode);
    const needed = (version: number) => 4 + countBits(mode, version) + segment.bits.length;

    let version = min;
    for (; ; version++) {
        if (segment.count >= 1 << countBits(mode, version)) {
            if (version >= max) throw new RangeError('The text is too long for a QR Code');
            continue;
        }
        if (needed(version) <= dataCodewords(version, ecc) * 8) break;
        if (version >= max) throw new RangeError('The text is too long for a QR Code');
    }
    if (options.boostEcc !== false) {
        for (const higher of ['M', 'Q', 'H'] as const) if (needed(version) <= dataCodewords(version, higher) * 8) ecc = higher;
    }

    const bits = new Bits();
    bits.push(MODE_BITS[mode], 4);
    bits.push(segment.count, countBits(mode, version));
    bits.bits.push(...segment.bits);
    const capacity = dataCodewords(version, ecc) * 8;
    bits.push(0, Math.min(4, capacity - bits.bits.length));
    bits.push(0, (8 - (bits.bits.length % 8)) % 8);
    for (let pad = 0xec; bits.bits.length < capacity; pad ^= 0xec ^ 0x11) bits.push(pad, 8);
    const codewords: number[] = [];
    for (let i = 0; i < bits.bits.length; i += 8) codewords.push(bits.bits.slice(i, i + 8).reduce((acc, b) => (acc << 1) | b, 0));

    const size = version * 4 + 17;
    const m = new Matrix(size);
    drawFunctionPatterns(m, version);
    drawCodewords(m, withErrorCorrection(codewords, version, ecc));

    let mask = options.mask ?? -1;
    if (mask < 0 || mask > 7) {
        let best = Infinity;
        for (let i = 0; i < 8; i++) {
            applyMask(m, i);
            drawFormatBits(m, ecc, i);
            const score = penalty(m);
            if (score < best) {
                best = score;
                mask = i;
            }
            applyMask(m, i);
        }
    }
    applyMask(m, mask);
    drawFormatBits(m, ecc, mask);
    return { version, size, ecc, mask, mode, modules: m.modules };
}

/**
 * The dark squares as one SVG path, with `margin` light squares around them:
 * a run of squares in a row is one rectangle, so the path stays short.
 */
export function qrPath(code: QRCode, margin = 4): string {
    let d = '';
    code.modules.forEach((row, y) => {
        let x = 0;
        while (x < row.length) {
            if (!row[x]) {
                x++;
                continue;
            }
            let end = x;
            while (end < row.length && row[end]) end++;
            d += `M${x + margin},${y + margin}h${end - x}v1h${x - end}z`;
            x = end;
        }
    });
    return d;
}
