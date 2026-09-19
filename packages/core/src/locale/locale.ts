/**
 * Every string a component shows or announces. Components never hard-code text;
 * they read it from here, so a translation is one object.
 *
 * Placeholders are `{name}`, filled by {@link formatMessage}.
 */
export interface Locale {
    code: string;
    accept: string;
    reject: string;
    cancel: string;
    close: string;
    clear: string;
    apply: string;
    choose: string;
    today: string;
    search: string;
    loading: string;
    on: string;
    off: string;
    emptyMessage: string;
    emptySearchMessage: string;
    emptySelectionMessage: string;
    /** `{count}` */
    selectionMessage: string;
    /** `{count}` */
    searchMessage: string;
    /** `{first}`, `{last}`, `{total}`, `{page}`, `{pageCount}` */
    pageReport: string;
    rowsPerPage: string;
    /** Password strength meter. */
    passwordPrompt: string;
    weak: string;
    medium: string;
    strong: string;
    /** File upload. */
    upload: string;
    /** `{name}`, `{types}` */
    invalidFileType: string;
    /** `{name}`, `{size}` */
    invalidFileSize: string;
    /** `{limit}` */
    invalidFileLimit: string;
    dragDrop: string;
    pending: string;
    completed: string;

    dayNames: string[];
    dayNamesShort: string[];
    dayNamesMin: string[];
    monthNames: string[];
    monthNamesShort: string[];
    firstDayOfWeek: number;
    /** A {@link formatDate} pattern. */
    dateFormat: string;

    /** The scheduler's text. Date patterns are {@link formatDate} patterns. */
    schedule: {
        month: string;
        week: string;
        day: string;
        agenda: string;
        timeline: string;
        allDay: string;
        /** Shown by the agenda when the range has nothing in it. */
        noEvents: string;
        /** A month cell's overflow button. `{count}` */
        more: string;
        /** The overflow button's accessible name. `{count}`, `{date}` */
        moreLabel: string;
        /** An event with no title. */
        untitled: string;
        /** Heads the resource column of a timeline. */
        resources: string;
        /** Names the view switcher. */
        views: string;
        previous: string;
        next: string;
        /** The title of a month. */
        monthTitle: string;
        /** A full date: a day view's title, a cell's name. */
        dayTitle: string;
        /** A day column's header. */
        dayHeader: string;
        /** Each end of a week's title. */
        rangeDate: string;
        /** A title spanning two dates. `{start}`, `{end}` */
        range: string;
        /** When an all-day event happens. `{date}` */
        allDayWhen: string;
        /** When an all-day event spanning days happens. `{start}`, `{end}` */
        allDayRangeWhen: string;
        /** When a timed event happens. `{date}`, `{start}`, `{end}` */
        timedWhen: string;
        /** An event's accessible name. `{title}`, `{when}` */
        eventLabel: string;
        /** An event's accessible name in a resource's row. `{title}`, `{when}`, `{resource}` */
        eventResourceLabel: string;
        /** Marks a recurring event. */
        recurring: string;
        /** Describes the keys on an editable event. */
        eventInstructions: string;
        /** Describes the keys on the grid. */
        gridInstructions: string;
        /** `{title}`, `{when}` */
        eventMoved: string;
        /** `{title}`, `{when}` */
        eventResized: string;
        /** A range picked in the grid. `{when}` */
        selected: string;
        /** Names the current-time line. `{time}` */
        now: string;
        /** Heads the time column. */
        time: string;
    };

    /** The chart's text. */
    chart: {
        noData: string;
        total: string;
        size: string;
        open: string;
        high: string;
        low: string;
        close: string;
        minimum: string;
        lowerQuartile: string;
        median: string;
        upperQuartile: string;
        maximum: string;
        category: string;
        value: string;
        /** Names the toolbar. */
        toolbar: string;
        zoomIn: string;
        zoomOut: string;
        resetZoom: string;
        /** The drag mode that zooms to a selection. */
        selectZoom: string;
        pan: string;
        download: string;
        downloadSvg: string;
        downloadPng: string;
        downloadCsv: string;
        /** Names the legend. */
        legend: string;
        /** Chart kinds, for the generated summary. */
        types: Record<
            | 'line'
            | 'area'
            | 'bar'
            | 'lollipop'
            | 'scatter'
            | 'bubble'
            | 'heatmap'
            | 'candlestick'
            | 'pie'
            | 'donut'
            | 'radar'
            | 'waterfall'
            | 'rangeBar'
            | 'rangeArea'
            | 'histogram'
            | 'boxPlot'
            | 'stream'
            | 'bullet'
            | 'treemap'
            | 'calendar'
            | 'sunburst'
            | 'radialBar'
            | 'gauge'
            | 'funnel',
            string
        >;
        /** The summary that names a chart. `{type}`, `{count}`, `{names}` */
        summary: string;
        /** One series in the summary. `{name}`, `{count}`, `{min}`, `{max}` */
        seriesSummary: string;
        /** The summary's range of the x axis. `{from}`, `{to}` */
        rangeSummary: string;
        /** Describes the chart's keys. */
        keyboardHelp: string;
        /** Read out when the keyboard lands on a point. `{series}`, `{label}`, `{value}`, `{position}`, `{count}` */
        readout: string;
        /** Read out after a zoom. `{from}`, `{to}` */
        zoomed: string;
        /** Names the hidden data table. `{title}` */
        dataTable: string;
        /** A series toggled off. `{series}` */
        seriesHidden: string;
        seriesShown: string;
        untitled: string;
    };

