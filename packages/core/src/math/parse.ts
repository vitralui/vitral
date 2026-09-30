// A formula, read from the LaTeX people already write (`\frac{a}{b}`,
// `\sqrt{x}`, `x^2`), into a tree the renderer lays out. It is a subset: the
// formulas a school, a report or a specification asks for, not TeX. What it
// does not know is kept in the tree as an error and drawn as written, so a
// formula with a slip in it still shows where the slip is.

export type MathSymbolKind =
    /** A letter that stands for something: italic. */
    | 'var'
    | 'num'
    /** A sign between two things (`+`, `×`), spaced on both sides. */
    | 'bin'
    /** A sign that compares (`=`, `≤`, `→`), spaced a little wider. */
    | 'rel'
    | 'punct'
    /** Anything else that sits in the row as it is (`∞`, a unary minus, a plain bracket). */
    | 'ord';

export type MathFence = '(' | ')' | '[' | ']' | '{' | '}' | '|' | '‖' | '⟨' | '⟩' | '';

/** Where a node was read from in the source, `[start, end)`: what a press on the drawing selects for editing. */
export type MathNode = MathNodeShape & { at?: [start: number, end: number] };

export type MathNodeShape =
    | { type: 'row'; items: MathNode[] }
    | { type: 'sym'; text: string; kind: MathSymbolKind }
    /** Words inside a formula, upright: `\text{if } x > 0`. */
    | { type: 'text'; text: string }
    /** A named function, upright: `\sin`, `\log`. */
    | { type: 'fn'; name: string }
    | { type: 'frac'; num: MathNode; den: MathNode }
    | { type: 'sqrt'; body: MathNode; index?: MathNode }
    | { type: 'script'; base: MathNode; sup?: MathNode; sub?: MathNode }
    /** `\sum`, `\prod`, `\int`, `\lim`: a sign that carries limits. */
    | { type: 'op'; op: 'sum' | 'prod' | 'int' | 'lim'; sup?: MathNode; sub?: MathNode }
    /** `\left( … \right)`: brackets as tall as what they hold. */
    | { type: 'fence'; open: MathFence; close: MathFence; body: MathNode }
    | { type: 'over'; body: MathNode }
    | { type: 'matrix'; rows: MathNode[][]; open: MathFence; close: MathFence; align: 'center' | 'left' }
    /** In ems. */
    | { type: 'space'; width: number }
    | { type: 'error'; text: string };

const GREEK: Record<string, string> = {
    alpha: 'α', beta: 'β', gamma: 'γ', delta: 'δ', epsilon: 'ε', varepsilon: 'ε', zeta: 'ζ', eta: 'η', theta: 'θ', iota: 'ι', kappa: 'κ', lambda: 'λ', mu: 'μ', nu: 'ν', xi: 'ξ', pi: 'π', rho: 'ρ', sigma: 'σ', tau: 'τ', upsilon: 'υ', phi: 'φ', varphi: 'φ', chi: 'χ', psi: 'ψ', omega: 'ω',
    Gamma: 'Γ', Delta: 'Δ', Theta: 'Θ', Lambda: 'Λ', Xi: 'Ξ', Pi: 'Π', Sigma: 'Σ', Phi: 'Φ', Psi: 'Ψ', Omega: 'Ω'
};

const SYMBOLS: Record<string, [text: string, kind: MathSymbolKind]> = {
    times: ['×', 'bin'], div: ['÷', 'bin'], cdot: ['·', 'bin'], pm: ['±', 'bin'], mp: ['∓', 'bin'], ast: ['∗', 'bin'], cup: ['∪', 'bin'], cap: ['∩', 'bin'],
    leq: ['≤', 'rel'], le: ['≤', 'rel'], geq: ['≥', 'rel'], ge: ['≥', 'rel'], neq: ['≠', 'rel'], ne: ['≠', 'rel'], approx: ['≈', 'rel'], equiv: ['≡', 'rel'], sim: ['∼', 'rel'], propto: ['∝', 'rel'],
    to: ['→', 'rel'], rightarrow: ['→', 'rel'], leftarrow: ['←', 'rel'], Rightarrow: ['⇒', 'rel'], Leftrightarrow: ['⇔', 'rel'], in: ['∈', 'rel'], notin: ['∉', 'rel'], subset: ['⊂', 'rel'], subseteq: ['⊆', 'rel'],
    infty: ['∞', 'ord'], partial: ['∂', 'ord'], nabla: ['∇', 'ord'], forall: ['∀', 'ord'], exists: ['∃', 'ord'], emptyset: ['∅', 'ord'], degree: ['°', 'ord'], ldots: ['…', 'ord'], cdots: ['⋯', 'ord'], dots: ['…', 'ord'], prime: ['′', 'ord'],
    '{': ['{', 'ord'], '}': ['}', 'ord'], '%': ['%', 'ord'], $: ['$', 'ord'], '&': ['&', 'ord'], _: ['_', 'ord'], '#': ['#', 'ord'], '|': ['‖', 'ord']
};

