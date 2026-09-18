import type { BaseProps } from '../../base/types';

/** One person, team or thing in the chart. */
export interface OrganizationChartNode {
    key: string;
    label?: string;
    /** Picks the slot named after it to render the node. */
    type?: string;
    data?: unknown;
    children?: OrganizationChartNode[];
    /** `false` keeps this node out of the selection. */
    selectable?: boolean;
    /** `false` keeps this node open. */
    collapsible?: boolean;
    styleClass?: string;
    [extra: string]: unknown;
}

export interface OrganizationChartProps extends BaseProps {
    /** The top of the chart. */
    value?: OrganizationChartNode;
    selectionMode?: 'single' | 'multiple';
    /** Nodes can be folded away. */
    collapsible?: boolean;
}

export type OrganizationChartEmits = {
    'node-select': [node: OrganizationChartNode];
    'node-unselect': [node: OrganizationChartNode];
    'node-expand': [node: OrganizationChartNode];
    'node-collapse': [node: OrganizationChartNode];
};

export interface OrganizationChartSlots {
    /** A node's content; a slot named after a node's `type` wins. */
    default?: (props: { node: OrganizationChartNode }) => unknown;
    [type: string]: ((props: { node: OrganizationChartNode }) => unknown) | undefined;
}
