<template>
  <div class="w-full p-10 pb-16 max-[450px]:p-2">
    <div
      class="mb-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"
    >
      <div class="space-y-0.5">
        <h2 class="text-2xl font-bold tracking-tight">
          {{ $t("groups_title") }}
        </h2>
        <p class="text-muted-foreground">{{ $t("groups_subtitle") }}</p>
      </div>
      <Button @click="createOpen = true">{{ $t("groups_new") }}</Button>
    </div>

    <div
      v-if="groupsStore.loading"
      class="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
    >
      <Skeleton v-for="n in 6" :key="n" class="h-40 w-full" />
    </div>

    <div
      v-else-if="groupsStore.groups.length"
      class="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
    >
      <GroupCard
        v-for="group in groupsStore.groups"
        :key="group.id"
        :group="group"
        :role="roleFor(group)"
      />
    </div>

    <Card v-else>
      <CardContent class="flex flex-col items-center gap-4 py-16 text-center">
        <p class="text-muted-foreground">{{ $t("groups_empty") }}</p>
        <Button @click="createOpen = true">{{ $t("groups_new") }}</Button>
      </CardContent>
    </Card>

    <CreateGroupModal v-model:open="createOpen" @created="onCreated" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import GroupCard from "@/components/groups/GroupCard.vue";
import CreateGroupModal from "@/components/groups/CreateGroupModal.vue";
import { useGroupsStore } from "@/stores/groups";
import { useAuthStore } from "@/stores/auth";
import { resolveGroupPermissions } from "@/composables/useGroupPermissions";
import { useScreenContext } from "@/composables/useScreenContext";
import { showApiErrorToast } from "@/lib/apiErrorFeedback";
import type { Group, GroupRole } from "@/contracts/group";

const groupsStore = useGroupsStore();
const authStore = useAuthStore();
const createOpen = ref(false);

const currentUserId = computed<number | null>(
  () => (authStore.user as any)?.id ?? null,
);

function roleFor(group: Group): GroupRole | null {
  return resolveGroupPermissions(group, currentUserId.value).role;
}

function onCreated() {
  groupsStore.fetchGroups().catch(showApiErrorToast);
}

onMounted(() => {
  groupsStore.fetchGroups().catch(showApiErrorToast);
});

useScreenContext(
  "Grupos - Lista de grupos do usuário (owner ou membro)",
  () => ({
    groups_count: groupsStore.groups.length,
    groups_preview: groupsStore.groups
      .slice(0, 10)
      .map((group) => group.name)
      .join(", "),
  }),
  "/v1/groups",
);
</script>
