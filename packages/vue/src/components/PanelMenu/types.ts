import type { BaseProps } from '../../base/types';
import type { MenuItem } from '../Menu/types';

export interface PanelMenuProps extends BaseProps {
    /** The sections; each section's `items` form its tree, to any depth. */
    model?: MenuItem[];
    /** Let several sections be open at once. */
    multiple?: boolean;
}

export type PanelMenuEmits = {
    'panel-open': [event: { originalEvent: Event; item: MenuItem }];
    'panel-close': [event: { originalEvent: Event; item: MenuItem }];
};

export interface PanelMenuSlots {
    /** A section header's or an item's content. */
    item?: (props: { item: MenuItem; root: boolean; expanded: boolean; hasSubmenu: boolean }) => unknown;
    headericon?: (props: { item: MenuItem; expanded: boolean }) => unknown;
    submenuicon?: (props: { item: MenuItem; expanded: boolean }) => unknown;
}
