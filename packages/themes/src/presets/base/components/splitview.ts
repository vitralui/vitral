// The pane sits on the window background, as a NavigationView's does; floated
// over the content it takes the popup surface and a shadow so it reads as a layer.
export default {
    root: {
        transitionDuration: '0.2s',
        transitionEasing: 'cubic-bezier(0.1, 0.9, 0.2, 1)'
    },
    pane: {
        background: '{app.background}',
        color: '{text.color}',
        borderColor: '{content.borderColor}',
        overlayBackground: '{overlay.popover.background}',
        overlayBorderColor: '{overlay.popover.borderColor}',
        overlayShadow: '{overlay.navigation.shadow}'
    },
    content: {
        background: 'transparent',
        color: '{text.color}'
    }
};
