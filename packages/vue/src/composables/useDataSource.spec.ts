import { createDataSource, type LoadResult } from '@vitral/core';
import { describe, expect, it } from 'vitest';
import { effectScope, nextTick, ref } from 'vue';
import { useDataSource } from './useDataSource';

const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('useDataSource', () => {
    it('reads local rows through the data source, paged and counted', async () => {
        const scope = effectScope();
        const rows = Array.from({ length: 23 }, (_, i) => ({ id: i }));
        const state = scope.run(() => useDataSource(createDataSource(rows), { first: 20, rows: 10 }))!;
        expect(state.loading.value).toBe(true);
        await settle();
        expect(state.items.value).toEqual([{ id: 20 }, { id: 21 }, { id: 22 }]);
        expect(state.total.value).toBe(23);
        expect(state.loading.value).toBe(false);
        scope.stop();
    });

    it('loads again when the options change and drops a response that arrives late', async () => {
        const pending: (() => void)[] = [];
        const source = createDataSource<number>({
            load: (o) => new Promise<LoadResult<number>>((resolve) => pending.push(() => resolve({ items: [o.first ?? 0], total: 100 })))
        });
        const options = ref({ first: 0, rows: 10 });
        const scope = effectScope();
        const state = scope.run(() => useDataSource(source, options))!;
        options.value = { first: 10, rows: 10 };
        await nextTick();
        await settle();
        expect(pending).toHaveLength(2);
        pending[1]!();
        await settle();
        expect(state.items.value).toEqual([10]);
        pending[0]!();
        await settle();
        expect(state.items.value).toEqual([10]);
        expect(state.loading.value).toBe(false);
        scope.stop();
    });

    it('reports a failed load and clears it on the next success', async () => {
        let fail = true;
        const source = createDataSource<number>({ load: () => (fail ? Promise.reject(new Error('offline')) : { items: [1], total: 1 }) });
        const scope = effectScope();
        const state = scope.run(() => useDataSource(source))!;
        await settle();
        expect((state.error.value as Error).message).toBe('offline');
        fail = false;
        await state.reload();
        expect(state.error.value).toBeNull();
        expect(state.items.value).toEqual([1]);
        scope.stop();
    });
});
