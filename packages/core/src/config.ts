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

/**
 * The configuration every adapter shares. Framework packages extend it with
 * what only they need (the theme preset, pass-through typing) but these fields
 * mean the same thing everywhere.
 */
export interface BaseConfig {
    /** Drop every built-in class and stylesheet; style through pass-through instead. */
    unstyled: boolean;
    locale: Locale;
    zIndex: ZIndexConfig;
    inputVariant: InputVariant;
    csp: { nonce?: string };
}

export const defaultBaseConfig: BaseConfig = {
    unstyled: false,
    locale: en,
    zIndex: defaultZIndex,
    inputVariant: 'outlined',
    csp: {}
};
