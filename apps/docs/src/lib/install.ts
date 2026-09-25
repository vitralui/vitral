import { computed, ref, watch } from 'vue';

/**
 * The package manager the install commands are written for. Picked where a
 * command is shown, and remembered, so a reader on npm reads npm on every page
 * after choosing it once.
 */
export const managers = [
    { id: 'pnpm', add: 'pnpm add' },
    { id: 'npm', add: 'npm install' },
    { id: 'yarn', add: 'yarn add' },
    { id: 'bun', add: 'bun add' }
] as const;

export type Manager = (typeof managers)[number]['id'];

const KEY = 'vitral-docs-manager';

function remembered(): Manager {
    try {
        const value = localStorage.getItem(KEY);
        if (managers.some((entry) => entry.id === value)) return value as Manager;
    } catch {
        /* blocked: pnpm, as the documentation is written */
    }
    return 'pnpm';
}

export const manager = ref<Manager>(typeof window === 'undefined' ? 'pnpm' : remembered());

watch(manager, (value) => {
    try {
        localStorage.setItem(KEY, value);
    } catch {
        /* blocked: the choice lasts as long as the tab does */
    }
});

/** The words before the package: `pnpm add`, `npm install`… */
export const addCommand = computed(() => managers.find((entry) => entry.id === manager.value)!.add);

export const installCommand = (pkg = '@vitral/vue') => `${addCommand.value} ${pkg}`;
