<template>
  <ProjectsTab
    :group="group"
    :permissions="permissions"
    @changed="emit('changed')"
  />
</template>

<script setup lang="ts">
import ProjectsTab from "@/components/groups/ProjectsTab.vue";
import type { Group } from "@/contracts/group";
import type { GroupPermissions } from "@/composables/useGroupPermissions";

defineProps<{ group: Group; permissions: GroupPermissions }>();
const emit = defineEmits<{ (event: "changed"): void }>();
</script>
