/** Attributes, classes, styles and listeners handed to one part of a component. */
export type PassThroughAttrs = Record<string, unknown>;

export interface PassThroughContext {
    props: Record<string, unknown>;
    /** Whatever state the component passed for this part, such as `{ selected, focused }` for an option. */
    state: unknown;
    part: string;
}

/**
 * What pass-through accepts for one part: attributes, a function of the part's
 * context returning attributes, or a bare string, which is taken as a class, so
 * `{ root: 'rounded-full shadow' }` is all a utility-CSS user needs to write.
 */
export type PassThroughValue = PassThroughAttrs | string | ((context: PassThroughContext) => PassThroughAttrs | string | undefined);

export type PassThrough = Record<string, PassThroughValue | undefined>;

/** Global pass-through, keyed by component name (the style's `name`: `button`, `select`…). */
export type GlobalPassThrough = Record<string, PassThrough | undefined>;

/**
 * Design tokens for one instance, as a tree: `{ primary: { color: 'tomato' } }`
 * becomes `--vt-primary-color: tomato` on the component's root.
 */
export interface DesignTokens {
    [key: string]: string | number | DesignTokens | undefined;
}

/** Props every styled component accepts. */
export interface BaseProps {
    /** Drop the built-in classes for this instance; overrides the global setting. */
    unstyled?: boolean;
    pt?: PassThrough;
    dt?: DesignTokens;
}

export type Size = 'small' | 'large';

export type InputVariant = 'outlined' | 'filled';

// Prop types stay local rather than imported from sibling packages: the SFC
// compiler reads prop types to generate runtime prop definitions, and it
// resolves relative files reliably where it may not resolve a package alias.

/**
 * A Vue component that draws an icon: `lucide-vue-next`'s, `@iconify/vue`'s
 * `Icon` bound to a name, `unplugin-icons`', or a wrapper around any other
 * library (`() => h(FontAwesomeIcon, { icon: faUser })`).
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
export type IconComponentLike =
    | { render?: (...args: any[]) => unknown; setup?: (...args: any[]) => unknown }
    | ((...args: any[]) => unknown)
    // `defineComponent()` types a component as a constructor.
    | (abstract new (...args: any[]) => unknown);
/* eslint-enable @typescript-eslint/no-explicit-any */

/**
 * What any `icon` prop takes:
 * - a registered icon name (`'search'`);
 * - an icon definition imported from `@vitral/icons` (`graduationCap`);
 * - a Vue component from another icon library ({@link IconComponentLike});
 * - SVG markup (`'<svg …>…</svg>'`), which is inserted as HTML, so it must be trusted;
 * - any other string, taken as classes for an icon font (`'fa-solid fa-user'`, `'pi pi-check'`).
 */
export type IconProp = string | { name: string; body: string; viewBox?: string } | IconComponentLike;

export type Severity = 'primary' | 'secondary' | 'success' | 'info' | 'warn' | 'danger' | 'help' | 'contrast';

export type OverlayPlacement =
    | 'top'
    | 'top-start'
    | 'top-end'
    | 'bottom'
    | 'bottom-start'
    | 'bottom-end'
    | 'left'
    | 'left-start'
    | 'left-end'
    | 'right'
    | 'right-start'
    | 'right-end';
