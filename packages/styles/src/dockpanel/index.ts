import { defineStyle } from '../defineStyle';
import css from './dockpanel.css?raw';

export const dockpanelStyle = defineStyle({
    name: 'dockpanel',
    css,
    classes: {
        root: 'vt-dockpanel',
        top: 'vt-dockpanel-top',
        bottom: 'vt-dockpanel-bottom',
        left: 'vt-dockpanel-left',
        right: 'vt-dockpanel-right',
        /** The default slot: the fill, which takes what the docked edges leave. */
        fill: 'vt-dockpanel-fill'
    }
});
