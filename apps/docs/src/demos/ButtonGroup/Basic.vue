<script setup lang="ts">
import { Button, ButtonGroup } from '@vitral/vue';
</script>

<template>
    <ButtonGroup aria-label="Record">
        <Button label="Save" icon="check" />
        <Button label="Delete" icon="trash" />
        <Button label="Cancel" icon="close" />
    </ButtonGroup>
</template>
