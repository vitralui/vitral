import type { BaseProps } from '../../base/types';

export type PaginatorTemplateItem = 'FirstPageLink' | 'PrevPageLink' | 'PageLinks' | 'NextPageLink' | 'LastPageLink' | 'RowsPerPageDropdown' | 'CurrentPageReport';

export interface PaginatorProps extends BaseProps {
    /** Rows in the whole data, across pages. */
    totalRecords?: number;
    /** Choices for the rows-per-page select; it is left out without them. */
    rowsPerPageOptions?: number[];
    /** How many page links to show around the current one. */
    pageLinkSize?: number;
    /** The pieces to render, in order — a list, or a space-separated string. */
    template?: PaginatorTemplateItem[] | string;
    /** `{first}`, `{last}`, `{total}`, `{page}`, `{pageCount}`, `{rows}`. Defaults to the locale's `pageReport`. */
    currentPageReportTemplate?: string;
    /** Render even when everything fits on one page. */
    alwaysShow?: boolean;
}

export interface PaginatorPageEvent {
    /** 0-based. */
    page: number;
    first: number;
    rows: number;
    pageCount: number;
}

export type PaginatorEmits = {
    page: [event: PaginatorPageEvent];
};

export interface PaginatorSlots {
    /** Content before the controls — a summary, an export button. */
    start?: (props: PaginatorPageEvent) => unknown;
    /** Content after the controls. */
    end?: (props: PaginatorPageEvent) => unknown;
}
