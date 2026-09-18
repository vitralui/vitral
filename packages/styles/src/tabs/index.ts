import { defineStyle } from '../defineStyle';
import css from './tabs.css?raw';

export interface TabsState {
    orientation?: 'horizontal' | 'vertical';
}

export interface TabsIndicatorState extends TabsState {
    /** Nothing selected, or not measured yet. */
    hidden?: boolean;
    /** Off for the first placement, so the pill does not slide in from the corner on load. */
    animated?: boolean;
}

export interface TabState {
    selected?: boolean;
    disabled?: boolean;
}

/** One style for Tabs, TabList, Tab, TabPanels and TabPanel. */
export const tabsStyle = defineStyle({
    name: 'tabs',
    css,
    classes: {
        root: (s: TabsState) => ['vt-tabs', { 'vt-tabs-vertical': s.orientation === 'vertical' }],
        tablist: (s: TabsState) => ['vt-tabs-tablist', { 'vt-tabs-tablist-vertical': s.orientation === 'vertical' }],
        list: (s: TabsState) => ['vt-tabs-list', { 'vt-tabs-list-vertical': s.orientation === 'vertical' }],
        indicator: (s: TabsIndicatorState) => [
            'vt-tabs-indicator',
            { 'vt-tabs-indicator-vertical': s.orientation === 'vertical', 'vt-tabs-indicator-hidden': s.hidden, 'vt-tabs-indicator-animated': s.animated }
        ],
        tab: (s: TabState) => ['vt-tabs-tab', { 'vt-tabs-tab-selected': s.selected, 'vt-tabs-tab-disabled': s.disabled }],
        panels: 'vt-tabs-panels',
        panel: 'vt-tabs-panel'
    }
});
