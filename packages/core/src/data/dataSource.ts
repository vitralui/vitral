import { queryData, type LoadOptions, type LoadResult } from './query';

export interface DataSourceOptions<T> {
    /** Local rows, filtered, sorted and paged in memory. */
    data?: readonly T[];
    /** A remote loader that receives the same options and answers with one page and a total. */
    load?: (options: LoadOptions) => Promise<LoadResult<T>> | LoadResult<T>;
}

export interface DataSource<T> {
    readonly remote: boolean;
    load(options: LoadOptions): Promise<LoadResult<T>>;
}

/**
 * One interface over in-memory arrays and server endpoints, in the manner of
 * DevExtreme's DataSource: a table, list or tree reads through it and never
 * learns which of the two it has.
 */
export function createDataSource<T>(source: readonly T[] | DataSourceOptions<T>): DataSource<T> {
    const options: DataSourceOptions<T> = Array.isArray(source) ? { data: source as readonly T[] } : (source as DataSourceOptions<T>);
    if (options.load) {
        const load = options.load;
        return { remote: true, load: async (query) => load(query) };
    }
    const data = options.data ?? [];
    return { remote: false, load: async (query) => queryData(data, query) };
}
