<template>
  <Card>
    <CardContent class="space-y-4 py-4">
      <div class="flex items-center justify-between">
        <h3 class="font-medium">{{ $t("groups_projects") }}</h3>
        <Button
          v-if="permissions.canManageProjects"
          variant="outline"
          @click="open = true"
        >
          {{ $t("groups_manage_projects") }}
        </Button>
      </div>

      <ul v-if="group.projects.length" class="divide-y rounded-lg border">
        <li
          v-for="project in group.projects"
          :key="project.id"
          class="flex items-center justify-between px-4 py-3"
        >
          <span>{{ project.name }}</span>
        </li>
      </ul>
      <p v-else class="py-8 text-center text-sm text-muted-foreground">
        {{ $t("groups_empty") }}
      </p>

      <ManageProjectsModal
        v-model:open="open"
        :group="group"
        @saved="emit('changed')"
      />
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import ManageProjectsModal from "@/components/groups/ManageProjectsModal.vue";
import type { Group } from "@/contracts/group";
import type { GroupPermissions } from "@/composables/useGroupPermissions";

defineProps<{ group: Group; permissions: GroupPermissions }>();
const emit = defineEmits<{ (event: "changed"): void }>();

const open = ref(false);
</script>
