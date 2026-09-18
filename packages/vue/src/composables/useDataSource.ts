import type { DataSource, LoadOptions } from '@vitral/core';
import { getCurrentScope, onScopeDispose, ref, shallowRef, toValue, watch, type MaybeRefOrGetter } from 'vue';

export interface UseDataSourceOptions {
    /** Load as soon as the composable is called. On by default. */
    immediate?: boolean;
}

/**
 * Reads a core `DataSource` reactively, the DevExtreme way: hand it the load
 * options (which page, sorted how, filtered how) and it answers with the page,
 * the total and whether it is still loading. Local and remote sources look the
 * same from here.
 *
 * Every change to the source or the options loads again. A response that
 * arrives after a newer request was made is dropped, so a slow first page can
 * never overwrite the page the user has moved on to.
 */
export function useDataSource<T = unknown>(
    source: MaybeRefOrGetter<DataSource<T> | null | undefined>,
    options: MaybeRefOrGetter<LoadOptions> = {},
    settings: UseDataSourceOptions = {}
) {
    const items = shallowRef<T[]>([]);
    const total = ref(0);
    const loading = ref(false);
    const error = shallowRef<unknown>(null);
    let ticket = 0;

    async function reload(): Promise<void> {
        const dataSource = toValue(source);
        const id = ++ticket;
        if (!dataSource) {
            items.value = [];
            total.value = 0;
            loading.value = false;
            return;
        }
        loading.value = true;
        error.value = null;
        try {
            const result = await dataSource.load({ ...toValue(options) });
            if (id !== ticket) return;
            items.value = result.items;
            total.value = result.total;
        } catch (e) {
            if (id !== ticket) return;
            error.value = e;
        } finally {
            if (id === ticket) loading.value = false;
        }
    }

    watch([() => toValue(source), () => toValue(options)], () => void reload(), { deep: true, immediate: settings.immediate ?? true });

    // Anything still in flight when the owner goes away is ignored.
    if (getCurrentScope()) onScopeDispose(() => void ticket++);

    return { items, total, loading, error, reload };
}
