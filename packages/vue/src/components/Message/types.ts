import type { BaseProps, IconProp, Severity } from '../../base/types';

export type MessageVariant = 'subtle' | 'outlined' | 'simple';

export interface MessageProps extends BaseProps {
    /** Defaults to `'info'`. `danger` and `warn` are announced at once, as alerts; the rest politely. */
    severity?: Severity;
    /** The InfoBar's title, in bold before the message. */
    title?: string;
    /** Replaces the severity's icon. */
    icon?: IconProp;
    /** Hide the icon. */
    hideIcon?: boolean;
    /** Show a close button; closing hides the message and emits `close`. */
    closable?: boolean;
    /** `'subtle'` (a tinted band, the default), `'outlined'` or `'simple'` (coloured text only). */
    variant?: MessageVariant;
    /** Milliseconds before it hides by itself; the count pauses while it is hovered or focused. */
    life?: number;
}

export type MessageEmits = {
    close: [event: Event];
    'life-end': [];
};

export interface MessageSlots {
    default?: () => unknown;
    /** The InfoBar's action area: a button or a link beside the message. */
    action?: () => unknown;
    icon?: () => unknown;
    closeicon?: () => unknown;
}
