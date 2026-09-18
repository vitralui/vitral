import type { BaseProps } from '../../base/types';

export type DialogPosition = 'center' | 'top' | 'bottom' | 'left' | 'right' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

export interface DialogProps extends BaseProps {
    /** The title; it names the dialog. Without one, name it with `aria-label` or `aria-labelledby`. */
    header?: string;
    /** Dim and block the page, trap focus and lock scrolling. Defaults to true. */
    modal?: boolean;
    /** Show the close button. Defaults to true. */
    closable?: boolean;
    /** Close on a press on the mask. */
    dismissableMask?: boolean;
    /** Defaults to true. */
    closeOnEscape?: boolean;
    position?: DialogPosition;
    /** Add a button that fills the viewport with the dialog. */
    maximizable?: boolean;
    /** Lock the page's scroll even when the dialog is not modal. */
    blockScroll?: boolean;
    /** Defaults to true. */
    showHeader?: boolean;
    /** `'body'` (the default), `'self'` to render in place, or a selector. */
    appendTo?: string;
}

export type DialogEmits = {
    show: [];
    hide: [];
    /** After the closing animation, once the dialog has left the page. */
    'after-hide': [];
    maximize: [];
    unmaximize: [];
};

export interface DialogSlots {
    default?: () => unknown;
    /** Replaces the title text; it still names the dialog. */
    header?: () => unknown;
    footer?: () => unknown;
    closeicon?: () => unknown;
    maximizeicon?: (props: { maximized: boolean }) => unknown;
}
