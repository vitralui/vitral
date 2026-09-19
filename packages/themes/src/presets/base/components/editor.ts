// The rich-text editor: the `formField` chrome around a toolbar, the text and a
// footer, and the typography of the content, so a theme restyles what people
// write as well as the frame around it. The palette is what the colour and
// highlight pickers offer; content refers to it by name, so a colour follows
// the scheme.

const tint = (name: string) => ({ color: `{${name}.600}`, highlight: `{${name}.200}` });
const darkTint = (name: string) => ({ color: `{${name}.400}`, highlight: `color-mix(in srgb, {${name}.500} 38%, transparent)` });
const hues = ['red', 'orange', 'yellow', 'green', 'teal', 'blue', 'purple', 'pink'];

export default {
    root: {
        transitionDuration: '{formField.transitionDuration}'
    },
    toolbar: {
        padding: '0.375rem',
        gap: '0.125rem',
        groupGap: '0.375rem',
        borderColor: '{formField.borderColor}',
        separatorColor: '{content.borderColor}',
        colorScheme: {
            light: { background: '{surface.50}' },
            dark: { background: '{surface.900}' }
        }
    },
    button: {
        size: '2rem',
        padding: '0 0.375rem',
        borderRadius: '{borderRadius.sm}',
        color: '{text.mutedColor}',
        hoverColor: '{text.color}',
        hoverBackground: '{content.hoverBackground}',
        activeColor: '{highlight.color}',
        activeBackground: '{highlight.background}',
        disabledOpacity: '{disabledOpacity}'
    },
    // The handle beside a block sits in a gutter down the leading edge: the
    // gutter is as wide as the handle plus the padding the text would have had.
    blockHandle: {
        size: '1.5rem',
        inset: '0.25rem',
        gutter: '2rem'
    },
    content: {
        minHeight: '9rem',
        maxHeight: '32rem',
        padding: '0.75rem 1rem',
        lineHeight: '1.6',
        blockGap: '0.75em',
        placeholderColor: '{formField.placeholderColor}',
        selectedOutline: '{primary.color}'
    },
    heading: {
        fontWeight: '650',
        lineHeight: '1.25',
        h1FontSize: '1.75em',
        h2FontSize: '1.375em',
        h3FontSize: '1.125em',
        marginTop: '1.25em'
    },
    link: {
        color: '{primary.color}',
        hoverColor: '{primary.hoverColor}'
    },
    list: {
        indent: '1.5em',
        itemGap: '0.25em',
        checkboxColor: '{primary.color}'
    },
    blockquote: {
        borderWidth: '3px',
        borderColor: '{content.borderColor}',
        color: '{text.mutedColor}',
        padding: '0 0 0 1em'
    },
    code: {
        fontFamily: '{fontFamilyMono}',
        fontSize: '0.875em',
        padding: '0.125em 0.375em',
        borderRadius: '{borderRadius.sm}',
        colorScheme: {
            light: { background: '{surface.100}', color: '{pink.700}' },
            dark: { background: '{surface.800}', color: '{pink.300}' }
        }
    },
    codeBlock: {
        padding: '0.75em 1em',
        borderRadius: '{borderRadius.md}',
        colorScheme: {
            light: { background: '{surface.900}', color: '{surface.50}', labelColor: '{surface.400}' },
            dark: { background: '{surface.950}', color: '{surface.100}', labelColor: '{surface.500}' }
        }
    },
    rule: {
        color: '{content.borderColor}',
        width: '1px'
    },
    image: {
        borderRadius: '{borderRadius.md}'
    },
    table: {
        borderColor: '{content.borderColor}',
        cellPadding: '0.375em 0.625em',
        headerFontWeight: '600',
        colorScheme: {
            light: { headerBackground: '{surface.50}' },
            dark: { headerBackground: '{surface.800}' }
        }
    },
    footer: {
        padding: '0.375rem 0.75rem',
        fontSize: '0.75rem',
        color: '{text.mutedColor}',
        limitColor: '{danger.color}',
        borderColor: '{content.borderColor}'
    },
    bubble: {
        padding: '0.25rem',
        gap: '0.125rem',
        background: '{overlay.popover.background}',
        borderColor: '{overlay.popover.borderColor}',
        borderRadius: '{overlay.popover.borderRadius}',
        shadow: '{overlay.popover.shadow}'
    },
    panel: {
        padding: '0.75rem',
        gap: '0.625rem',
        width: '18rem'
    },
    swatch: {
        size: '1.625rem',
        gap: '0.375rem',
        borderRadius: '{borderRadius.sm}',
        borderColor: '{content.borderColor}',
        selectedRing: '{primary.color}'
    },
    palette: {
        colorScheme: {
            light: {
                gray: { color: '{zinc.600}', highlight: '{zinc.200}' },
                ...Object.fromEntries(hues.map((h) => [h, tint(h)]))
            },
            dark: {
                gray: { color: '{zinc.400}', highlight: 'color-mix(in srgb, {zinc.400} 30%, transparent)' },
                ...Object.fromEntries(hues.map((h) => [h, darkTint(h)]))
            }
        }
    }
};