    /** The rich-text editor's text. */
    editor: {
        /** Names the toolbar. */
        toolbar: string;
        /** Names the floating toolbar over a selection. */
        bubble: string;
        blockType: string;
        paragraph: string;
        heading1: string;
        heading2: string;
        heading3: string;
        codeBlock: string;
        bold: string;
        italic: string;
        underline: string;
        strike: string;
        code: string;
        textColor: string;
        highlight: string;
        /** The swatch that removes a text colour. */
        defaultColor: string;
        /** The swatch that removes a highlight. */
        noHighlight: string;
        /** Names of the palette colours, by palette name. */
        colors: Record<string, string>;
        bulletList: string;
        orderedList: string;
        taskList: string;
        indent: string;
        outdent: string;
        blockquote: string;
        horizontalRule: string;
        link: string;
        image: string;
        table: string;
        undo: string;
        redo: string;
        clearFormatting: string;
        /** The link editor. */
        linkUrl: string;
        linkText: string;
        openInNewTab: string;
        apply: string;
        removeLink: string;
        openLink: string;
        invalidUrl: string;
        /** The image form. */
        imageUrl: string;
        imageAlt: string;
        imageAltHint: string;
        insert: string;
        invalidImageUrl: string;
        altRequired: string;
        /** The table menu. */
        insertTable: string;
        /** How many rows and columns a new table has. */
        tableRows: string;
        tableColumns: string;
        addRowBefore: string;
        addRowAfter: string;
        addColumnBefore: string;
        addColumnAfter: string;
        deleteRow: string;
        deleteColumn: string;
        deleteTable: string;
        /** Names a task item's checkbox. */
        taskDone: string;
        /** `{count}` */
        word: string;
        /** `{count}` */
        words: string;
        /** `{count}` */
        character: string;
        /** `{count}` */
        characters: string;
        /** `{count}`, `{limit}` */
        charactersLimit: string;
        /** Describes the keys of the text area. */
        keyboardHelp: string;
        /** Names the list a slash opens. */
        slashMenu: string;
        /** Nothing matched what was typed after the slash. `{query}` */
        slashEmpty: string;
        /** Names the handle beside a block, and the menu it opens. */
        blockMenu: string;
        /** The commands the slash menu offers, by name. */
        slashCommands: Record<string, string>;
        /** What each slash command does, a line each. */
        slashHints: Record<string, string>;
        /** What the block menu offers. */
        blockActions: Record<string, string>;
    };

    /** The spreadsheet (`@vitral/spreadsheet` and the Spreadsheet component). */
    spreadsheet: {
        /** Names the grid itself. */
        grid: string;
        /** Names the box that says which cell the keyboard is in. */
        address: string;
        /** Names the bar that shows what was typed into that cell. */
        formula: string;
        /** The corner above the row numbers, which selects everything. */
        selectAll: string;
        /** A column's resize handle. `{column}` */
        resizeColumn: string;
        /** A row's resize handle. `{row}` */
        resizeRow: string;
        /** The handle at the corner of the selection, dragged to fill. */
        fill: string;
    };

