<script setup lang="ts">
import { Grid, GridItem, InputText } from '@vitral/vue';
</script>

<template>
    <Grid class="form" rows="Auto,Auto,Auto" columns="Auto,*" :row-spacing="10" :column-spacing="16">
        <GridItem as="label" for="grid-name" class="label">Name</GridItem>
        <GridItem :column="1"><InputText id="grid-name" fluid placeholder="Ada Lovelace" /></GridItem>
        <GridItem as="label" for="grid-email" :row="1" class="label">Email address</GridItem>
        <GridItem :row="1" :column="1"><InputText id="grid-email" type="email" fluid placeholder="ada@example.com" /></GridItem>
        <GridItem as="label" for="grid-city" :row="2" class="label">City</GridItem>
        <GridItem :row="2" :column="1"><InputText id="grid-city" fluid placeholder="London" /></GridItem>
    </Grid>
</template>

<style scoped>
.form {
    width: 100%;
    max-width: 32rem;
    align-items: center;
}

.label {
    font-size: 0.8125rem;
    font-weight: 500;
}
</style>
