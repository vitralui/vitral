<script setup lang="ts">
// Everything here is auto-imported by the module: the components under the `Vt`
// prefix, `useTheme`, `useToast` and `Form`.
const name = ref('');
const city = ref(null);
const cities = [
    { name: 'São Paulo', code: 'SP' },
    { name: 'Recife', code: 'REC' }
];

const { isDark, toggleDark } = useTheme();
const toast = useToast();

const series = [{ name: 'Visits', data: [12, 41, 35, 51, 49, 62] }];
</script>

<template>
    <VtToast />
    <main>
        <header>
            <h1>Vitral in Nuxt</h1>
            <VtButton :icon="isDark ? 'sun' : 'moon'" variant="text" :aria-label="isDark ? 'Light' : 'Dark'" @click="toggleDark()" />
        </header>

        <p>
            This page is rendered on the server. Its stylesheets are in the head of the document, the scheme comes from a cookie, and nothing moves when it hydrates.
        </p>

        <section>
            <VtLabel for="name">Name</VtLabel>
            <VtInputText id="name" v-model="name" clearable placeholder="Your name" />

            <VtLabel for="city">City</VtLabel>
            <VtSelect id="city" v-model="city" :options="cities" option-label="name" option-value="code" placeholder="Pick one" />

            <VtButton v-tooltip="'Auto-imported directive'" label="Say hello" icon="check" @click="toast.add({ severity: 'success', summary: `Hello, ${name || 'stranger'}` })" />
        </section>

        <section>
            <VtForm.Root :initial-values="{ email: '' }" @submit="(event: { valid: boolean }) => event.valid && toast.add({ severity: 'info', summary: 'Subscribed' })">
                <VtForm.Field name="email" label="Email" required>
                    <VtInputText type="email" />
                </VtForm.Field>
                <VtForm.Submit label="Subscribe" />
            </VtForm.Root>
        </section>

        <section>
            <!-- A chart measures the element it is in, so it only draws once the page is in a browser. -->
            <VtChart type="area" :series="series" :height="220" />
        </section>
    </main>
</template>

<style>
main {
    max-width: 44rem;
    margin: 0 auto;
    padding: 2rem 1rem 6rem;
    display: grid;
    gap: 1.5rem;
    background: var(--vt-content-background);
    color: var(--vt-text-color);
    min-height: 100vh;
}
header {
    display: flex;
    align-items: center;
    justify-content: space-between;
}
section {
    display: grid;
    gap: 0.75rem;
    justify-items: start;
}
body {
    margin: 0;
    font-family: var(--vt-font-family, system-ui);
    background: var(--vt-content-background);
}
</style>
