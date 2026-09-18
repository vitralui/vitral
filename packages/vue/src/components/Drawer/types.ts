import type { BaseProps } from '../../base/types';

export type DrawerPosition = 'left' | 'right' | 'top' | 'bottom' | 'full';

export interface DrawerProps extends BaseProps {
    /** The title; it names the drawer. Without one, name it with `aria-label` or `aria-labelledby`. */
    header?: string;
    /** The edge it slides in from, or `'full'` to cover the viewport. Defaults to `'left'`. */
    position?: DrawerPosition;
    /** Dim and block the page, trap focus and lock scrolling. Defaults to true. */
    modal?: boolean;
    /** Close on a press on the mask. Defaults to true. */
    dismissable?: boolean;
    /** Defaults to true. */
    closeOnEscape?: boolean;
    /** Show the close button. Defaults to true. */
    showCloseIcon?: boolean;
    /** Lock the page's scroll even when the drawer is not modal. */
    blockScroll?: boolean;
    /** `'body'` (the default), `'self'` to render in place, or a selector. */
    appendTo?: string;
}

export type DrawerEmits = {
    show: [];
    hide: [];
    /** After the closing animation, once the drawer has left the page. */
    'after-hide': [];
};

export interface DrawerSlots {
    default?: () => unknown;
    /** Replaces the title text; it still names the drawer. */
    header?: () => unknown;
    footer?: () => unknown;
    closeicon?: () => unknown;
}
