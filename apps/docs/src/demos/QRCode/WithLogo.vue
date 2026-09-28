<script setup lang="ts">
import { QRCode } from '@vitral/vue';

// The Vitral mark, as the site draws it; any image the page can load works.
const logo =
    'data:image/svg+xml;utf8,' +
    encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2563eb"/><stop offset=".5" stop-color="#3b82f6"/><stop offset="1" stop-color="#06b6d4"/></linearGradient></defs><rect width="32" height="32" rx="8" fill="url(#g)"/><path d="M9 9h4l3 9 3-9h4l-5.5 14h-3z" fill="#fff"/></svg>'
    );
</script>

<template>
    <div style="display: flex; flex-wrap: wrap; gap: 1.5rem; align-items: end">
        <QRCode value="https://vitral.dev/components/qrcode" :image="logo" size="11rem" />
        <QRCode value="https://vitral.dev/components/qrcode" :image="logo" :image-size="0.3" size="11rem" color="#1e3a8a" />
    </div>
</template>
