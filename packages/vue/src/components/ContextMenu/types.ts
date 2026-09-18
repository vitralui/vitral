import type { BaseProps } from '../../base/types';
import type { MenuItem } from '../Menu/types';
import type { NestedMenuItemSlotProps } from '../TieredMenu/types';

export interface ContextMenuProps extends BaseProps {
    /** The items; an item's `items` open as a submenu beside it. */
    model?: MenuItem[];
    /** Open on a right-click (or Shift+F10) anywhere in the page. */
    global?: boolean;
    /** Open on a right-click, Shift+F10 or the context-menu key on this element — or the element a selector finds. */
    target?: string | HTMLElement | null;
    /** Where it renders: `'body'` (the default) or a selector. */
    appendTo?: string;
    /** Names the menu. */
    ariaLabel?: string;
}

export type ContextMenuEmits = {
    show: [];
    hide: [];
};

export interface ContextMenuSlots {
    /** An item's content. The menuitem element around it, with its role and keyboard, stays. */
    item?: (props: NestedMenuItemSlotProps) => unknown;
}
