<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent class="max-h-[90vh] overflow-y-auto sm:max-w-[560px]">
      <DialogHeader>
        <DialogTitle class="flex items-center gap-2">
          {{ group?.name ?? $t("groups_title") }}
          <Badge v-if="group" variant="secondary">
            {{
              $t(
                group.status === "archived"
                  ? "groups_status_archived"
                  : "groups_status_active",
              )
            }}
          </Badge>
        </DialogTitle>
        <DialogDescription v-if="group?.description">
          {{ group.description }}
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-6">
        <section class="space-y-2">
          <h4 class="text-sm font-medium">
            {{ $t("groups_linked_projects") }}
          </h4>
          <ul v-if="group?.projects.length" class="divide-y rounded-lg border">
            <li
              v-for="project in group.projects"
              :key="project.id"
              class="px-4 py-2 text-sm"
            >
              {{ project.name }}
            </li>
          </ul>
          <p v-else class="text-sm text-muted-foreground">
            {{ $t("groups_empty") }}
          </p>
        </section>

        <section class="space-y-2">
          <h4 class="text-sm font-medium">{{ $t("groups_members") }}</h4>

          <div v-if="loading" class="space-y-2">
            <Skeleton v-for="n in 3" :key="n" class="h-10 w-full" />
          </div>

          <ul v-else-if="members.length" class="divide-y rounded-lg border">
            <li
              v-for="member in members"
              :key="member.id"
              class="flex items-center justify-between gap-3 px-4 py-2"
            >
              <div class="min-w-0">
                <p class="truncate text-sm font-medium">
                  {{
                    member.user?.name ??
                    member.user?.email ??
                    `#${member.user_id}`
                  }}
                </p>
                <p class="truncate text-xs text-muted-foreground">
                  {{ member.user?.email }}
                </p>
              </div>
              <div class="flex shrink-0 items-center gap-2">
                <Badge variant="outline">
                  {{ $t(`groups_role_${member.role}`) }}
                </Badge>
                <Badge variant="secondary">
                  {{
                    $t(
                      member.access_projects
                        ? "groups_access_projects"
                        : "groups_access_view_only",
                    )
                  }}
                </Badge>
              </div>
            </li>
          </ul>

          <p v-else class="text-sm text-muted-foreground">
            {{ $t("groups_empty") }}
          </p>
        </section>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="emit('update:open', false)">
          {{ $t("groups_close") }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { listMembers } from "@/services/groups";
import { showApiErrorToast } from "@/lib/apiErrorFeedback";
import type { Group } from "@/contracts/group";
import type { GroupMember } from "@/contracts/groupMember";

const props = defineProps<{ open: boolean; group: Group | null }>();
const emit = defineEmits<{ (event: "update:open", value: boolean): void }>();

const members = ref<GroupMember[]>([]);
const loading = ref(false);

async function loadMembers() {
  if (!props.group) return;
  loading.value = true;
  try {
    members.value = await listMembers(props.group.id);
  } catch (error) {
    members.value = [];
    showApiErrorToast(error);
  } finally {
    loading.value = false;
  }
}

watch(
  () => props.open,
  (value) => {
    if (value) {
      members.value = [];
      loadMembers();
    }
  },
);

watch(
  () => props.group?.id,
  () => {
    if (props.open) loadMembers();
  },
);
</script>
