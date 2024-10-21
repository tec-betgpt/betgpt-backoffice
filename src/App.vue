<template>
  <div>
    <div v-if="authStore.loading" class="loading-overlay">
      <div class="loading-content">
        <div class="loading-spinner">
          <div class="spinner"></div>
        </div>
      </div>
    </div>
    <component v-else :is="layout">
      <router-view></router-view>
    </component>
  </div>
</template>

<script setup>
import { computed, onMounted } from "vue";
import { useRoute } from "vue-router";
import DefaultLayout from "@/layouts/default.vue";
import { useAuthStore } from "@/stores/auth";
import { storeToRefs } from "pinia";

const route = useRoute();
const authStore = useAuthStore();
const { loading } = storeToRefs(authStore);

const layout = computed(() => route.meta.layout || DefaultLayout);

onMounted(() => {});
</script>

<style>
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  text-align: center;
}

.loading-spinner {
  width: 24px;
  height: 24px;
  border: 2px solid rgba(0, 0, 0, 0.1);
  border-top-color: #000; /* Cor primária para o spinner */
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
