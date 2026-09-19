import { formatRef, offsetRef, parseRef } from './a1';
import { cellErrors, type CellErrorCode, type ParsedRef } from './types';

/**
 * A formula, read into a tree. The grammar is the one every spreadsheet has:
 * comparisons over concatenation over arithmetic, `^` to the right, a `%`
 * after a number, references and rectangles, and calls with `,` between their
 * arguments. Nothing here evaluates anything — `evaluate.ts` does that, and
 * `deps.ts` walks the same tree for what a formula reads.
 */

export type BinaryOperator = '=' | '<>' | '<' | '>' | '<=' | '>=' | '&' | '+' | '-' | '*' | '/' | '^';

export type Node =
    | { kind: 'number'; value: number }
    | { kind: 'text'; value: string }
    | { kind: 'boolean'; value: boolean }
    | { kind: 'error'; code: CellErrorCode }
    | { kind: 'ref'; ref: ParsedRef }
    | { kind: 'range'; from: ParsedRef; to: ParsedRef }
    | { kind: 'unary'; op: '-' | '+' | '%'; operand: Node }
    | { kind: 'binary'; op: BinaryOperator; left: Node; right: Node }
    | { kind: 'call'; name: string; args: Node[] };

/** What a formula that does not read is refused with. */
export class FormulaSyntaxError extends Error {}

type Token =
    | { type: 'number'; value: number }
    | { type: 'text'; value: string }
    | { type: 'name'; value: string }
    | { type: 'error'; value: CellErrorCode }
    | { type: 'op'; value: string }
    | { type: 'punct'; value: '(' | ')' | ',' | ':' };

const OPERATORS = ['<>', '<=', '>=', '=', '<', '>', '&', '+', '-', '*', '/', '^', '%'];
const isDigit = (char: string) => char >= '0' && char <= '9';
const isNameStart = (char: string) => /[A-Za-z_$]/.test(char);
const isNamePart = (char: string) => /[A-Za-z0-9_.$]/.test(char);

export function tokenize(source: string): Token[] {
    const tokens: Token[] = [];
    let i = 0;
    while (i < source.length) {
        const char = source[i]!;
        if (char === ' ' || char === '\t' || char === '\n' || char === '\r') {
            i++;
            continue;
        }
        if (char === '"') {
            // `""` inside a string is one quote, which is how a spreadsheet escapes.
            let value = '';
            i++;
            for (;;) {
                if (i >= source.length) throw new FormulaSyntaxError('a string was never closed');
                if (source[i] === '"') {
                    if (source[i + 1] === '"') {
                        value += '"';
                        i += 2;
                        continue;
                    }
                    i++;
                    break;
                }
                value += source[i];
                i++;
            }
            tokens.push({ type: 'text', value });
            continue;
        }
        if (char === '#') {
            const code = cellErrors.find((error) => source.startsWith(error, i));
            if (!code) throw new FormulaSyntaxError(`unknown error value at ${i}`);
            tokens.push({ type: 'error', value: code });
            i += code.length;
            continue;
        }
        if (isDigit(char) || (char === '.' && isDigit(source[i + 1] ?? ''))) {
            const match = /^[0-9]*\.?[0-9]*(?:[eE][+-]?[0-9]+)?/.exec(source.slice(i))![0];
            tokens.push({ type: 'number', value: Number(match) });
            i += match.length;
            continue;
        }
        if (isNameStart(char)) {
            let value = '';
            while (i < source.length && isNamePart(source[i]!)) value += source[i++];
            tokens.push({ type: 'name', value });
            continue;
        }
        if (char === '(' || char === ')' || char === ',' || char === ':') {
            tokens.push({ type: 'punct', value: char });
            i++;
            continue;
        }
        const op = OPERATORS.find((candidate) => source.startsWith(candidate, i));
        if (!op) throw new FormulaSyntaxError(`${char} means nothing here`);
        tokens.push({ type: 'op', value: op });
        i += op.length;
    }
    return tokens;
}

/** Binding power, loosest first: a comparison holds its operands least tightly. */
const BINARY: Record<string, number> = { '=': 1, '<>': 1, '<': 1, '>': 1, '<=': 1, '>=': 1, '&': 2, '+': 3, '-': 3, '*': 4, '/': 4, '^': 5 };

/**
 * The text of a formula, without its `=`, as a tree. Throws where it does not
 * read: the sheet turns that into `#ERROR!` rather than refusing the edit, so
 * nothing a person types is ever lost.
 */