    /**
     * Form validation (`@vitral/forms` and the Form parts). The rule texts
     * share their keys with the forms package's `FormMessages`.
     */
    form: {
        required: string;
        /** `{min}` */
        minLength: string;
        /** `{max}` */
        maxLength: string;
        /** `{min}` */
        minItems: string;
        /** `{max}` */
        maxItems: string;
        /** `{min}` */
        min: string;
        /** `{max}` */
        max: string;
        pattern: string;
        email: string;
        url: string;
        /** `{field}` */
        equals: string;
        invalid: string;
        /** The heading of the error summary. */
        summaryTitle: string;
        /** One line of the error summary. `{label}`, `{message}` */
        summaryItem: string;
        /** Read beside a field whose check is running. */
        validating: string;
    };
    aria: {
        close: string;
        maximize: string;
        restore: string;
        /** Names a confirmation dialog that has no header of its own. */
        confirmation: string;
        previous: string;
        next: string;
        first: string;
        last: string;
        /** `{page}` */
        page: string;
        increment: string;
        decrement: string;
        expand: string;
        collapse: string;
        sortAscending: string;
        sortDescending: string;
        sortNone: string;
        selectAll: string;
        unselectAll: string;
        selectRow: string;
        showPassword: string;
        hidePassword: string;
        breadcrumb: string;
        /** Names a breadcrumb's home item when it shows only an icon. */
        home: string;
        notifications: string;
        previousMonth: string;
        nextMonth: string;
        previousYear: string;
        nextYear: string;
        chooseDate: string;
        pagination: string;
        /** Names a table column's filter box. `{column}` */
        filterColumn: string;
        moreOptions: string;
        removeItem: string;
        /** Names the start thumb of a range slider. */
        minimum: string;
        /** Names the end thumb of a range slider. */
        maximum: string;
        /** Names a splitter's gutter, the separator that resizes the panels on either side. */
        resize: string;
        /** Names the handle that sets a table column's width. `{column}` */
        resizeColumn: string;
        /** Names the button that opens the list of a table's columns. */
        chooseColumns: string;
        /** The list itself. */
        columns: string;
        /** Sticks a column to an edge, or lets it go. `{column}` */
        pinColumn: string;
        unpinColumn: string;
        /** The reorder buttons of an order list or a pick list. */
        moveUp: string;
        moveTop: string;
        moveDown: string;
        moveBottom: string;
        /** The transfer buttons of a pick list. */
        moveToTarget: string;
        moveAllToTarget: string;
        moveToSource: string;
        moveAllToSource: string;
        /** Default names of a pick list's two lists. */
        sourceList: string;
        targetList: string;
        /** Announced after a reorder. `{item}`, `{position}`, `{count}` */
        itemMoved: string;
        /** Announced after several items are reordered at once. `{moved}`, `{position}`, `{count}` */
        itemsMoved: string;
        /** Announced after a transfer between lists. `{moved}`, `{list}` */
        itemsTransferred: string;
        /** Describes the reorder keys on a reorderable list. */
        reorderInstructions: string;
        /** A rating of one star. */
        star: string;
        /** A rating of several stars. `{star}` */
        stars: string;
        /** One box of a one-time code. `{index}`, `{length}` */
        otpLabel: string;
        /** The button that opens an autocomplete's full list. */
        showSuggestions: string;
        /** Names the chips of a multiple selection. */
        selectedItems: string;
        /** Names a colour picker's trigger and panel. */
        color: string;
        /** A colour picker's two-dimensional area. */
        saturationBrightness: string;
        /** Spoken value of the area. `{s}`, `{b}` */
        saturationBrightnessValue: string;
        hue: string;
        /** Names the colour picker's opacity slider. */
        opacity: string;
        /** A colour picker's text box for the hex value. */
        hex: string;
        /** The button that shows a menubar's items on a small screen. */
        menu: string;
        /** Names a sidebar's navigation. */
        navigation: string;
        collapseSidebar: string;
        expandSidebar: string;
        /** The image viewer's controls. */
        zoomIn: string;
        zoomOut: string;
        rotateLeft: string;
        rotateRight: string;
        flipHorizontal: string;
        flipVertical: string;
        /** Names the crop rectangle. */
        crop: string;
        /** Describes the crop's keyboard, read once when it takes focus. */
        cropInstructions: string;
        /** `{width}` `{height}` `{x}` `{y}`: announced as the crop is moved or resized. */
        cropPosition: string;
        /** The button that opens an image's preview. */
        preview: string;
        /** Names a carousel or a gallery's slide. `{index}`, `{count}` */
        slide: string;
        /** A carousel's slide picker button. `{index}` */
        goToSlide: string;
        pauseSlideshow: string;
        playSlideshow: string;
        fullScreen: string;
        exitFullScreen: string;
        thumbnails: string;
        scrollTop: string;
        /** Names a terminal's command line. */
        terminalInput: string;
        /** Names a command palette's search box. */
        commandInput: string;
        commandPalette: string;
        /** Describes the keys on a task board's cards. */
        taskboardInstructions: string;
        /** Describes the keys on a task board column's move handle. */
        taskboardColumnInstructions: string;
        /** A cell's list when the board has swimlanes. `{column}`, `{lane}` */
        taskboardCell: string;
        /** A column's card count. `{count}` */
        taskboardCount: string;
        /** A column's card count against its limit. `{count}`, `{limit}` */
        taskboardCountLimit: string;
        /** The button that collapses or expands a column or lane. `{name}` */
        taskboardToggle: string;
        /** A column's move handle. `{column}` */
        taskboardMoveColumn: string;
        /** `{item}`, `{position}`, `{count}`, `{column}` */
        taskboardGrabbed: string;
        /** `{item}`, `{position}`, `{count}`, `{column}` */
        taskboardMoved: string;
        /** `{item}`, `{position}`, `{count}`, `{column}` */
        taskboardDropped: string;
        /** `{item}`, `{position}`, `{count}`, `{column}` */
        taskboardCancelled: string;
        /** A drop the column's limit refuses. `{column}`, `{limit}` */
        taskboardFull: string;
        /** A drop `canDrop` refuses. `{item}`, `{column}` */
        taskboardRefused: string;
        /** `{item}` */
        taskboardLocked: string;
        /** `{column}`, `{position}`, `{count}` */
        taskboardColumnGrabbed: string;
        /** `{column}`, `{position}`, `{count}` */
        taskboardColumnMoved: string;
        /** `{column}`, `{position}`, `{count}` */
        taskboardColumnDropped: string;
        /** `{column}`, `{position}`, `{count}` */
        taskboardColumnCancelled: string;
        /** The lane holding cards whose lane matches none. */
        taskboardNoLane: string;
        /** An empty task board cell. */
        taskboardEmpty: string;
    };
}

export function formatMessage(template: string, params: Record<string, string | number>): string {
    return template.replace(/\{(\w+)\}/g, (whole, key: string) => (key in params ? String(params[key]) : whole));
}

