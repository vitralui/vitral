import type { BaseProps } from '../../base/types';

export interface ToolbarProps extends BaseProps {
    /**
     * The APG toolbar keyboard: one tab stop for the whole bar, Left/Right (and
     * Home/End) moving between its controls. Off by default, because a toolbar
     * holding a text field needs those keys inside the field.
     */
    roving?: boolean;
}

export interface ToolbarSlots {
    start?: () => unknown;
    center?: () => unknown;
    end?: () => unknown;
}