export function parseFormula(source: string): Node {
    const tokens = tokenize(source);
    let index = 0;
    const peek = () => tokens[index];
    const next = () => tokens[index++];

    function expect(value: string) {
        const token = next();
        if (!token || token.value !== value) throw new FormulaSyntaxError(`${value} was expected`);
    }

    function expression(minPower = 0): Node {
        let left = unary();
        for (;;) {
            const token = peek();
            if (!token || token.type !== 'op') break;
            const power = BINARY[token.value];
            if (power === undefined || power < minPower) break;
            next();
            // `^` gathers to the right: 2^3^2 is 2^(3^2).
            const right = expression(token.value === '^' ? power : power + 1);
            left = { kind: 'binary', op: token.value as BinaryOperator, left, right };
        }
        return left;
    }

    function unary(): Node {
        const token = peek();
        if (token?.type === 'op' && (token.value === '-' || token.value === '+')) {
            next();
            return { kind: 'unary', op: token.value, operand: unary() };
        }
        return postfix();
    }

    function postfix(): Node {
        let node = primary();
        for (;;) {
            const token = peek();
            if (token?.type === 'op' && token.value === '%') {
                next();
                node = { kind: 'unary', op: '%', operand: node };
                continue;
            }
            break;
        }
        return node;
    }

    function primary(): Node {
        const token = next();
        if (!token) throw new FormulaSyntaxError('the formula stops early');
        if (token.type === 'number') return { kind: 'number', value: token.value };
        if (token.type === 'text') return { kind: 'text', value: token.value };
        if (token.type === 'error') return { kind: 'error', code: token.value };
        if (token.type === 'punct' && token.value === '(') {
            const inner = expression();
            expect(')');
            return inner;
        }
        if (token.type === 'name') {
            if (peek()?.type === 'punct' && peek()!.value === '(') return call(token.value);
            const upper = token.value.toUpperCase();
            if (upper === 'TRUE' || upper === 'FALSE') return { kind: 'boolean', value: upper === 'TRUE' };
            const ref = parseRef(token.value);
            if (!ref) throw new FormulaSyntaxError(`${token.value} is not a reference`);
            if (peek()?.type === 'punct' && peek()!.value === ':') {
                next();
                const end = next();
                const to = end?.type === 'name' ? parseRef(end.value) : null;
                if (!to) throw new FormulaSyntaxError('a range wants a second reference');
                return { kind: 'range', from: ref, to };
            }
            return { kind: 'ref', ref };
        }
        throw new FormulaSyntaxError(`${token.value} means nothing here`);
    }

    function call(name: string): Node {
        expect('(');
        const args: Node[] = [];
        if (peek()?.type === 'punct' && peek()!.value === ')') {
            next();
            return { kind: 'call', name: name.toUpperCase(), args };
        }
        for (;;) {
            args.push(expression());
            const token = next();
            if (!token) throw new FormulaSyntaxError('a call was never closed');
            if (token.value === ')') break;
            if (token.value !== ',') throw new FormulaSyntaxError(', or ) was expected');
        }
        return { kind: 'call', name: name.toUpperCase(), args };
    }

    const node = expression();
    if (index < tokens.length) throw new FormulaSyntaxError('there is more after the formula ends');
    return node;
}

/**
 * The same formula carried `rows` down and `cols` across: what is pinned with
 * a `$` stays where it is. A fill and a copy both run on this.
 */
export function offsetNode(node: Node, rows: number, cols: number): Node {
    switch (node.kind) {
        case 'ref':
            return { kind: 'ref', ref: offsetRef(node.ref, rows, cols) };
        case 'range':
            return { kind: 'range', from: offsetRef(node.from, rows, cols), to: offsetRef(node.to, rows, cols) };
        case 'unary':
            return { ...node, operand: offsetNode(node.operand, rows, cols) };
        case 'binary':
            return { ...node, left: offsetNode(node.left, rows, cols), right: offsetNode(node.right, rows, cols) };
        case 'call':
            return { ...node, args: node.args.map((arg) => offsetNode(arg, rows, cols)) };
        default:
            return node;
    }
}

/** The tree written out again, as a person would type it. */
export function printNode(node: Node): string {
    switch (node.kind) {
        case 'number':
            return String(node.value);
        case 'text':
            return `"${node.value.replace(/"/g, '""')}"`;
        case 'boolean':
            return node.value ? 'TRUE' : 'FALSE';
        case 'error':
            return node.code;
        case 'ref':
            return node.ref.row < 0 || node.ref.col < 0 ? '#REF!' : formatRef(node.ref);
        case 'range':
            return `${printNode({ kind: 'ref', ref: node.from })}:${printNode({ kind: 'ref', ref: node.to })}`;
        case 'unary':
            return node.op === '%' ? `${printNode(node.operand)}%` : `${node.op}${printNode(node.operand)}`;
        case 'binary':
            return `${printNode(node.left)}${node.op}${printNode(node.right)}`;
        case 'call':
            return `${node.name}(${node.args.map(printNode).join(',')})`;
    }
}

/** `=` and what follows it, or nothing where the text is not a formula. */
export const formulaBody = (input: string): string | null => (typeof input === 'string' && input.startsWith('=') ? input.slice(1) : null);
