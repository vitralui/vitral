/**
 * Where the actions of a speed dial sit around its button: along a circle, a
 * half circle or a quarter circle opening in `direction`. Offsets are in
 * pixels from the button's centre, with y growing downwards as on screen.
 */
export type RadialType = 'circle' | 'semi-circle' | 'quarter-circle';

export type RadialDirection = 'up' | 'down' | 'left' | 'right' | 'up-left' | 'up-right' | 'down-left' | 'down-right';

const round = (n: number) => Math.round(n * 100) / 100 || 0;

export function radialOffset(index: number, count: number, type: RadialType, direction: RadialDirection, radius: number): { x: number; y: number } {
    if (type === 'circle') {
        const step = (2 * Math.PI) / Math.max(1, count);
        return { x: round(radius * Math.cos(step * index)), y: round(radius * Math.sin(step * index)) };
    }
    if (type === 'semi-circle') {
        const step = Math.PI / Math.max(1, count - 1);
        const a = radius * Math.cos(step * index);
        const b = radius * Math.sin(step * index);
        switch (direction) {
            case 'down':
                return { x: round(a), y: round(b) };
            case 'left':
                return { x: round(-b), y: round(a) };
            case 'right':
                return { x: round(b), y: round(a) };
            default:
                return { x: round(a), y: round(-b) };
        }
    }
    const step = Math.PI / (2 * Math.max(1, count - 1));
    const a = radius * Math.cos(step * index);
    const b = radius * Math.sin(step * index);
    switch (direction) {
        case 'up-right':
            return { x: round(b), y: round(-a) };
        case 'down-left':
            return { x: round(-b), y: round(a) };
        case 'down-right':
            return { x: round(a), y: round(b) };
        default:
            return { x: round(-a), y: round(-b) };
    }
}
