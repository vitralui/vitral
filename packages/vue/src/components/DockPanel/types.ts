import type { Component } from 'vue';
import type { BaseProps } from '../../base/types';

export interface DockPanelProps extends BaseProps {
    /**
     * The order the edges dock in. Each edge takes a full
     * strip of the space still free, so the earlier edges win the corners. The
     * default, `['top', 'bottom', 'left', 'right']`, has top and bottom span the
     * full width; put `left`/`right` first for full-height sides. An array or a
     * list such as `'left,right'`; edges left out follow in the default order.
     */
    dockOrder?: string | ('top' | 'bottom' | 'left' | 'right')[];
    /** Space between the docked regions and the fill. Defaults to the `dockpanel.spacing` token. */
    spacing?: number | string;
    as?: string | Component;
}

export interface DockPanelSlots {
    top?: () => unknown;
    bottom?: () => unknown;
    left?: () => unknown;
    right?: () => unknown;
    /** The fill: what the docked edges leave. */
    default?: () => unknown;
}
