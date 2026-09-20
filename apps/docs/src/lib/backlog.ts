import { href } from './router';
import { entries } from './catalog';

/**
 * Every component an application is built from (form controls, data, overlays,
 * menus, and the application pieces such as a command palette, a sidebar or a
 * scheduler) in one table against what Vitral has.
 *
 * `vitral` is the component's name here. It is looked up in the catalog, so a
 * row turns from *planned* to *shipped* by a component existing, never by
 * someone remembering to edit this list.
 */
export interface BacklogRow {
    vitral: string;
    group: 'Form' | 'Button' | 'Data' | 'Panel' | 'Overlay' | 'Menu' | 'Messages' | 'Media' | 'Layout' | 'Misc';
    /** Written when the component is not here yet: why it is worth having. */
    note?: string;
}

export const backlog: BacklogRow[] = [
    // ---- Form
    { vitral: 'InputText', group: 'Form' },
    { vitral: 'Textarea', group: 'Form' },
    { vitral: 'InputNumber', group: 'Form' },
    { vitral: 'Select', group: 'Form' },
    { vitral: 'Checkbox', group: 'Form' },
    { vitral: 'RadioButton', group: 'Form' },
    { vitral: 'ToggleSwitch', group: 'Form' },
    { vitral: 'Slider', group: 'Form' },
    { vitral: 'DatePicker', group: 'Form' },
    { vitral: 'AutoComplete', group: 'Form', note: 'The editable combobox: suggestions as you type, over the same list behaviour Select already has.' },
    { vitral: 'MultiSelect', group: 'Form', note: 'Select with checkboxes, a chip display and select-all.' },
    { vitral: 'InputPassword', group: 'Form', note: 'A text box with a reveal toggle and a strength meter.' },
    { vitral: 'InputMask', group: 'Form', note: 'A pattern a value is typed into: dates, documents, phone numbers.' },
    { vitral: 'InputOtp', group: 'Form', note: 'One box per digit, with paste across them.' },
    { vitral: 'InputTag', group: 'Form', note: 'A list of short strings as removable tags, typed one at a time or pasted as a line.' },
    { vitral: 'SelectButton', group: 'Form', note: 'A segmented control: a radio group that looks like buttons.' },
    { vitral: 'ToggleButton', group: 'Form', note: 'A button that stays pressed.' },
    { vitral: 'Rating', group: 'Form', note: 'Stars, as a radio group.' },
    { vitral: 'Knob', group: 'Form', note: 'A dial for a bounded number.' },
    { vitral: 'ColorPicker', group: 'Form', note: 'A spectrum, a hue strip and the value in hex, RGB or HSL.' },
    { vitral: 'TreeSelect', group: 'Form', note: 'Select over a tree, with checkbox selection.' },
    { vitral: 'CascadeSelect', group: 'Form', note: 'Nested options, one column per level.' },
    { vitral: 'FloatLabel', group: 'Form', note: 'A label that starts inside the field and lifts out of it.' },
    { vitral: 'InputGroup', group: 'Form', note: 'Addons welded to either end of a field.' },
    { vitral: 'IconField', group: 'Form', note: 'An icon inside the field. Already possible through slots, but worth a component.' },
    { vitral: 'Label', group: 'Form', note: 'The label element with the field chrome’s typography, and the `for` wiring checked.' },
    { vitral: 'Form', group: 'Form', note: 'Validation and submission as parts (`Form.Root`, `Form.Field`, `Form.Summary`…) over `@vitral/forms`: rules, async checks, field arrays and schema resolvers.' },
    { vitral: 'Editor', group: 'Form' },

    // ---- Button
    { vitral: 'Button', group: 'Button' },
    { vitral: 'SplitButton', group: 'Button', note: 'A command with a menu welded to it.' },
    { vitral: 'ButtonGroup', group: 'Button', note: 'Buttons joined into one control.' },
    { vitral: 'SpeedDial', group: 'Button', note: 'A floating button that fans its actions out.' },

    // ---- Data
    { vitral: 'DataGrid', group: 'Data' },
    { vitral: 'DataTable', group: 'Data' },
    { vitral: 'Chat', group: 'Data' },
    { vitral: 'Listbox', group: 'Data' },
    { vitral: 'Tree', group: 'Data' },
    { vitral: 'Paginator', group: 'Data' },
    { vitral: 'TreeTable', group: 'Data', note: 'Rows that expand into rows: the table and the tree, together.' },
    { vitral: 'DataView', group: 'Data', note: 'The data layer with your own template per item, in a list or a grid.' },
    { vitral: 'VirtualScroller', group: 'Data', note: 'Windowed rendering, then virtual scrolling inside Select, Listbox and DataGrid.' },
    { vitral: 'OrderList', group: 'Data', note: 'A list the reader reorders, by drag and by keyboard.' },
    { vitral: 'PickList', group: 'Data', note: 'Two lists and the moves between them.' },
    { vitral: 'Timeline', group: 'Data', note: 'Events on an axis, either orientation.' },
    { vitral: 'OrganizationChart', group: 'Data', note: 'A tree drawn as a chart.' },
    { vitral: 'Chart', group: 'Data', note: 'SVG charts with an ApexCharts-shaped, JSON-serialisable options object: line, area, bar, scatter, heatmap, candlestick, donut, radar — with zoom, a brush and synced groups.' },
    { vitral: 'Taskboard', group: 'Data', note: 'A kanban board: cards in columns and swimlanes, moved by pointer, touch or keyboard, with work-in-progress limits.' },
    { vitral: 'Schedule', group: 'Data', note: 'A calendar and scheduler: month, week, day, agenda and resource timeline, with recurring events and drag to move and resize.' },
    {
        vitral: 'Spreadsheet',
        group: 'Data',
        note: 'A grid of cells with a formula engine behind it: A1 references, rectangles, a dependency graph so an edit costs what followed from it, and the keyboard a spreadsheet has always had.'
    },

    // ---- Panel
    { vitral: 'Card', group: 'Panel' },
    { vitral: 'Panel', group: 'Panel' },
    { vitral: 'Accordion', group: 'Panel' },
    { vitral: 'Tabs', group: 'Panel' },
    { vitral: 'Divider', group: 'Panel' },
    { vitral: 'Toolbar', group: 'Panel' },
    { vitral: 'Fieldset', group: 'Panel', note: 'A legend that can collapse its group.' },
    { vitral: 'ScrollPanel', group: 'Panel', note: 'A scroller with the theme’s own bars.' },
    { vitral: 'Stepper', group: 'Panel', note: 'Steps, linear or not, with the panel for each.' },

    // ---- Overlay
    { vitral: 'Dialog', group: 'Overlay' },
    { vitral: 'ConfirmDialog', group: 'Overlay' },
    { vitral: 'Drawer', group: 'Overlay' },
    { vitral: 'Popover', group: 'Overlay' },
    { vitral: 'Tooltip', group: 'Overlay' },
    { vitral: 'ConfirmPopup', group: 'Overlay', note: 'The confirmation anchored to what it is about, rather than in the middle of the page.' },
    { vitral: 'HoverCard', group: 'Overlay', note: 'A popover that opens on hover, for a preview of what a link points at.' },
    { vitral: 'DynamicDialog', group: 'Overlay', note: 'A dialog opened from code with a component as its content.' },

    // ---- Menu
    { vitral: 'Menu', group: 'Menu' },
    { vitral: 'Breadcrumb', group: 'Menu' },
    { vitral: 'TieredMenu', group: 'Menu', note: 'Submenus that open beside their parent.' },
    { vitral: 'Menubar', group: 'Menu', note: 'The application menu bar, with the APG keyboard.' },
    { vitral: 'ContextMenu', group: 'Menu', note: 'The right-click menu, and Shift+F10.' },
    { vitral: 'PanelMenu', group: 'Menu', note: 'A menu that expands in place, for a sidebar.' },
    { vitral: 'MegaMenu', group: 'Menu', note: 'The wide panel this site’s own top bar uses.' },
    { vitral: 'Dock', group: 'Menu', note: 'A strip of large icons that grow under the pointer.' },
    { vitral: 'Sidebar', group: 'Menu', note: 'The collapsible application sidebar: SplitView plus a menu, as one component.' },

    // ---- Messages
    { vitral: 'Message', group: 'Messages' },
    { vitral: 'Toast', group: 'Messages' },
    { vitral: 'ProgressBar', group: 'Messages' },
    { vitral: 'ProgressSpinner', group: 'Messages' },
    { vitral: 'Skeleton', group: 'Messages', note: 'The shape of what is loading, animated unless the system says not to.' },
    { vitral: 'BlockUI', group: 'Messages', note: 'A mask over one region while it is busy.' },

    // ---- Media
    { vitral: 'Avatar', group: 'Media', note: 'An image, initials or an icon, and a group of them.' },
    { vitral: 'Image', group: 'Media', note: 'An image with a preview that opens over the page.' },
    { vitral: 'Galleria', group: 'Media', note: 'Images with thumbnails and a full-screen mode.' },
    { vitral: 'Carousel', group: 'Media', note: 'A track of items with paging, autoplay and the APG carousel keyboard.' },
    { vitral: 'FileUpload', group: 'Media', note: 'A drop zone, a queue and progress per file.' },
    { vitral: 'AspectRatio', group: 'Media', note: 'A box that keeps its ratio: `aspect-ratio` as a component, for the layouts that need it.' },

    // ---- Layout
    { vitral: 'StackPanel', group: 'Layout' },
    { vitral: 'WrapPanel', group: 'Layout' },
    { vitral: 'UniformGrid', group: 'Layout' },
    { vitral: 'DockPanel', group: 'Layout' },
    { vitral: 'Grid', group: 'Layout' },
    { vitral: 'SplitView', group: 'Layout' },
    { vitral: 'Splitter', group: 'Layout' },

    // ---- Misc
    { vitral: 'Tag', group: 'Misc' },
    { vitral: 'Badge', group: 'Misc' },
    { vitral: 'Chip', group: 'Misc', note: 'A removable token, for what a filter or a recipient list is made of.' },
    { vitral: 'MeterGroup', group: 'Misc', note: 'Several values on one bar, with a legend.' },
    { vitral: 'Inplace', group: 'Misc', note: 'Display that becomes its editor when activated.' },
    { vitral: 'ScrollTop', group: 'Misc', note: 'The button back to the top of a long page.' },
    { vitral: 'Terminal', group: 'Misc', note: 'A prompt and a log, for a console in an application.' },
    { vitral: 'Command', group: 'Misc', note: 'The Ctrl-K palette: a combobox over actions, grouped and filtered.' }
];

const shipped = new Set(entries.map((entry) => entry.meta.title));

export interface BacklogEntry extends BacklogRow {
    shipped: boolean;
    /** The component's page, when it has one. */
    href?: string;
}

export const coverage: BacklogEntry[] = backlog.map((row) => ({
    ...row,
    shipped: shipped.has(row.vitral),
    href: shipped.has(row.vitral) ? href(`/components/${row.vitral.toLowerCase()}`) : undefined
}));

export const coverageCount = {
    total: coverage.length,
    shipped: coverage.filter((row) => row.shipped).length,
    get remaining() {
        return this.total - this.shipped;
    }
};
