// A drop zone on the content surface: a toolbar of buttons, the queue as rows,
// and a dashed outline that lights up while files are dragged over it.
export default {
    root: {
        background: '{content.background}',
        borderColor: '{content.borderColor}',
        borderRadius: '{content.borderRadius}',
        color: '{content.color}',
        gap: '0.5rem'
    },
    header: {
        padding: '0.75rem 1rem',
        borderColor: '{content.borderColor}'
    },
    content: {
        padding: '1rem',
        gap: '0.75rem',
        dragBorderColor: '{primary.color}',
        dragBackground: '{highlight.background}'
    },
    file: {
        padding: '0.5rem 0',
        gap: '0.75rem',
        borderColor: '{content.borderColor}',
        thumbnailSize: '3rem',
        thumbnailRadius: '{borderRadius.sm}',
        nameFontWeight: '500',
        sizeColor: '{text.mutedColor}'
    },
    empty: {
        color: '{text.mutedColor}',
        iconSize: '2.5rem'
    }
};
