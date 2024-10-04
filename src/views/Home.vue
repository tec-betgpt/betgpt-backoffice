<template>
  <div>
    <h1>Bem-vindo ao Dashboard {{ authStore.user.first_name }}!</h1>
    <p>Somente usuários autenticados podem ver essa página.</p>
  </div>
</template>

<script setup>
import { useAuthStore } from "@/stores/auth";

const authStore = useAuthStore();

console.log("Usuário autenticado:", authStore.user);
</script>
