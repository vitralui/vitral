import type { BaseProps, OverlayPlacement } from '../../base/types';
import type { MenuItem } from '../Menu/types';

export interface TieredMenuProps extends BaseProps {
    /** The items; an item's `items` open as a submenu beside it, to any depth. */
    model?: MenuItem[];
    /** A popup menu, opened by `toggle(event)` / `show(event)` and anchored to the event's element. */
    popup?: boolean;
    /** Where a popup renders: `'body'` (the default), `'self'` to stay in place, or a selector. */
    appendTo?: string;
    placement?: OverlayPlacement;
    /** Names the menu. A popup without one is named by the element that opened it. */
    ariaLabel?: string;
    ariaLabelledby?: string;
}

export type TieredMenuEmits = {
    show: [];
    hide: [];
};

export interface NestedMenuItemSlotProps {
    item: MenuItem;
    label: string | undefined;
    focused: boolean;
    disabled: boolean;
    hasSubmenu: boolean;
    open: boolean;
}

export interface TieredMenuSlots {
    start?: () => unknown;
    end?: () => unknown;
    /** An item's content. The menuitem element around it, with its role and keyboard, stays. */
    item?: (props: NestedMenuItemSlotProps) => unknown;
}
