import type { IconProp } from '../../base/types';

export interface IconProps {
    /**
     * A registered icon name, an icon definition from `@vitral/icons`, a Vue
     * component from another icon library, trusted SVG markup, or any other
     * string — taken as classes, for icon fonts.
     */
    icon: IconProp;
    /** Width and height; a number is pixels. Defaults to the `icon.size` token (`--vt-icon-size`). */
    size?: string | number;
    /** The stroke, in units of the 24×24 grid. Defaults to the `icon.strokeWidth` token (`--vt-icon-stroke-width`). */
    strokeWidth?: string | number;
    /** Gives the icon a name of its own. Without one it is decorative and hidden from assistive technology. */
    label?: string;
    spin?: boolean;
}
