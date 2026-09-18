import type { Component } from 'vue';
import type { BaseProps } from '../../base/types';

export interface StackPanelProps extends BaseProps {
    /** Children one below the other (the default) or side by side. */
    orientation?: 'vertical' | 'horizontal';
    /** Space between children: a number of pixels or any CSS length. Defaults to the `stackpanel.spacing` token. */
    spacing?: number | string;
    /** Cross-axis alignment (`align-items`): `start`, `center`, `end`, `baseline`, or `stretch`, the default. */
    align?: string;
    /** Main-axis distribution (`justify-content`): `start`, `center`, `end`, `space-between`… */
    justify?: string;
    /** Let children flow onto another line when they run out of room. */
    wrap?: boolean;
    /** The element or component to render — `'ul'` for a list, `'nav'`, `'form'`. */
    as?: string | Component;
}

export interface StackPanelSlots {
    default?: () => unknown;
}
