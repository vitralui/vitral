import type { BaseProps, IconProp } from '../../base/types';

export type AccordionPanelValue = string | number;

/** The open panel's value, or, with `multiple`, the list of open panels' values. */
export type AccordionValue = AccordionPanelValue | AccordionPanelValue[] | null;

export interface AccordionProps extends BaseProps {
    /** Let several panels be open at once; `value` is then an array. */
    multiple?: boolean;
    /** Render a panel's content only while it is open. */
    lazy?: boolean;
    /** The level of the heading each header button sits in. Defaults to 3; set it to fit the page outline. */
    headingLevel?: number;
    /** Shown on a closed panel instead of the chevron. */
    expandIcon?: IconProp;
    /** Shown on an open panel instead of the chevron. */
    collapseIcon?: IconProp;
}

export interface AccordionPanelProps extends BaseProps {
    value: AccordionPanelValue;
    disabled?: boolean;
    /** The element the panel renders as. */
    as?: string;
}

export type AccordionHeaderProps = BaseProps;

export type AccordionContentProps = BaseProps;

export interface AccordionSlots {
    default?: () => unknown;
}

export interface AccordionHeaderSlots {
    default?: () => unknown;
    toggleicon?: (props: { active: boolean }) => unknown;
}
