// A round button that fans its actions out; the actions are smaller round
// buttons that grow in one after another.
export default {
    root: {
        gap: '0.5rem',
        buttonSize: '3.5rem',
        transitionDuration: '0.2s'
    },
    action: {
        size: '2.5rem',
        background: '{secondary.color}',
        hoverBackground: '{secondary.hoverColor}',
        color: '{secondary.contrastColor}',
        shadow: '0 2px 6px rgba(0, 0, 0, 0.18)'
    },
    mask: {
        background: '{mask.background}'
    }
};
