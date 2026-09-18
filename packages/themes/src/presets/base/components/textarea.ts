// The field chrome (border, background, focus) comes from the semantic
// `formField` tokens, as every text-like control's does; these are only what
// is particular to a multi-line box.
export default {
    root: {
        /** The native resize handle: `vertical`, `both` or `none`. An auto-resizing box never shows one. */
        resize: 'vertical'
    }
};
