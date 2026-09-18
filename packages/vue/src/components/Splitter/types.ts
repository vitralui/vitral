import type { Component } from 'vue';
import type { BaseProps } from '../../base/types';

export interface SplitterProps extends BaseProps {
    /** `horizontal` (the default) puts panels side by side; `vertical` stacks them and needs a height. */
    layout?: 'horizontal' | 'vertical';
    /** Gutter thickness in pixels. Defaults to the `splitter.gutter.size` token. */
    gutterSize?: number;
    /** Percentage points an arrow key moves a gutter. */
    step?: number;
    as?: string | Component;
}

export interface SplitterResizeEvent {
    originalEvent: Event;
    /** Every panel's size, in percent, in order. */
    sizes: number[];
}

export type SplitterEmits = {
    resizestart: [event: SplitterResizeEvent];
    resize: [event: SplitterResizeEvent];
    resizeend: [event: SplitterResizeEvent];
};

export interface SplitterSlots {
    /** `SplitterPanel`s; anything else is left out. */
    default?: () => unknown;
}

export interface SplitterPanelProps extends BaseProps {
    /** Starting size, in percent. Panels without one share what the others leave. */
    size?: number;
    /** The smallest a gutter can make this panel, in percent. */
    minSize?: number;
    as?: string | Component;
}

export interface SplitterPanelSlots {
    default?: () => unknown;
}
