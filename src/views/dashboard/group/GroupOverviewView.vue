<template>
  <div class="space-y-4">
    <GroupConsolidatedSummary :group="group" />
    <Card>
      <CardContent class="space-y-2 py-6">
        <p>
          <strong>{{ $t("groups_name") }}:</strong> {{ group.name }}
        </p>
        <p>
          <strong>{{ $t("groups_description") }}:</strong>
          {{ group.description || "—" }}
        </p>
        <p>
          <strong>{{ $t("groups_projects") }}:</strong>
          {{ group.projects.length }}
        </p>
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { Card, CardContent } from "@/components/ui/card";
import GroupConsolidatedSummary from "@/components/groups/GroupConsolidatedSummary.vue";
import type { Group } from "@/contracts/group";

defineProps<{ group: Group }>();
</script>
