import type { Component } from 'vue';
import type { BaseProps } from '../../base/types';

export interface WrapPanelProps extends BaseProps {
    /** `horizontal` (the default) fills rows and wraps downwards; `vertical` fills columns and needs a height to wrap in. */
    orientation?: 'vertical' | 'horizontal';
    /** Every child gets this width. A number of pixels or any CSS length. */
    itemWidth?: number | string;
    /** Every child gets this height. */
    itemHeight?: number | string;
    /** Space between children and between lines. Defaults to the `wrappanel.spacing` token. */
    spacing?: number | string;
    as?: string | Component;
}

export interface WrapPanelSlots {
    default?: () => unknown;
}