const FUNCTIONS = new Set(['sin', 'cos', 'tan', 'cot', 'sec', 'csc', 'arcsin', 'arccos', 'arctan', 'sinh', 'cosh', 'tanh', 'log', 'ln', 'exp', 'max', 'min', 'det', 'gcd', 'mod']);
const SPACES: Record<string, number> = { ',': 0.17, ':': 0.22, ';': 0.28, '!': -0.17, ' ': 0.28, quad: 1, qquad: 2 };
const CHARS: Record<string, [text: string, kind: MathSymbolKind]> = {
    '+': ['+', 'bin'], '-': ['−', 'bin'], '*': ['∗', 'bin'], '/': ['/', 'ord'], '=': ['=', 'rel'], '<': ['<', 'rel'], '>': ['>', 'rel'], ',': [',', 'punct'], ';': [';', 'punct'], ':': [':', 'rel'], '!': ['!', 'ord'],
    '(': ['(', 'ord'], ')': [')', 'ord'], '[': ['[', 'ord'], ']': [']', 'ord'], '|': ['|', 'ord'], '.': ['.', 'ord'], "'": ['′', 'ord']
};
const FENCES: Record<string, MathFence> = { '(': '(', ')': ')', '[': '[', ']': ']', '\\{': '{', '\\}': '}', '|': '|', '\\|': '‖', '\\langle': '⟨', '\\rangle': '⟩', '.': '' };
const MATRICES: Record<string, [open: MathFence, close: MathFence, align: 'center' | 'left']> = {
    matrix: ['', '', 'center'], pmatrix: ['(', ')', 'center'], bmatrix: ['[', ']', 'center'], vmatrix: ['|', '|', 'center'], cases: ['{', '', 'left']
};

const row = (items: MathNode[]): MathNode => (items.length === 1 ? items[0]! : { type: 'row', items });

