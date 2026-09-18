import type { BaseProps, IconProp } from '../../base/types';
import type { MenuItem, MenuItemCommandEvent } from '../Menu/types';

/** A top-level item of a mega menu: its `items` are columns, each a list of groups whose `items` are the links. */
export interface MegaMenuItem {
    label?: string;
    icon?: IconProp;
    command?: (event: MenuItemCommandEvent) => void;
    url?: string;
    target?: string;
    disabled?: boolean;
    visible?: boolean;
    separator?: boolean;
    items?: MenuItem[][];
    class?: string | string[] | Record<string, boolean>;
    key?: string;
}

export interface MegaMenuProps extends BaseProps {
    model?: MegaMenuItem[];
    /** A bar (the default) whose panels drop below it, or a column whose panels open beside it. */
    orientation?: 'horizontal' | 'vertical';
    /** Names the menu. */
    ariaLabel?: string;
    ariaLabelledby?: string;
}

export interface MegaMenuSlots {
    start?: () => unknown;
    end?: () => unknown;
    /** An item's content, top-level or in a panel. */
    item?: (props: { item: MenuItem | MegaMenuItem; root: boolean; focused: boolean; open: boolean }) => unknown;
}
