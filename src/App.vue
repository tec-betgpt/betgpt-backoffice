<template>
  <component :is="layout">
    <router-view></router-view>
  </component>
</template>

<script setup>
import { computed } from "vue";
import { useRoute } from "vue-router";
import DefaultLayout from "@/layouts/default.vue";
import { ref, onMounted } from "vue";
import { storeToRefs } from "pinia";

const route = useRoute();

const layout = computed(() => route.meta.layout || DefaultLayout);

onMounted(() => {});
</script>

<style></style>
