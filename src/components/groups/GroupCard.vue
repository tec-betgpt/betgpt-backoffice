<template>
  <Card class="transition hover:border-primary/50">
    <CardContent class="space-y-3 py-4">
      <div class="flex items-start justify-between gap-2">
        <div class="min-w-0">
          <h3 class="truncate font-semibold">{{ group.name }}</h3>
          <p class="text-sm text-muted-foreground">
            {{ group.projects.length }}
            {{ $t("groups_projects").toLowerCase() }} ·
            {{ $t(statusKey) }}
          </p>
        </div>
        <Badge variant="secondary">{{ $t(roleLabel) }}</Badge>
      </div>
      <div class="flex flex-wrap gap-1">
        <Badge
          v-for="project in group.projects.slice(0, 3)"
          :key="project.id"
          variant="outline"
        >
          {{ project.name }}
        </Badge>
        <Badge v-if="group.projects.length > 3" variant="outline">
          +{{ group.projects.length - 3 }}
        </Badge>
      </div>
      <Button as-child variant="outline" size="sm" class="w-full">
        <router-link :to="{ name: 'groups.show', params: { id: group.id } }">
          {{ $t("groups_overview") }}
        </router-link>
      </Button>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Group, GroupRole } from "@/contracts/group";

const props = defineProps<{
  group: Group;
  role: GroupRole | null;
}>();

const statusKey = computed(() =>
  props.group.status === "archived"
    ? "groups_status_archived"
    : "groups_status_active",
);

const roleLabel = computed(() => {
  if (!props.role) return "";
  return `groups_role_${props.role}`;
});
</script>
