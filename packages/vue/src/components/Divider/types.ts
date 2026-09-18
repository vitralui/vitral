import type { BaseProps } from '../../base/types';

export interface DividerProps extends BaseProps {
    layout?: 'horizontal' | 'vertical';
    type?: 'solid' | 'dashed' | 'dotted';
    /**
     * Where the content sits along the line: `left`, `center` or `right` on a
     * horizontal divider (`left` by default), `top`, `center` or `bottom` on a
     * vertical one (`center` by default).
     */
    align?: 'left' | 'center' | 'right' | 'top' | 'bottom';
}

export interface DividerSlots {
    /** Text or an icon set into the line. */
    default?: () => unknown;
}
