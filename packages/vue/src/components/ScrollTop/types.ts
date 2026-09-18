import type { BaseProps, IconProp, Severity } from '../../base/types';

export interface ScrollTopProps extends BaseProps {
    /** What it scrolls: the page (the default) or the element it is placed in. */
    target?: 'window' | 'parent';
    /** How far down, in pixels, before it appears. Defaults to 400. */
    threshold?: number;
    /** Defaults to an up arrow. */
    icon?: IconProp;
    /** `'smooth'` (the default) or `'auto'`. Reduced motion always jumps. */
    behavior?: 'smooth' | 'auto';
    severity?: Severity;
}

export type ScrollTopEmits = {
    click: [event: MouseEvent];
};
