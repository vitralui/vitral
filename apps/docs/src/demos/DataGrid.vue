<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'DataGrid',
    category: 'Data',
    description:
        'A data table that sorts, filters, pages and selects, locally or on your server, draws only the rows and columns in view, groups its columns under headings and holds rows at its edges, with columns the reader can resize, reorder, pin and hide.'
};
</script>

<script setup lang="ts">
import DemoSection from '../DemoSection.vue';
import ArrangedColumns from './DataGrid/ArrangedColumns.vue';
import ColumnGroups from './DataGrid/ColumnGroups.vue';
import DataSource from './DataGrid/DataSource.vue';
import EditCells from './DataGrid/EditCells.vue';
import EditRows from './DataGrid/EditRows.vue';
import EmptyAndLoading from './DataGrid/EmptyAndLoading.vue';
import FilterMenus from './DataGrid/FilterMenus.vue';
import GroupTotals from './DataGrid/GroupTotals.vue';
import RangeSheet from './DataGrid/RangeSheet.vue';
import Report from './DataGrid/Report.vue';
import Pivot from './DataGrid/Pivot.vue';
import SideBar from './DataGrid/SideBar.vue';
import RowDrag from './DataGrid/RowDrag.vue';
import TreeFiles from './DataGrid/TreeFiles.vue';
import ExportCsv from './DataGrid/ExportCsv.vue';
import GroupedRows from './DataGrid/GroupedRows.vue';
import LayoutContacts from './DataGrid/LayoutContacts.vue';
import LayoutFill from './DataGrid/LayoutFill.vue';
import LayoutInventory from './DataGrid/LayoutInventory.vue';
import LayoutTrading from './DataGrid/LayoutTrading.vue';
import MultipleSort from './DataGrid/MultipleSort.vue';
import PinnedRows from './DataGrid/PinnedRows.vue';
import RowDetails from './DataGrid/RowDetails.vue';
import RowHeight from './DataGrid/RowHeight.vue';
import SharedColumns from './DataGrid/SharedColumns.vue';
import SkeletonLoading from './DataGrid/SkeletonLoading.vue';
import SortFilterPageSelect from './DataGrid/SortFilterPageSelect.vue';
import VirtualColumns from './DataGrid/VirtualColumns.vue';
import VirtualRows from './DataGrid/VirtualRows.vue';
</script>

