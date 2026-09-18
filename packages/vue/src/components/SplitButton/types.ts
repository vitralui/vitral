import type { BaseProps, IconProp, OverlayPlacement, Severity, Size } from '../../base/types';
import type { MenuItem } from '../Menu/types';

export interface SplitButtonProps extends BaseProps {
    /** The main command's text. */
    label?: string;
    icon?: IconProp;
    /** The commands in the menu, as for `<Menu>`. */
    model?: MenuItem[];
    /** The menu button's icon. Defaults to a chevron. */
    dropdownIcon?: IconProp;
    severity?: Severity;
    variant?: 'filled' | 'outlined' | 'text';
    size?: Size;
    rounded?: boolean;
    raised?: boolean;
    fluid?: boolean;
    disabled?: boolean;
    /** Shows a spinner on the main button and disables it. */
    loading?: boolean;
    /** Names the menu button. Defaults to the locale's "More options". */
    menuButtonLabel?: string;
    placement?: OverlayPlacement;
    /** Where the menu renders: `'body'` (the default), `'self'`, or a selector. */
    appendTo?: string;
}

export type SplitButtonEmits = {
    /** The main button was pressed. */
    click: [event: MouseEvent];
    show: [];
    hide: [];
};

export interface SplitButtonSlots {
    /** The main button's content. */
    default?: () => unknown;
    icon?: () => unknown;
    dropdownicon?: () => unknown;
    /** An item of the menu, as `<Menu>`'s `item` slot. */
    item?: (props: { item: MenuItem; label: string | undefined; focused: boolean; disabled: boolean }) => unknown;
}
