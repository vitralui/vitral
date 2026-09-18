import { en, type Locale } from './locale/locale';

/** Base stacking order per kind of layer. See {@link ZIndex} for how layers opened later go on top. */
export interface ZIndexConfig {
    modal: number;
    overlay: number;
    menu: number;
    tooltip: number;
    toast: number;
}

export const defaultZIndex: ZIndexConfig = { modal: 1100, overlay: 1000, menu: 1000, tooltip: 1100, toast: 1200 };

/** Outlined fields draw a border on the surface; filled ones sit on a tinted background. */
export type InputVariant = 'outlined' | 'filled';

/** The reading direction: left to right, or right to left (Arabic, Hebrew, Persian, Urdu). */
export type Direction = 'ltr' | 'rtl';

/**
 * The configuration every adapter shares. Framework packages extend it with
 * what only they need (the theme preset, pass-through typing) but these fields
 * mean the same thing everywhere.
 */
export interface BaseConfig {
    /** Drop every built-in class and stylesheet; style through pass-through instead. */
    unstyled: boolean;
    locale: Locale;
    /**
     * The reading direction the library assumes where it cannot read one off
     * the page: an overlay teleported out of its application, and the server,
     * which has no layout to measure. In the page itself the `dir` attribute
     * wins, since that is what the browser lays out and what a component's own
     * keyboard handling measures.
     */
    direction: Direction;
    zIndex: ZIndexConfig;
    inputVariant: InputVariant;
    csp: { nonce?: string };
}

export const defaultBaseConfig: BaseConfig = {
    unstyled: false,
    locale: en,
    direction: 'ltr',
    zIndex: defaultZIndex,
    inputVariant: 'outlined',
    csp: {}
};