export const en: Locale = {
    code: 'en',
    accept: 'Yes',
    reject: 'No',
    cancel: 'Cancel',
    close: 'Close',
    clear: 'Clear',
    apply: 'Apply',
    choose: 'Choose',
    today: 'Today',
    search: 'Search',
    loading: 'Loading…',
    on: 'On',
    off: 'Off',
    emptyMessage: 'No available options',
    emptySearchMessage: 'No results found',
    emptySelectionMessage: 'No selected item',
    selectionMessage: '{count} items selected',
    searchMessage: '{count} results are available',
    pageReport: '{first}–{last} of {total}',
    rowsPerPage: 'Rows per page',
    passwordPrompt: 'Enter a password',
    weak: 'Weak',
    medium: 'Medium',
    strong: 'Strong',
    upload: 'Upload',
    invalidFileType: '{name}: this type of file is not allowed. Allowed: {types}.',
    invalidFileSize: '{name}: the file is too large. The limit is {size}.',
    invalidFileLimit: 'Too many files. The limit is {limit}.',
    dragDrop: 'Drag and drop files here',
    pending: 'Pending',
    completed: 'Completed',
    dayNames: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    dayNamesShort: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    dayNamesMin: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'],
    monthNames: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    monthNamesShort: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    firstDayOfWeek: 0,
    dateFormat: 'MM/dd/yyyy',
    schedule: {
        month: 'Month',
        week: 'Week',
        day: 'Day',
        agenda: 'Agenda',
        timeline: 'Timeline',
        allDay: 'All day',
        noEvents: 'Nothing scheduled in this period',
        more: '+{count} more',
        moreLabel: '{count} more events on {date}',
        untitled: '(No title)',
        resources: 'Resources',
        views: 'View',
        previous: 'Previous period',
        next: 'Next period',
        monthTitle: 'MMMM yyyy',
        dayTitle: 'EEEE, MMMM d, yyyy',
        dayHeader: 'EEE d',
        rangeDate: 'MMM d, yyyy',
        range: '{start} – {end}',
        allDayWhen: '{date}, all day',
        allDayRangeWhen: '{start} to {end}, all day',
        timedWhen: '{date}, {start} to {end}',
        eventLabel: '{title}, {when}',
        eventResourceLabel: '{title}, {when}, {resource}',
        recurring: 'repeats',
        eventInstructions: 'Enter opens the event. Alt with the arrow keys moves it; Alt and Shift with the arrow keys change when it ends.',
        gridInstructions: 'Arrow keys move between days and times, Page Up and Page Down change the period, Shift with the arrow keys selects a range, Enter picks it.',
        eventMoved: '{title} moved to {when}',
        eventResized: '{title} now {when}',
        selected: 'Selected {when}',
        now: 'Current time, {time}',
        time: 'Time'
    },
    chart: {
        noData: 'No data to show',
        total: 'Total',
        size: 'Size',
        open: 'Open',
        high: 'High',
        low: 'Low',
        close: 'Close',
        minimum: 'Minimum',
        lowerQuartile: 'Lower quartile',
        median: 'Median',
        upperQuartile: 'Upper quartile',
        maximum: 'Maximum',
        category: 'Category',
        value: 'Value',
        toolbar: 'Chart tools',
        zoomIn: 'Zoom in',
        zoomOut: 'Zoom out',
        resetZoom: 'Reset zoom',
        selectZoom: 'Zoom by selection',
        pan: 'Pan',
        download: 'Download',
        downloadSvg: 'Download SVG',
        downloadPng: 'Download PNG',
        downloadCsv: 'Download CSV',
        legend: 'Legend',
        types: {
            line: 'Line',
            area: 'Area',
            bar: 'Bar',
            lollipop: 'Lollipop',
            scatter: 'Scatter',
            bubble: 'Bubble',
            heatmap: 'Heat map',
            candlestick: 'Candlestick',
            pie: 'Pie',
            donut: 'Donut',
            radar: 'Radar',
            waterfall: 'Waterfall',
            rangeBar: 'Range bar',
            rangeArea: 'Range area',
            histogram: 'Histogram',
            boxPlot: 'Box plot',
            stream: 'Stream',
            bullet: 'Bullet',
            treemap: 'Treemap',
            calendar: 'Calendar',
            sunburst: 'Sunburst',
            radialBar: 'Radial bar',
            gauge: 'Gauge',
            funnel: 'Funnel'
        },
        summary: '{type} chart, {count} series: {names}',
        seriesSummary: '{name}, {count} points from {min} to {max}',
        rangeSummary: 'from {from} to {to}',
        keyboardHelp: 'Left and right arrow keys move between data points, up and down between series, Enter selects.',
        readout: '{series}, {label}: {value}. {position} of {count}',
        zoomed: 'Showing {from} to {to}',
        dataTable: 'Data of {title}',
        seriesHidden: '{series} hidden',
        seriesShown: '{series} shown',
        untitled: 'Chart'
    },
    editor: {
        toolbar: 'Formatting',
        bubble: 'Selection formatting',
        blockType: 'Text style',
        paragraph: 'Paragraph',
        heading1: 'Heading 1',
        heading2: 'Heading 2',
        heading3: 'Heading 3',
        codeBlock: 'Code block',
        bold: 'Bold',
        italic: 'Italic',
        underline: 'Underline',
        strike: 'Strikethrough',
        code: 'Inline code',
        textColor: 'Text color',
        highlight: 'Highlight',
        defaultColor: 'Default color',
        noHighlight: 'No highlight',
        colors: { gray: 'Gray', red: 'Red', orange: 'Orange', yellow: 'Yellow', green: 'Green', teal: 'Teal', blue: 'Blue', purple: 'Purple', pink: 'Pink' },
        bulletList: 'Bulleted list',
        orderedList: 'Numbered list',
        taskList: 'Task list',
        indent: 'Increase indent',
        outdent: 'Decrease indent',
        blockquote: 'Quote',
        horizontalRule: 'Divider',
        link: 'Link',
        image: 'Image',
        table: 'Table',
        undo: 'Undo',
        redo: 'Redo',
        clearFormatting: 'Clear formatting',
        linkUrl: 'URL',
        linkText: 'Text',
        openInNewTab: 'Open in a new tab',
        apply: 'Apply',
        removeLink: 'Remove link',
        openLink: 'Open link',
        invalidUrl: 'Enter a web, email or phone link (https:, mailto:, tel:) or a relative path.',
        imageUrl: 'Image URL',
        imageAlt: 'Alternative text',
        imageAltHint: 'Describe the image for people who cannot see it.',
        insert: 'Insert',
        invalidImageUrl: 'Enter an http or https address.',
        altRequired: 'Alternative text is required.',
        insertTable: 'Insert table',
        tableRows: 'Rows',
        tableColumns: 'Columns',
        addRowBefore: 'Add row above',
        addRowAfter: 'Add row below',
        addColumnBefore: 'Add column before',
        addColumnAfter: 'Add column after',
        deleteRow: 'Delete row',
        deleteColumn: 'Delete column',
        deleteTable: 'Delete table',
        taskDone: 'Done',
        word: '{count} word',
        words: '{count} words',
        character: '{count} character',
        characters: '{count} characters',
        charactersLimit: '{count} of {limit} characters',
        keyboardHelp: 'Rich text. Alt+F10 moves to the toolbar, Escape comes back. Markdown shortcuts such as # and - work at the start of a line.',
        slashMenu: 'Insert a block',
        slashEmpty: 'Nothing matches “{query}”',
        blockMenu: 'Block actions',
        slashCommands: {
            paragraph: 'Text',
            heading1: 'Heading 1',
            heading2: 'Heading 2',
            heading3: 'Heading 3',
            bulletList: 'Bulleted list',
            orderedList: 'Numbered list',
            taskList: 'Task list',
            blockquote: 'Quote',
            codeBlock: 'Code block',
            horizontalRule: 'Divider',
            table: 'Table',
            image: 'Image'
        },
        slashHints: {
            paragraph: 'Plain paragraph',
            heading1: 'Big section heading',
            heading2: 'Medium section heading',
            heading3: 'Small section heading',
            bulletList: 'A list with bullets',
            orderedList: 'A list with numbers',
            taskList: 'A list with checkboxes',
            blockquote: 'Quote someone',
            codeBlock: 'Code, kept as written',
            horizontalRule: 'A line across the page',
            table: 'Rows and columns',
            image: 'A picture from a link'
        },
        blockActions: {
            duplicate: 'Duplicate',
            delete: 'Delete',
            moveUp: 'Move up',
            moveDown: 'Move down',
            turnIntoParagraph: 'Turn into text'
        }
    },
    spreadsheet: {
        grid: 'Spreadsheet',
        address: 'Selected cell',
        formula: 'Formula',
        selectAll: 'Select every cell',
        resizeColumn: 'Resize column {column}',
        resizeRow: 'Resize row {row}',
        fill: 'Fill from the selection'
    },
    form: {
        required: 'This field is required.',
        minLength: 'Enter at least {min} characters.',
        maxLength: 'Enter no more than {max} characters.',
        minItems: 'Choose or add at least {min}.',
        maxItems: 'Choose or add no more than {max}.',
        min: 'Enter {min} or more.',
        max: 'Enter {max} or less.',
        pattern: 'Enter a value in the expected format.',
        email: 'Enter an email address like name@example.com.',
        url: 'Enter a web address like https://example.com.',
        equals: 'This has to match {field}.',
        invalid: 'Enter a valid value.',
        summaryTitle: 'There is a problem',
        summaryItem: '{label}: {message}',
        validating: 'Checking…'
    },
    aria: {
        close: 'Close',
        maximize: 'Maximize',
        restore: 'Restore',
        confirmation: 'Confirmation',
        previous: 'Previous',
        next: 'Next',
        first: 'First page',
        last: 'Last page',
        page: 'Page {page}',
        increment: 'Increase',
        decrement: 'Decrease',
        expand: 'Expand',
        collapse: 'Collapse',
        sortAscending: 'Sorted ascending',
        sortDescending: 'Sorted descending',
        sortNone: 'Not sorted',
        selectAll: 'Select all',
        unselectAll: 'Clear selection',
        selectRow: 'Select row',
        showPassword: 'Show password',
        hidePassword: 'Hide password',
        breadcrumb: 'Breadcrumb',
        home: 'Home',
        notifications: 'Notifications',
        previousMonth: 'Previous month',
        nextMonth: 'Next month',
        previousYear: 'Previous year',
        nextYear: 'Next year',
        chooseDate: 'Choose date',
        pagination: 'Pagination',
        filterColumn: 'Filter {column}',
        moreOptions: 'More options',
        removeItem: 'Remove',
        minimum: 'Minimum',
        maximum: 'Maximum',
        resize: 'Resize',
        resizeColumn: 'Resize {column}',
        chooseColumns: 'Columns',
        columns: 'Columns',
        pinColumn: 'Pin {column}',
        unpinColumn: 'Unpin {column}',
        moveUp: 'Move up',
        moveTop: 'Move to top',
        moveDown: 'Move down',
        moveBottom: 'Move to bottom',
        moveToTarget: 'Move to target',
        moveAllToTarget: 'Move all to target',
        moveToSource: 'Move to source',
        moveAllToSource: 'Move all to source',
        sourceList: 'Available',
        targetList: 'Selected',
        itemMoved: '{item} moved to position {position} of {count}',
        itemsMoved: '{moved} items moved, first now at position {position} of {count}',
        itemsTransferred: '{moved} moved to {list}',
        reorderInstructions: 'Alt with the arrow keys, Home or End moves the selected items',
        star: '1 star',
        stars: '{star} stars',
        otpLabel: 'Character {index} of {length}',
        showSuggestions: 'Show suggestions',
        selectedItems: 'Selected items',
        color: 'Colour',
        saturationBrightness: 'Saturation and brightness',
        saturationBrightnessValue: 'Saturation {s}%, brightness {b}%',
        hue: 'Hue',
        opacity: 'Opacity',
        hex: 'Hex',
        menu: 'Menu',
        navigation: 'Navigation',
        collapseSidebar: 'Collapse sidebar',
        expandSidebar: 'Expand sidebar',
        zoomIn: 'Zoom in',
        zoomOut: 'Zoom out',
        rotateLeft: 'Rotate left',
        rotateRight: 'Rotate right',
        flipHorizontal: 'Flip horizontally',
        flipVertical: 'Flip vertically',
        crop: 'Crop',
        cropInstructions: 'Use the arrow keys to move the crop, Shift with an arrow to resize it, Home and End for the corners.',
        cropPosition: '{width} by {height} at {x}, {y}',
        preview: 'View image',
        slide: '{index} of {count}',
        goToSlide: 'Go to slide {index}',
        pauseSlideshow: 'Pause slideshow',
        playSlideshow: 'Play slideshow',
        fullScreen: 'Full screen',
        exitFullScreen: 'Exit full screen',
        thumbnails: 'Thumbnails',
        scrollTop: 'Scroll to top',
        terminalInput: 'Command',
        commandInput: 'Type a command or search',
        commandPalette: 'Command palette',
        taskboardInstructions: 'Press Space to pick the card up, the arrow keys to move it, Space again to drop it or Escape to cancel. Page Up and Page Down move it between lanes.',
        taskboardColumnInstructions: 'Press Space to pick the column up, the left and right arrow keys to move it, Space again to drop it or Escape to cancel.',
        taskboardCell: '{column}, {lane}',
        taskboardCount: '{count} cards',
        taskboardCountLimit: '{count} of {limit} cards',
        taskboardToggle: '{name} cards',
        taskboardMoveColumn: 'Move column {column}',
        taskboardGrabbed: '{item} picked up, position {position} of {count} in {column}',
        taskboardMoved: '{item}: position {position} of {count} in {column}',
        taskboardDropped: '{item} dropped in {column}, position {position} of {count}',
        taskboardCancelled: 'Move cancelled. {item} is back in {column}, position {position} of {count}',
        taskboardFull: '{column} is at its limit of {limit} cards',
        taskboardRefused: '{item} cannot be dropped in {column}',
        taskboardLocked: '{item} is locked and cannot be moved',
        taskboardColumnGrabbed: 'Column {column} picked up, position {position} of {count}',
        taskboardColumnMoved: 'Column {column}: position {position} of {count}',
        taskboardColumnDropped: 'Column {column} dropped at position {position} of {count}',
        taskboardColumnCancelled: 'Move cancelled. Column {column} is back at position {position} of {count}',
        taskboardNoLane: 'Other',
        taskboardEmpty: 'No cards'
    }
};