/** Reads a formula. It never throws: what cannot be read is an `error` node where it stood. */
export function parseMath(source: string): MathNode {
    let i = 0;
    const peek = (text: string) => source.startsWith(text, i);
    const skipSpace = () => {
        while (i < source.length && /\s/.test(source[i]!)) i++;
    };
    /** `\name`, or a backslash and one character; the position is left after it. */
    function command(): string {
        i++;
        const letters = /^[a-zA-Z]+/.exec(source.slice(i));
        const name = letters ? letters[0] : (source[i] ?? '');
        i += name.length;
        return name;
    }
    /** The text between a pair of braces, as written. */
    function raw(): string {
        skipSpace();
        if (source[i] !== '{') return '';
        let depth = 0;
        const start = ++i;
        for (; i < source.length; i++) {
            if (source[i] === '{') depth++;
            else if (source[i] === '}' && depth-- === 0) break;
        }
        const text = source.slice(start, i);
        // Past the closing brace, where there is one: a group left open ends with the source.
        if (i < source.length) i++;
        return text;
    }

    function fence(): MathFence | null {
        skipSpace();
        for (const key of Object.keys(FENCES).sort((a, b) => b.length - a.length)) {
            if (peek(key)) {
                i += key.length;
                return FENCES[key]!;
            }
        }
        return null;
    }

    function parseRow(stop: () => boolean): MathNode {
        const items: MathNode[] = [];
        for (;;) {
            skipSpace();
            if (i >= source.length || stop()) break;
            const start = i;
            let node = parseAtom();
            if (!node) break;
            // A minus with nothing before it to subtract from is a sign, and is not spaced like one between two things.
            const before = items[items.length - 1];
            if (node.type === 'sym' && node.kind === 'bin' && (!before || (before.type === 'sym' && (before.kind === 'bin' || before.kind === 'rel' || before.kind === 'punct' || before.text === '(' || before.text === '[')))) {
                node = { ...node, kind: 'ord' };
            }
            const whole = scripts(node);
            // With its scripts, a node is a wider piece of the source than it was alone.
            if (whole !== node) whole.at = [start, i];
            items.push(whole);
        }
        return row(items);
    }

    /** What follows `^` or `_`, a fraction's part, a root's: a group, a command, or one character. */
    function parseArg(): MathNode {
        skipSpace();
        if (i >= source.length) return { type: 'error', text: '' };
        if (/[0-9]/.test(source[i]!)) return { type: 'sym', text: source[i++]!, kind: 'num', at: [i - 1, i] };
        return parseAtom() ?? { type: 'error', text: '' };
    }

    function scripts(base: MathNode): MathNode {
        let sup: MathNode | undefined;
        let sub: MathNode | undefined;
        for (;;) {
            skipSpace();
            if (source[i] === '^' && !sup) (i++, (sup = parseArg()));
            else if (source[i] === '_' && !sub) (i++, (sub = parseArg()));
            else break;
        }
        if (!sup && !sub) return base;
        if (base.type === 'op') return { ...base, sup, sub };
        return { type: 'script', base, sup, sub };
    }

    function parseAtom(): MathNode | null {
        const start = i;
        const node = atom();
        if (node) node.at = [start, i];
        return node;
    }

    function atom(): MathNode | null {
        const c = source[i]!;
        if (c === '{') {
            i++;
            const group = parseRow(() => source[i] === '}');
            if (source[i] === '}') i++;
            return group.type === 'row' ? group : { type: 'row', items: [group] };
        }
        if (c === '}') {
            i++;
            return { type: 'error', text: '}' };
        }
        if (c === '\\') return parseCommand();
        if (/[0-9]/.test(c)) {
            const number = /^[0-9]+(?:[.,][0-9]+)*/.exec(source.slice(i))![0];
            i += number.length;
            return { type: 'sym', text: number, kind: 'num' };
        }
        i++;
        if (/\p{L}/u.test(c)) return { type: 'sym', text: c, kind: 'var' };
        const known = CHARS[c];
        return known ? { type: 'sym', text: known[0], kind: known[1] } : { type: 'sym', text: c, kind: 'ord' };
    }

    function parseCommand(): MathNode {
        const start = i;
        const name = command();
        if (name === 'frac' || name === 'dfrac' || name === 'tfrac') return { type: 'frac', num: parseArg(), den: parseArg() };
        if (name === 'sqrt') {
            skipSpace();
            let index: MathNode | undefined;
            if (source[i] === '[') {
                i++;
                index = parseRow(() => source[i] === ']');
                if (source[i] === ']') i++;
            }
            return { type: 'sqrt', body: parseArg(), index };
        }
        if (name === 'left') {
            const open = fence() ?? '';
            const body = parseRow(() => peek('\\right'));
            if (peek('\\right')) i += 6;
            return { type: 'fence', open, close: fence() ?? '', body };
        }
        if (name === 'begin') {
            const env = raw();
            const shape = MATRICES[env];
            if (!shape) return { type: 'error', text: source.slice(start, i) };
            const rows: MathNode[][] = [[]];
            for (;;) {
                rows[rows.length - 1]!.push(parseRow(() => source[i] === '&' || peek('\\\\') || peek('\\end')));
                if (source[i] === '&') i++;
                else if (peek('\\\\')) (i += 2, rows.push([]));
                else break;
            }
            if (peek('\\end')) (i += 4, raw());
            // A `\\` after the last row opens one with nothing in it.
            const last = rows[rows.length - 1]!;
            if (rows.length > 1 && last.length === 1 && last[0]!.type === 'row' && last[0]!.items.length === 0) rows.pop();
            return { type: 'matrix', rows, open: shape[0], close: shape[1], align: shape[2] };
        }
        if (name === 'text' || name === 'mathrm' || name === 'operatorname') return { type: 'text', text: raw() };
        if (name === 'overline' || name === 'bar') return { type: 'over', body: parseArg() };
        if (name === 'sum' || name === 'prod' || name === 'int' || name === 'lim') return { type: 'op', op: name };
        if (FUNCTIONS.has(name)) return { type: 'fn', name };
        if (name in SPACES) return { type: 'space', width: SPACES[name]! };
        if (name in GREEK) return { type: 'sym', text: GREEK[name]!, kind: /^[A-Z]/.test(name) ? 'ord' : 'var' };
        const symbol = SYMBOLS[name];
        if (symbol) return { type: 'sym', text: symbol[0], kind: symbol[1] };
        return { type: 'error', text: source.slice(start, i) };
    }

    const items: MathNode[] = [];
    while (i < source.length) {
        const before = i;
        const part = parseRow(() => false);
        items.push(...(part.type === 'row' ? part.items : [part]));
        if (i === before) i++;
    }
    return { type: 'row', items };
}
