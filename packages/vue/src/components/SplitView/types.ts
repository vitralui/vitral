import type { Component } from 'vue';
import type { BaseProps } from '../../base/types';

export interface SplitViewProps extends BaseProps {
    /**
     * - `inline`: the open pane pushes the content aside; closed, it is gone.
     * - `overlay` (the default): the open pane floats over the content and closes on a press outside or Escape.
     * - `compactInline`: like `inline`, but closed it keeps a strip `compactPaneLength` wide, room for icons.
     * - `compactOverlay`: the strip stays beside the content, and the open pane floats over it.
     */
    displayMode?: 'inline' | 'overlay' | 'compactInline' | 'compactOverlay';
    /** The side the pane is on. `left` is the start side: it follows the writing direction. */
    placement?: 'left' | 'right';
    /** Width of the open pane: pixels, or any CSS length. */
    openPaneLength?: number | string;
    /** Width of the closed pane in the compact modes. */
    compactPaneLength?: number | string;
    /** The pane's accessible name: it is an `<aside>`, a complementary landmark. */
    paneLabel?: string;
    /** The pane's id, for a toggle's `aria-controls`. Generated when left out; the slots receive it either way. */
    paneId?: string;
    as?: string | Component;
}

export interface SplitViewSlotProps {
    open: boolean;
    /** The pane is closed to its compact strip: show icons, hide labels. */
    compact: boolean;
    /** Put it in a toggle's `aria-controls`: a press on that toggle then does not count as a press outside the pane. */
    paneId: string;
    toggle: () => void;
    close: () => void;
}

export interface SplitViewSlots {
    pane?: (props: SplitViewSlotProps) => unknown;
    default?: (props: SplitViewSlotProps) => unknown;
}
