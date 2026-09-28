<script setup lang="ts">
import { QRCode } from '@vitral/vue';
</script>

<template>
    <div style="display: flex; flex-wrap: wrap; gap: 1.5rem; align-items: end">
        <QRCode value="WIFI:T:WPA;S:Vitral Guest;P:stained-glass;;" size="6rem" label="Wi-Fi: Vitral Guest" />
        <QRCode value="WIFI:T:WPA;S:Vitral Guest;P:stained-glass;;" size="8rem" color="#1e3a8a" background="#eff6ff" label="Wi-Fi: Vitral Guest" />
        <QRCode value="WIFI:T:WPA;S:Vitral Guest;P:stained-glass;;" size="10rem" color="#14532d" :margin="2" label="Wi-Fi: Vitral Guest" />
    </div>
</template>