export const ptBR: Locale = {
    code: 'pt-BR',
    accept: 'Sim',
    reject: 'Não',
    cancel: 'Cancelar',
    close: 'Fechar',
    clear: 'Limpar',
    apply: 'Aplicar',
    choose: 'Escolher',
    today: 'Hoje',
    search: 'Buscar',
    loading: 'Carregando…',
    on: 'Ligado',
    off: 'Desligado',
    emptyMessage: 'Nenhuma opção disponível',
    emptySearchMessage: 'Nenhum resultado encontrado',
    emptySelectionMessage: 'Nenhum item selecionado',
    selectionMessage: '{count} itens selecionados',
    searchMessage: '{count} resultados disponíveis',
    pageReport: '{first}–{last} de {total}',
    rowsPerPage: 'Linhas por página',
    passwordPrompt: 'Digite uma senha',
    weak: 'Fraca',
    medium: 'Média',
    strong: 'Forte',
    upload: 'Enviar',
    invalidFileType: '{name}: este tipo de arquivo não é permitido. Permitidos: {types}.',
    invalidFileSize: '{name}: o arquivo é grande demais. O limite é {size}.',
    invalidFileLimit: 'Arquivos demais. O limite é {limit}.',
    dragDrop: 'Arraste e solte arquivos aqui',
    pending: 'Pendente',
    completed: 'Concluído',
    dayNames: ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'],
    dayNamesShort: ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'],
    dayNamesMin: ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'],
    monthNames: ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'],
    monthNamesShort: ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'],
    firstDayOfWeek: 0,
    dateFormat: 'dd/MM/yyyy',
    schedule: {
        month: 'Mês',
        week: 'Semana',
        day: 'Dia',
        agenda: 'Agenda',
        timeline: 'Linha do tempo',
        allDay: 'Dia inteiro',
        noEvents: 'Nada agendado neste período',
        more: '+{count} mais',
        moreLabel: 'Mais {count} eventos em {date}',
        untitled: '(Sem título)',
        resources: 'Recursos',
        views: 'Visualização',
        previous: 'Período anterior',
        next: 'Próximo período',
        monthTitle: "MMMM 'de' yyyy",
        dayTitle: "EEEE, d 'de' MMMM 'de' yyyy",
        dayHeader: 'EEE d',
        rangeDate: "d 'de' MMM 'de' yyyy",
        range: '{start} – {end}',
        allDayWhen: '{date}, dia inteiro',
        allDayRangeWhen: 'de {start} a {end}, dia inteiro',
        timedWhen: '{date}, das {start} às {end}',
        eventLabel: '{title}, {when}',
        eventResourceLabel: '{title}, {when}, {resource}',
        recurring: 'repete',
        eventInstructions: 'Enter abre o evento. Alt com as setas move o evento; Alt e Shift com as setas mudam quando ele termina.',
        gridInstructions: 'As setas movem entre dias e horários, Page Up e Page Down mudam o período, Shift com as setas seleciona um intervalo e Enter o escolhe.',
        eventMoved: '{title} movido para {when}',
        eventResized: '{title} agora {when}',
        selected: 'Selecionado: {when}',
        now: 'Hora atual, {time}',
        time: 'Horário'
    },
    chart: {
        noData: 'Sem dados para exibir',
        total: 'Total',
        size: 'Tamanho',
        open: 'Abertura',
        high: 'Máxima',
        low: 'Mínima',
        close: 'Fechamento',
        minimum: 'Mínimo',
        lowerQuartile: 'Primeiro quartil',
        median: 'Mediana',
        upperQuartile: 'Terceiro quartil',
        maximum: 'Máximo',
        category: 'Categoria',
        value: 'Valor',
        toolbar: 'Ferramentas do gráfico',
        zoomIn: 'Aproximar',
        zoomOut: 'Afastar',
        resetZoom: 'Restaurar zoom',
        selectZoom: 'Zoom por seleção',
        pan: 'Mover',
        download: 'Baixar',
        downloadSvg: 'Baixar SVG',
        downloadPng: 'Baixar PNG',
        downloadCsv: 'Baixar CSV',
        legend: 'Legenda',
        types: {
            line: 'Linhas',
            area: 'Área',
            bar: 'Barras',
            lollipop: 'Pirulito',
            scatter: 'Dispersão',
            bubble: 'Bolhas',
            heatmap: 'Mapa de calor',
            candlestick: 'Candlestick',
            pie: 'Pizza',
            donut: 'Rosca',
            radar: 'Radar',
            waterfall: 'Cascata',
            rangeBar: 'Barras de intervalo',
            rangeArea: 'Área de intervalo',
            histogram: 'Histograma',
            boxPlot: 'Diagrama de caixa',
            stream: 'Fluxo',
            bullet: 'Marcador',
            treemap: 'Mapa de árvore',
            calendar: 'Calendário',
            sunburst: 'Explosão solar',
            radialBar: 'Barras radiais',
            gauge: 'Medidor',
            funnel: 'Funil'
        },
        summary: 'Gráfico de {type}, {count} séries: {names}',
        seriesSummary: '{name}, {count} pontos de {min} a {max}',
        rangeSummary: 'de {from} a {to}',
        keyboardHelp: 'As setas para a esquerda e a direita movem entre os pontos, para cima e para baixo entre as séries, Enter seleciona.',
        readout: '{series}, {label}: {value}. {position} de {count}',
        zoomed: 'Exibindo de {from} a {to}',
        dataTable: 'Dados de {title}',
        seriesHidden: '{series} oculta',
        seriesShown: '{series} visível',
        untitled: 'Gráfico'
    },
    editor: {
        toolbar: 'Formatação',
        bubble: 'Formatação da seleção',
        blockType: 'Estilo do texto',
        paragraph: 'Parágrafo',
        heading1: 'Título 1',
        heading2: 'Título 2',
        heading3: 'Título 3',
        codeBlock: 'Bloco de código',
        bold: 'Negrito',
        italic: 'Itálico',
        underline: 'Sublinhado',
        strike: 'Tachado',
        code: 'Código',
        textColor: 'Cor do texto',
        highlight: 'Realce',
        defaultColor: 'Cor padrão',
        noHighlight: 'Sem realce',
        colors: { gray: 'Cinza', red: 'Vermelho', orange: 'Laranja', yellow: 'Amarelo', green: 'Verde', teal: 'Verde-azulado', blue: 'Azul', purple: 'Roxo', pink: 'Rosa' },
        bulletList: 'Lista com marcadores',
        orderedList: 'Lista numerada',
        taskList: 'Lista de tarefas',
        indent: 'Aumentar recuo',
        outdent: 'Diminuir recuo',
        blockquote: 'Citação',
        horizontalRule: 'Divisor',
        link: 'Link',
        image: 'Imagem',
        table: 'Tabela',
        undo: 'Desfazer',
        redo: 'Refazer',
        clearFormatting: 'Limpar formatação',
        linkUrl: 'URL',
        linkText: 'Texto',
        openInNewTab: 'Abrir em nova aba',
        apply: 'Aplicar',
        removeLink: 'Remover link',
        openLink: 'Abrir link',
        invalidUrl: 'Informe um link web, de e-mail ou telefone (https:, mailto:, tel:) ou um caminho relativo.',
        imageUrl: 'URL da imagem',
        imageAlt: 'Texto alternativo',
        imageAltHint: 'Descreva a imagem para quem não pode vê-la.',
        insert: 'Inserir',
        invalidImageUrl: 'Informe um endereço http ou https.',
        altRequired: 'O texto alternativo é obrigatório.',
        insertTable: 'Inserir tabela',
        tableRows: 'Linhas',
        tableColumns: 'Colunas',
        addRowBefore: 'Adicionar linha acima',
        addRowAfter: 'Adicionar linha abaixo',
        addColumnBefore: 'Adicionar coluna antes',
        addColumnAfter: 'Adicionar coluna depois',
        deleteRow: 'Excluir linha',
        deleteColumn: 'Excluir coluna',
        deleteTable: 'Excluir tabela',
        taskDone: 'Concluída',
        word: '{count} palavra',
        words: '{count} palavras',
        character: '{count} caractere',
        characters: '{count} caracteres',
        charactersLimit: '{count} de {limit} caracteres',
        keyboardHelp: 'Texto formatado. Alt+F10 vai para a barra de ferramentas e Esc volta. Atalhos Markdown como # e - funcionam no início da linha.',
        slashMenu: 'Inserir um bloco',
        slashEmpty: 'Nada corresponde a “{query}”',
        blockMenu: 'Ações do bloco',
        slashCommands: {
            paragraph: 'Texto',
            heading1: 'Título 1',
            heading2: 'Título 2',
            heading3: 'Título 3',
            bulletList: 'Lista com marcadores',
            orderedList: 'Lista numerada',
            taskList: 'Lista de tarefas',
            blockquote: 'Citação',
            codeBlock: 'Bloco de código',
            horizontalRule: 'Divisória',
            table: 'Tabela',
            image: 'Imagem'
        },
        slashHints: {
            paragraph: 'Parágrafo simples',
            heading1: 'Título de seção grande',
            heading2: 'Título de seção médio',
            heading3: 'Título de seção pequeno',
            bulletList: 'Uma lista com marcadores',
            orderedList: 'Uma lista com números',
            taskList: 'Uma lista com caixas de seleção',
            blockquote: 'Cite alguém',
            codeBlock: 'Código, como foi escrito',
            horizontalRule: 'Uma linha atravessando a página',
            table: 'Linhas e colunas',
            image: 'Uma imagem de um link'
        },
        blockActions: {
            duplicate: 'Duplicar',
            delete: 'Excluir',
            moveUp: 'Mover para cima',
            moveDown: 'Mover para baixo',
            turnIntoParagraph: 'Transformar em texto'
        }
    },
    spreadsheet: {
        grid: 'Planilha',
        address: 'Célula selecionada',
        formula: 'Fórmula',
        selectAll: 'Selecionar todas as células',
        resizeColumn: 'Redimensionar a coluna {column}',
        resizeRow: 'Redimensionar a linha {row}',
        fill: 'Preencher a partir da seleção'
    },
    form: {
        required: 'Preencha este campo.',
        minLength: 'Digite pelo menos {min} caracteres.',
        maxLength: 'Digite no máximo {max} caracteres.',
        minItems: 'Escolha ou adicione pelo menos {min}.',
        maxItems: 'Escolha ou adicione no máximo {max}.',
        min: 'Digite {min} ou mais.',
        max: 'Digite {max} ou menos.',
        pattern: 'Digite um valor no formato esperado.',
        email: 'Digite um e-mail como nome@exemplo.com.',
        url: 'Digite um endereço como https://exemplo.com.',
        equals: 'Tem de ser igual a {field}.',
        invalid: 'Digite um valor válido.',
        summaryTitle: 'Há um problema',
        summaryItem: '{label}: {message}',
        validating: 'Verificando…'
    },
    aria: {
        close: 'Fechar',
        maximize: 'Maximizar',
        restore: 'Restaurar',
        confirmation: 'Confirmação',
        previous: 'Anterior',
        next: 'Próximo',
        first: 'Primeira página',
        last: 'Última página',
        page: 'Página {page}',
        increment: 'Aumentar',
        decrement: 'Diminuir',
        expand: 'Expandir',
        collapse: 'Recolher',
        sortAscending: 'Ordenado crescente',
        sortDescending: 'Ordenado decrescente',
        sortNone: 'Sem ordenação',
        selectAll: 'Selecionar todos',
        unselectAll: 'Limpar seleção',
        selectRow: 'Selecionar linha',
        showPassword: 'Mostrar senha',
        hidePassword: 'Ocultar senha',
        breadcrumb: 'Trilha de navegação',
        home: 'Início',
        notifications: 'Notificações',
        previousMonth: 'Mês anterior',
        nextMonth: 'Próximo mês',
        previousYear: 'Ano anterior',
        nextYear: 'Próximo ano',
        chooseDate: 'Escolher data',
        pagination: 'Paginação',
        filterColumn: 'Filtrar {column}',
        moreOptions: 'Mais opções',
        removeItem: 'Remover',
        minimum: 'Mínimo',
        maximum: 'Máximo',
        resize: 'Redimensionar',
        resizeColumn: 'Redimensionar {column}',
        chooseColumns: 'Colunas',
        columns: 'Colunas',
        pinColumn: 'Fixar {column}',
        unpinColumn: 'Desafixar {column}',
        moveUp: 'Mover para cima',
        moveTop: 'Mover para o início',
        moveDown: 'Mover para baixo',
        moveBottom: 'Mover para o fim',
        moveToTarget: 'Mover para o destino',
        moveAllToTarget: 'Mover todos para o destino',
        moveToSource: 'Mover para a origem',
        moveAllToSource: 'Mover todos para a origem',
        sourceList: 'Disponíveis',
        targetList: 'Selecionados',
        itemMoved: '{item} movido para a posição {position} de {count}',
        itemsMoved: '{moved} itens movidos, o primeiro agora na posição {position} de {count}',
        itemsTransferred: '{moved} movido(s) para {list}',
        reorderInstructions: 'Alt com as setas, Home ou End move os itens selecionados',
        star: '1 estrela',
        stars: '{star} estrelas',
        otpLabel: 'Caractere {index} de {length}',
        showSuggestions: 'Mostrar sugestões',
        selectedItems: 'Itens selecionados',
        color: 'Cor',
        saturationBrightness: 'Saturação e brilho',
        saturationBrightnessValue: 'Saturação {s}%, brilho {b}%',
        hue: 'Matiz',
        opacity: 'Opacidade',
        hex: 'Hexadecimal',
        menu: 'Menu',
        navigation: 'Navegação',
        collapseSidebar: 'Recolher barra lateral',
        expandSidebar: 'Expandir barra lateral',
        zoomIn: 'Aumentar zoom',
        zoomOut: 'Diminuir zoom',
        rotateLeft: 'Girar para a esquerda',
        rotateRight: 'Girar para a direita',
        flipHorizontal: 'Espelhar na horizontal',
        flipVertical: 'Espelhar na vertical',
        crop: 'Recorte',
        cropInstructions: 'Use as setas para mover o recorte, Shift com uma seta para redimensioná-lo, Home e End para os cantos.',
        cropPosition: '{width} por {height} em {x}, {y}',
        preview: 'Ver imagem',
        slide: '{index} de {count}',
        goToSlide: 'Ir para o slide {index}',
        pauseSlideshow: 'Pausar apresentação',
        playSlideshow: 'Reproduzir apresentação',
        fullScreen: 'Tela cheia',
        exitFullScreen: 'Sair da tela cheia',
        thumbnails: 'Miniaturas',
        scrollTop: 'Voltar ao topo',
        terminalInput: 'Comando',
        commandInput: 'Digite um comando ou busque',
        commandPalette: 'Paleta de comandos',
        taskboardInstructions: 'Pressione Espaço para pegar o cartão, as setas para movê-lo, Espaço de novo para soltá-lo ou Esc para cancelar. Page Up e Page Down movem entre as raias.',
        taskboardColumnInstructions: 'Pressione Espaço para pegar a coluna, as setas para a esquerda e a direita para movê-la, Espaço de novo para soltá-la ou Esc para cancelar.',
        taskboardCell: '{column}, {lane}',
        taskboardCount: '{count} cartões',
        taskboardCountLimit: '{count} de {limit} cartões',
        taskboardToggle: 'Cartões de {name}',
        taskboardMoveColumn: 'Mover a coluna {column}',
        taskboardGrabbed: '{item} pego, posição {position} de {count} em {column}',
        taskboardMoved: '{item}: posição {position} de {count} em {column}',
        taskboardDropped: '{item} solto em {column}, posição {position} de {count}',
        taskboardCancelled: 'Movimento cancelado. {item} voltou para {column}, posição {position} de {count}',
        taskboardFull: '{column} está no limite de {limit} cartões',
        taskboardRefused: '{item} não pode ser solto em {column}',
        taskboardLocked: '{item} está bloqueado e não pode ser movido',
        taskboardColumnGrabbed: 'Coluna {column} pega, posição {position} de {count}',
        taskboardColumnMoved: 'Coluna {column}: posição {position} de {count}',
        taskboardColumnDropped: 'Coluna {column} solta na posição {position} de {count}',
        taskboardColumnCancelled: 'Movimento cancelado. A coluna {column} voltou para a posição {position} de {count}',
        taskboardNoLane: 'Outros',
        taskboardEmpty: 'Nenhum cartão'
    }
};
