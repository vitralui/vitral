import type { BaseProps, OverlayPlacement } from '../../base/types';

export interface ColorPickerProps extends BaseProps {
    /** Show the panel in place, without a swatch to open it. */
    inline?: boolean;
    /** What v-model holds: `'ff0000'` (the default), `{ r, g, b }` or `{ h, s, b }`. */
    format?: 'hex' | 'rgb' | 'hsb';
    /** The colour the panel starts on while the value is empty. Defaults to `'ff0000'`. */
    defaultColor?: string;
    /** Show a text box for the hex value under the area. Defaults to true. */
    showInput?: boolean;
    disabled?: boolean;
    placement?: OverlayPlacement;
    /** `'body'` (the default), `'self'` to render in place, or a selector. */
    appendTo?: string;
}

export type ColorPickerValue = string | { r: number; g: number; b: number } | { h: number; s: number; b: number };

export type ColorPickerEmits = {
    /** The colour was changed by the reader: a key, the end of a drag, or a typed hex value. */
    change: [event: { originalEvent: Event; value: ColorPickerValue }];
    show: [];
    hide: [];
};
