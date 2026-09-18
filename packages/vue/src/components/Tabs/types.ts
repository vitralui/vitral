import type { BaseProps } from '../../base/types';

export type TabValue = string | number;

export interface TabsProps extends BaseProps {
    /** Tabs above the panels (the default) or beside them. */
    orientation?: 'horizontal' | 'vertical';
    /** Render a panel only while its tab is selected. */
    lazy?: boolean;
    /**
     * Select a tab as soon as the arrow keys reach it — the APG's automatic
     * activation, and the default. Off, the arrows only move focus and
     * Enter/Space select.
     */
    selectOnFocus?: boolean;
}

export type TabListProps = BaseProps;

export interface TabProps extends BaseProps {
    value: TabValue;
    disabled?: boolean;
}

export type TabPanelsProps = BaseProps;

export interface TabPanelProps extends BaseProps {
    value: TabValue;
}

export interface TabsSlots {
    default?: () => unknown;
}