<template>
    <DemoSection title="Sort, filter, page and select" description="Click a header to sort, type under it to filter (accents are ignored: “sao” finds São Paulo), search every column at once from the header, and tick rows."><SortFilterPageSelect /></DemoSection>
    <DemoSection title="Multiple sort, single selection, grid lines" description="Sorted by country, then by balance, highest first. Ctrl-click (⌘-click) a header to add it to the sort. Click a row, or focus the rows and use the arrows and Space, to choose one. The header stays in view while the body scrolls."><MultipleSort /></DemoSection>
    <DemoSection title="A hundred thousand rows" description="`virtual-scroll` draws the rows in view and a few either side, and leaves room for the rest, so the scrollbar is as long as if every row were there. Sorting and the search still go over all hundred thousand. Each row is measured once it is drawn, so rows keep their own heights; the table still tells a screen reader how many rows it has and where each one is, and the arrow keys reach rows not drawn yet. `scrollToIndex()` brings one into view."><VirtualRows /></DemoSection>
    <DemoSection title="Columns in groups" description="`&lt;ColumnGroup&gt;` puts a heading over the columns inside it, and groups nest — here the year's halves over its quarters. Only the columns are sorted, moved and sized: drag Units of Q2 out of its quarter and the heading splits in two, as it does where the pinned block ends."><ColumnGroups /></DemoSection>
    <DemoSection title="Rows pinned to the top and the bottom" description="`pinned-top-rows` and `pinned-bottom-rows` hold rows still while the rest scroll between them. Either is a list, or a function of the rows the filters let through — the total here follows what you type. The columns draw them as they draw any row, and the `#body` slot's `pinned` tells them apart."><PinnedRows /></DemoSection>
    <DemoSection title="Columns drawn as they come into view" description="`virtual-columns` does for columns what `virtual-scroll` does for rows: a year of daily readings from two thousand sensors is 730,000 cells, of which a few hundred are drawn. The pinned columns are always there. Every column needs a width, so one without gets its `min-width`, or 150px."><VirtualColumns /></DemoSection>
    <DemoSection title="One height, or the content's" description="Without `row-height` a row is as tall as what is in it, and long text wraps. With it every row has that height and a cell keeps to one line, ending in an ellipsis."><RowHeight /></DemoSection>
    <DemoSection title="Filters and menus" description="With `filter-display=&quot;menu&quot;`, a column with `filter` draws a button in its header that opens its filter panel. The kind follows the values: text, numbers and dates get two conditions joined by And or Or, compared in the way you choose; `filter=&quot;set&quot;` lists the column's values to tick, with a search for long lists — given as `{ label, value }` or named by `filter-label` when the values are codes, and drawn by the `#filteroption` slot, here as the same tags the cells use. `column-menu` adds a menu to each header — sort, pin, hide, reset — and `context-menu` one on a right click over a cell, here with a command of the page's own before Copy, Copy row and Export."><FilterMenus /></DemoSection>
    <DemoSection title="Like a spreadsheet" description="`cell-selection` lets you mark a block of cells: drag over them, or hold Shift with the arrows, Ctrl+A for all. Ctrl+C copies the block as a spreadsheet does and Ctrl+V pastes one in — every value read as the kind the cell holds and checked by its column — while Delete empties it, all as one step for Ctrl+Z. `fill-handle` puts a square at the block's corner: drag it down or across and numbers that step go on stepping. The status bar adds the block up, `range-change` hands it to the chart below, and `exportExcel()` writes a real workbook, numbers still numbers."><RangeSheet /></DemoSection>
    <DemoSection title="Groups inside groups" description="`group-by` takes a list: here the rows gather by region, then by country, each heading stepping in. A column with `aggregate` works a value out over each group's rows — `sum`, `avg`, `min`, `max`, `count`, or a function of your own — and draws it under the column, through the `#aggregate` slot when you format it. `status-bar` counts the rows; `expandAll()` and `collapseAll()` open and shut every group."><GroupTotals /></DemoSection>
    <DemoSection title="A report, with what each column means" description="A column with a `description` (and a `formula`, or a `#description` slot) draws an info button by its header that opens it — by a click, a tap or the keyboard. The `'dictionary'` panel of the side bar lists every column, hidden ones too, with what it holds and how it is worked out, found by a search. `toolbar` puts the tools that apply over the grid: the data dictionary, an Excel export, how close the rows sit (`v-model:size`) and the columns panel. The paginator takes `PageInput` and `RowsPerPageLabel` to read as a report's does. A column with `:visible=&quot;false&quot;` starts hidden, ready to be shown from the panel, and `state-key` keeps what the reader arranged — columns, sort, page size, density — for the next visit."><Report /></DemoSection>
    <DemoSection title="A side bar" description="`side-bar` puts panels along the grid's side, opened from their tabs. The columns panel lists every column — tick one to show or hide it, search the list, or drag a column by its handle (Ctrl with an arrow on the keyboard) into another place. The filters panel holds each column's filter, open one at a time, with a button to clear them all. `side-bar-open` says which panel starts open; a list such as `['columns']` keeps only some."><SideBar /></DemoSection>
    <DemoSection title="A pivot" description="`pivot` turns the rows about: the values of its `rows` fields down the side, the values of its `columns` fields across the top in groups inside groups, and in each cell its `values` worked out over the rows that meet there, a sum unless an `aggregate` says otherwise. The answer is rows and columns like any others — sort a column of the pivot, page through it, export it. With `'pivot'` in `side-bar`, the reader builds it: drag a field into Rows, Columns or Values (or tick it, or send it from its menu), say how a value is worked out, and switch the pivot off to see the rows again; `v-model:pivot` keeps what they built. Switch between the rows and two pivots of them."><Pivot /></DemoSection>
    <DemoSection title="A tree" description="`tree-data` names the field each row's rows are in (or a function that finds them): the grid becomes a tree grid, each row's rows under it with a toggle, and `v-model:expanded-tree` holds the open ones. Sorting orders the rows beside one another, and a search keeps what matches with the folders above it, opening the way down — try “vue”. From the keyboard, the right and left arrows open and shut a row."><TreeFiles /></DemoSection>
    <DemoSection title="Rows you drag" description="A column with `row-drag` draws a handle: drag a row by it to another place, or focus it and press Ctrl with an arrow. The grid hands the rows back in their new order with `row-reorder` and leaves keeping them to you, since they are yours."><RowDrag /></DemoSection>
    <DemoSection title="Cells you edit" description="A column with `editable` can be changed where it stands. Double-click a cell, or move to it with the arrows and press Enter, F2 or just start typing; Enter keeps the value, Tab keeps it and goes on to the next cell, Escape drops it. The box follows the value: a number is read in your own decimals, a date gets a date input, a boolean a checkbox. `validate` refuses a value with a message — try a blank name or a negative stock — and the `#editor` slot draws an editor of your own, as Category does. Ctrl+Z and Ctrl+Y undo and redo; `undo-redo` turns them off."><EditCells /></DemoSection>
    <DemoSection title="Rows edited whole" description="`edit-mode=&quot;row&quot;` opens every editable cell of a row at once, and saves or drops them together, so a row is never half changed. A column with `row-editor` draws the buttons: Edit, then Save and Cancel. Enter saves, Escape cancels; a refused value keeps the row open."><EditRows /></DemoSection>
    <DemoSection title="Columns the reader arranges" description="Drag a header to move a column, or hold Ctrl (⌘) and press an arrow. Drag the edge of a header to set its width — the handle is in the tab order, so the arrow keys do it too, and Shift makes bigger steps. Name and Balance are pinned to the edges and stay while the rest scrolls sideways. The button opens the list of columns. Everything the reader does is one object, `columnLayout`, which an application can store and hand back."><ArrangedColumns /></DemoSection>
    <DemoSection title="Two tables, one set of columns" description="`group` is a name two tables share: rearrange a column in either and both follow, and scrolling one sideways scrolls the other. The rows are each table's own — here, this quarter above last quarter."><SharedColumns /></DemoSection>
    <DemoSection title="Grouped, the way a base is read" description="`group-by` gathers the rows by a field and puts a heading over each run, with its count and a toggle. It happens after the query, so sorting and filtering still decide which rows there are — and the rows are gathered by value rather than by adjacency, so sorting by another column keeps each group together and sorts inside it. `v-model:collapsedGroups` is what the reader shut, which an application can store."><GroupedRows /></DemoSection>
    <DemoSection title="Rows that open" description="A column with `expander` draws the button that opens a row, and the `#expansion` slot draws what opens under it, across the whole width — here the lines of an order. The button says whether its row is open and which region it controls. `v-model:expandedRows` is the keys of the open rows, by `data-key`, so an application can open one itself or remember them."><RowDetails /></DemoSection>
    <DemoSection title="From a data source" description="The rows come from `createDataSource({ load })`, a stand-in for a server that answers in 450 ms. The table asks it for one page at a time with the sort and the search; a slow answer that arrives after a newer one is thrown away."><DataSource /></DemoSection>
    <DemoSection title="Export to CSV" description="`exportCSV()` hands the reader a file of every row the filters let through, in the columns and order on show — or of the page, or of the selection. `exportValue` writes a column its own way (here a date as the ISO day), a value that would run as a formula in a spreadsheet is defused, and the file opens in Excel with its accents intact. `toCSV()` returns the text instead."><ExportCsv /></DemoSection>
    <DemoSection title="Empty and loading"><EmptyAndLoading /></DemoSection>
    <DemoSection title="Layout: a trading desk" description="Dense and live: small cells with grid lines, an instrument pinned on the left, columns gathered under Price and Session, and rows of one height drawn as they scroll into view. A tenth of the quotes change every second — pause it, sort by a column, and the order holds."><LayoutTrading /></DemoSection>
    <DemoSection title="Layout: a contact list" description="Roomy, for reading people rather than numbers: large rows, an avatar, and the company and email under each name, the stage as a tag, a search in the header and pages of six."><LayoutContacts /></DemoSection>
    <DemoSection title="Layout: a panel it fills" description="`scroll-height=&quot;flex&quot;` lets the grid take the height its panel gives it: the toolbar stays on top, a status bar below says how many orders the search lets through, how many are selected and what they add up to, and five thousand orders scroll between them."><LayoutFill /></DemoSection>
    <DemoSection title="Layout: stock, by category" description="Rows gathered by category, the stock on hand drawn as a bar against capacity, and the totals of whatever the search lets through pinned under the rows."><LayoutInventory /></DemoSection>
    <DemoSection title="Loading as skeleton rows" description="`loading-mode=&quot;skeleton&quot;` draws the wait as placeholder rows in the table's own cells — the same padding, size, alignment and pinned columns — so nothing moves when the rows arrive. There are as many as the page holds, or `skeleton-rows`. A column draws its own placeholder with the `#skeleton` slot, as the name does here; the others draw a bar a line tall, and the selection column the box its checkbox will be."><SkeletonLoading /></DemoSection>
</template>
