import { defineStyle } from '../defineStyle';
import css from './splitview.css?raw';

export type SplitViewDisplayMode = 'inline' | 'overlay' | 'compactInline' | 'compactOverlay';

export interface SplitViewState {
    displayMode?: SplitViewDisplayMode;
    placement?: 'left' | 'right';
    open?: boolean;
}

const modeClass: Record<SplitViewDisplayMode, string> = {
    inline: 'vt-splitview-inline',
    overlay: 'vt-splitview-overlay',
    compactInline: 'vt-splitview-compact-inline',
    compactOverlay: 'vt-splitview-compact-overlay'
};

export const splitviewStyle = defineStyle({
    name: 'splitview',
    css,
    classes: {
        root: (s: SplitViewState) => {
            const mode = s.displayMode ?? 'overlay';
            return [
                'vt-splitview',
                modeClass[mode],
                `vt-splitview-${s.placement ?? 'left'}`,
                {
                    'vt-splitview-open': s.open,
                    'vt-splitview-floating': mode === 'overlay' || mode === 'compactOverlay',
                    'vt-splitview-compact': mode === 'compactInline' || mode === 'compactOverlay'
                }
            ];
        },
        pane: 'vt-splitview-pane',
        /** Holds the pane's content at the open width, so it is clipped rather than squeezed while the pane is narrower. */
        paneContent: 'vt-splitview-pane-content',
        content: 'vt-splitview-content'
    }
});
