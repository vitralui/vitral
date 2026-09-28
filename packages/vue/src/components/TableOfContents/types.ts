import type { BaseProps } from '../../base/types';

export interface TableOfContentsItem {
    /** The id of the heading it goes to. */
    id: string;
    label: string;
    /** Depth, 1 for the top; read from the heading's tag when the outline is read from the page. */
    level?: number;
}

export interface TableOfContentsProps extends BaseProps {
    /** The outline, when you have it; otherwise it is read from `source`. */
    items?: TableOfContentsItem[];
    /** Where to read headings from: a selector or an element. Defaults to the document. */
    source?: string | HTMLElement;
    /** Which headings to read, by selector. Defaults to `'h2, h3'`. */
    selector?: string;
    /** Pixels from the top of the view where a heading counts as reached: the height of a sticky header. Defaults to 80. */
    offset?: number;
    /** A heading over the list; the locale's "On this page" otherwise. `false` for none. */
    title?: string | false;
    /** Scroll to a heading smoothly when its link is followed. Defaults to true. */
    smooth?: boolean;
}

export type TableOfContentsEmits = {
    /** A link was followed. */
    navigate: [id: string];
};
