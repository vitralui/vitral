<script setup lang="ts">
import { en, ptBR, type Locale } from '@vitral/core';
import { Column, DataGrid, SelectButton, useVitral, VitralKey, type VitralConfig } from '@vitral/vue';
import { computed, provide, ref } from 'vue';

// A translation is one object: here a Spanish one, made over the English for the words this grid shows.
const es: Locale = {
    ...en,
    code: 'es',
    emptyMessage: 'Sin resultados',
    search: 'Buscar',
    pageReport: '{first}–{last} de {total}',
    rowsPerPage: 'Filas por página',
    pageInput: 'Página',
    pageOfCount: 'de {count}',
    datagrid: {
        ...en.datagrid,
        matchModes: { ...en.datagrid.matchModes, contains: 'Contiene', startsWith: 'Empieza por', equals: 'Igual a', gt: 'Mayor que', lt: 'Menor que' },
        condition: 'Condición',
        filterValue: 'Valor',
        clearFilter: 'Limpiar',
        searchValues: 'Buscar valores',
        selectAll: 'Seleccionar todo',
        columnMenu: 'Opciones de {column}',
        sortAscending: 'Orden ascendente',
        sortDescending: 'Orden descendente',
        clearSort: 'Quitar orden',
        pinColumn: 'Fijar columna',
        fitColumn: 'Ajustar esta columna',
        fitAllColumns: 'Ajustar todas las columnas',
        hideColumn: 'Ocultar columna',
        pickColumns: 'Elegir columnas',
        statusRows: '{count} filas',
        statusFiltered: '{count} de {total} filas',
        statusSelected: '{count} seleccionadas',
        statusSum: 'Suma: {value}'
    }
};

const languages = { en, 'pt-BR': ptBR, es } as Record<string, Locale>;
const app = useVitral();
const code = ref(app.config.locale.code === 'pt-BR' ? 'pt-BR' : 'en');
const locale = computed(() => languages[code.value]!);

// The language for this part of the page only: the application's configuration, with its own locale.
// Everything else — the theme, the pass-through, the layers — still follows the application.
const config = new Proxy(app.config, { get: (target, key) => (key === 'locale' ? locale.value : Reflect.get(target, key)) }) as VitralConfig;
provide(VitralKey, { ...app, config });

const cities = [
    { id: 1, city: 'Buenos Aires', country: 'Argentina', founded: new Date(1536, 1, 2), people: 3_121_707 },
    { id: 2, city: 'Lisboa', country: 'Portugal', founded: new Date(1147, 9, 25), people: 545_796 },
    { id: 3, city: 'Ciudad de México', country: 'México', founded: new Date(1325, 5, 20), people: 9_209_944 },
    { id: 4, city: 'Salvador', country: 'Brasil', founded: new Date(1549, 2, 29), people: 2_418_005 },
    { id: 5, city: 'Montevideo', country: 'Uruguay', founded: new Date(1724, 11, 24), people: 1_319_108 },
    { id: 6, city: 'Porto', country: 'Portugal', founded: new Date(1123, 4, 14), people: 231_962 },
    { id: 7, city: 'Bogotá', country: 'Colombia', founded: new Date(1538, 7, 6), people: 7_907_281 }
];
// Numbers and dates follow the chosen language too.
const count = (value: unknown) => new Intl.NumberFormat(locale.value.code).format(value as number);
const year = (value: unknown) => new Intl.DateTimeFormat(locale.value.code, { year: 'numeric' }).format(value as Date);
</script>

<template>
    <div style="display: flex; flex-direction: column; gap: 0.75rem; width: 100%">
        <SelectButton
            v-model="code"
            :options="[
                { label: 'English', value: 'en' },
                { label: 'Português', value: 'pt-BR' },
                { label: 'Español', value: 'es' }
            ]"
            option-label="label"
            option-value="value"
            size="small"
            :allow-empty="false"
            aria-label="Language"
        />
        <DataGrid
            :value="cities"
            data-key="id"
            aria-label="Cities"
            column-menu
            filter-display="menu"
            status-bar
            selection-mode="multiple"
            paginator
            :rows="5"
            paginator-template="PrevPageLink CurrentPageReport NextPageLink"
            style="width: 100%"
        >
            <Column selection-mode="multiple" />
            <Column field="city" header="City" sortable filter />
            <Column field="country" header="Country" sortable filter="set" />
            <Column field="founded" header="Founded" align="right" sortable :value-formatter="year" />
            <Column field="people" header="People" align="right" sortable filter :value-formatter="count" aggregate="sum" />
        </DataGrid>
    </div>
</template>
