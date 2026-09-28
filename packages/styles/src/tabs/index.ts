import { defineStyle } from '../defineStyle';
import css from './tabs.css?raw';

export interface TabsState {
    orientation?: 'horizontal' | 'vertical';
    scrollable?: boolean;
    /** The tabs are longer than the strip, so the scroll buttons show. */
    overflowing?: boolean;
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
        tablist: (s: TabsState) => ['vt-tabs-tablist', { 'vt-tabs-tablist-vertical': s.orientation === 'vertical', 'vt-tabs-tablist-scrollable': s.scrollable, 'vt-tabs-tablist-overflowing': s.overflowing }],
        /** The strip itself, inside the tablist's border: it holds the tabs and the indicator, and scrolls. */
        content: (s: TabsState) => ['vt-tabs-content', { 'vt-tabs-content-vertical': s.orientation === 'vertical', 'vt-tabs-content-scrollable': s.scrollable }],
        list: (s: TabsState) => ['vt-tabs-list', { 'vt-tabs-list-vertical': s.orientation === 'vertical' }],
        navButton: (s: TabsState & { end?: 'start' | 'end'; grouped?: boolean }) => [
            'vt-tabs-nav-button',
            s.end && `vt-tabs-nav-button-${s.end}`,
            { 'vt-tabs-nav-button-vertical': s.orientation === 'vertical', 'vt-tabs-nav-button-grouped': s.grouped }
        ],
        /** The two buttons together, at one end of the strip. */
        navGroup: (s: TabsState & { end?: 'start' | 'end' }) => ['vt-tabs-nav-group', s.end && `vt-tabs-nav-group-${s.end}`, { 'vt-tabs-nav-group-vertical': s.orientation === 'vertical' }],
        indicator: (s: TabsIndicatorState) => [
            'vt-tabs-indicator',
            { 'vt-tabs-indicator-vertical': s.orientation === 'vertical', 'vt-tabs-indicator-hidden': s.hidden, 'vt-tabs-indicator-animated': s.animated }
        ],
        tab: (s: TabState) => ['vt-tabs-tab', { 'vt-tabs-tab-selected': s.selected, 'vt-tabs-tab-disabled': s.disabled }],
        panels: 'vt-tabs-panels',
        panel: 'vt-tabs-panel'
    }
});
