import type { BaseProps, IconProp, Size } from '../../base/types';

export interface EmptyStateProps extends BaseProps {
    title?: string;
    description?: string;
    /** Defaults to the severity's icon, or an empty tray. `false` draws none. */
    icon?: IconProp | false;
    /**
     * Turns the absence into a result: `success` after something worked,
     * `danger` when it did not. The icon takes the severity's colour.
     */
    severity?: 'success' | 'info' | 'warn' | 'danger';
    size?: Size;
    /** Defaults to `'center'`. */
    align?: 'center' | 'start';
    /** Make the title a heading of this level, so it takes its place in the page's outline. */
    headingLevel?: 1 | 2 | 3 | 4 | 5 | 6;
}

export interface EmptyStateSlots {
    /** Replaces the description. */
    default?: () => unknown;
    icon?: () => unknown;
    title?: () => unknown;
    /** Buttons below the text: what to do about it. */
    actions?: () => unknown;
}
