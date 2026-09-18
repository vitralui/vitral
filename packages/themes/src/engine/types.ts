export type TokenValue = string | number;

export interface TokenTree {
    [key: string]: TokenValue | TokenTree | undefined;
}

/**
 * A theme, in three layers:
 *
 * - `primitive`: raw values with no meaning — palettes, radii.
 * - `semantic`: what the values are for — `primary.color`, `formField.borderColor`.
 *   A `colorScheme: { light, dark }` branch holds whatever differs between the two.
 * - `components`: per-component tokens, keyed by component name, which refer to
 *   the semantic layer. They may carry their own `colorScheme` branch.
 *
 * A string token may reference another as `{group.name}`; the reference becomes
 * a `var()` in the generated CSS, so changing a primitive re-colours everything
 * built on it without recompiling anything downstream.
 */
export interface Preset {
    primitive?: TokenTree;
    semantic?: TokenTree;
    components?: Record<string, TokenTree>;
}

export interface ThemeOptions {
    /** Prefix of every generated custom property: `--vt-primary-color`. */
    prefix?: string;
    /**
     * Where the dark scheme applies. A class or attribute selector (the default
     * is `.vt-dark`) is matched on the `<html>` element; `'system'` follows the
     * operating system through a media query; `false` emits no dark scheme.
     */
    darkModeSelector?: string | false;
    /** Wrap the generated CSS in `@layer <name>` so application styles win without `!important`. */
    cssLayer?: string | false;
}

export const defaultThemeOptions: Required<ThemeOptions> = {
    prefix: 'vt',
    darkModeSelector: '.vt-dark',
    cssLayer: false
};
