export type TokenValue = string | number;

export interface TokenTree {
    [key: string]: TokenValue | TokenTree | undefined;
}

/**
 * A theme, in three layers:
 *
 * - `primitive`: raw values with no meaning, such as palettes and radii.
 * - `semantic`: what the values are for, such as `primary.color` or `formField.borderColor`.
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
    /**
     * Tokens that apply only when the stronger borders are asked for. Same
     * shape as `semantic`, `colorScheme` branch and all, compiled into a block
     * of its own behind `borderSelector`.
     *
     * The default edges are quiet: they suggest where a field ends without
     * drawing a line around everything. That is a look, and for most readers it
     * is enough. It is not enough for WCAG 1.4.11, which wants the boundary of
     * a control to reach 3:1 against what is beside it, so a preset carries a
     * second set of edges here and an application turns them on — with
     * `borders: 'strong'` — when it has to meet that bar.
     */
    strongBorders?: TokenTree;
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
    /**
     * Where a preset's `strongBorders` apply. An attribute or class selector
     * matched on `<html>`, the same way `darkModeSelector` is; `false` leaves
     * them out of the stylesheet entirely.
     */
    borderSelector?: string | false;
}

export const defaultThemeOptions: Required<ThemeOptions> = {
    prefix: 'vt',
    darkModeSelector: '.vt-dark',
    cssLayer: false,
    borderSelector: '[data-vt-borders="strong"]'
};

/** Which set of edges a theme is drawing: the quiet default, or the ones that meet 1.4.11. */
export type BorderStrength = 'soft' | 'strong';
