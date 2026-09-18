import { defineStyle } from '../defineStyle';
import css from './accordion.css?raw';

export interface AccordionPanelState {
    open?: boolean;
    disabled?: boolean;
}

export interface AccordionToggleIconState {
    open?: boolean;
    /** Turn the built-in chevron over while open; custom expand/collapse icons swap instead. */
    rotate?: boolean;
}

/** One style for the four parts of an accordion: Accordion, AccordionPanel, AccordionHeader, AccordionContent. */
export const accordionStyle = defineStyle({
    name: 'accordion',
    css,
    classes: {
        root: 'vt-accordion',
        panel: (s: AccordionPanelState) => ['vt-accordion-panel', { 'vt-accordion-panel-open': s.open, 'vt-accordion-panel-disabled': s.disabled }],
        heading: 'vt-accordion-heading',
        header: (s: AccordionPanelState) => ['vt-accordion-header', { 'vt-accordion-header-open': s.open }],
        headerLabel: 'vt-accordion-header-label',
        toggleIcon: (s: AccordionToggleIconState) => ['vt-accordion-toggle-icon', { 'vt-accordion-toggle-icon-open': s.open && s.rotate }],
        content: 'vt-accordion-content',
        contentInner: 'vt-accordion-content-inner'
    }
});
