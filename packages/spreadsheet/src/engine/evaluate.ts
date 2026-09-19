import { compare, toNumber, toText } from './coerce';
import { functions, type FunctionContext, type Thunk } from './functions';
import type { Node } from './parse';
import { errorValue, isError, isRangeValue, type Argument, type CellAddress, type CellRange, type RangeValue, type Scalar } from './types';

/**
 * A formula tree worked out against a sheet. Nothing here knows where a value
 * comes from: the context answers for one cell and for a rectangle, which is
 * what lets the same evaluator run over a real sheet, over a spec's fixture
 * and over a cell that is being worked out for the first time.
 */

export interface EvalContext extends FunctionContext {
    cell(address: CellAddress): Scalar;
    range(range: CellRange): RangeValue;
}

/** A rectangle where one value is wanted is its first cell; everything else is itself. */
const single = (value: Argument): Scalar => (isRangeValue(value) ? (value.values[0] ?? null) : value);

export function evaluate(node: Node, ctx: EvalContext): Argument {
    switch (node.kind) {
        case 'number':
            return node.value;
        case 'text':
            return node.value;
        case 'boolean':
            return node.value;
        case 'error':
            return errorValue(node.code);
        case 'ref':
            return ctx.cell(node.ref);
        case 'range':
            return ctx.range({ from: node.from, to: node.to });
        case 'unary': {
            const operand = single(evaluate(node.operand, ctx));
            if (isError(operand)) return operand;
            if (node.op === '%') {
                const value = toNumber(operand);
                return isError(value) ? value : value / 100;
            }
            const value = toNumber(operand);
            if (isError(value)) return value;
            return node.op === '-' ? -value : value;
        }
        case 'binary':
            return binary(node.op, single(evaluate(node.left, ctx)), single(evaluate(node.right, ctx)));
        case 'call': {
            const fn = functions[node.name];
            if (!fn) return errorValue('#NAME?');
            // Arguments go in unevaluated: `IF` and `IFERROR` must be able to
            // leave one alone.
            const thunks: Thunk[] = node.args.map((arg) => {
                let done = false;
                let value: Argument = null;
                return () => {
                    if (!done) {
                        value = evaluate(arg, ctx);
                        done = true;
                    }
                    return value;
                };
            });
            return fn(thunks, ctx);
        }
    }
}

function binary(op: string, left: Scalar, right: Scalar): Scalar {
    if (op === '&') {
        const a = toText(left);
        if (isError(a)) return a;
        const b = toText(right);
        return isError(b) ? b : a + b;
    }
    if (op === '=' || op === '<>' || op === '<' || op === '>' || op === '<=' || op === '>=') {
        const order = compare(left, right);
        if (isError(order)) return order;
        switch (op) {
            case '=':
                return order === 0;
            case '<>':
                return order !== 0;
            case '<':
                return order < 0;
            case '>':
                return order > 0;
            case '<=':
                return order <= 0;
            default:
                return order >= 0;
        }
    }
    const a = toNumber(left);
    if (isError(a)) return a;
    const b = toNumber(right);
    if (isError(b)) return b;
    switch (op) {
        case '+':
            return a + b;
        case '-':
            return a - b;
        case '*':
            return a * b;
        case '/':
            return b === 0 ? errorValue('#DIV/0!') : a / b;
        case '^': {
            const value = a ** b;
            return Number.isFinite(value) ? value : errorValue('#VALUE!');
        }
        default:
            return errorValue('#ERROR!');
    }
}
