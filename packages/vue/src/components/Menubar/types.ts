import type { BaseProps } from '../../base/types';
import type { MenuItem } from '../Menu/types';
import type { NestedMenuItemSlotProps } from '../TieredMenu/types';

export interface MenubarProps extends BaseProps {
    /** The top-level items; their `items` drop down as menus, which may nest further. */
    model?: MenuItem[];
    /** Below this width the bar becomes a menu button with the items in a column. Defaults to `'960px'`. */
    breakpoint?: string;
    /** Names the menubar. */
    ariaLabel?: string;
    ariaLabelledby?: string;
}

export type MenubarEmits = {
    /** The small-screen menu was opened or closed. */
    'mobile-toggle': [open: boolean];
};

export interface MenubarSlots {
    /** Before the items — a logo. */
    start?: () => unknown;
    /** After the items — a search box, an avatar. */
    end?: () => unknown;
    item?: (props: NestedMenuItemSlotProps) => unknown;
    /** The small-screen menu button's icon. */
    buttonicon?: () => unknown;
}
