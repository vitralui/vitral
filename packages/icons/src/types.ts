/**
 * An icon as data: the inner markup of a 24×24 SVG drawn as an outline, with a
 * 2-unit round stroke in `currentColor`, no fill, about 2 units of margin. No
 * framework is involved: the Vue `<Icon>` renders it, `renderSvg` turns it into
 * a string for anything else.
 */
export interface IconDef {
    /** camelCase, and the name the icon is exported under. */
    name: string;
    /** The markup that goes inside `<svg>`. */
    body: string;
    /** Only for an icon not drawn on the 24×24 grid. */
    viewBox?: string;
    /** One of `iconCategories` for the built-in set; free for your own. */
    category?: string;
    /** English search keywords, beside the name. */
    tags?: readonly string[];
}

/** The grid every built-in icon is drawn on. */
export const ICON_VIEWBOX = '0 0 24 24';

/** The stroke width the icons are drawn for, in grid units. Themes change it through `--vt-icon-stroke-width`. */
export const ICON_STROKE_WIDTH = 2;
