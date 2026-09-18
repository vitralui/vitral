import type { BaseProps } from '../../base/types';

export interface InputGroupAddonProps extends BaseProps {
    /** The element to render — `'label'` for a unit that names its field, `'div'` by default. */
    as?: string;
}

export interface InputGroupAddonSlots {
    default?: () => unknown;
}
