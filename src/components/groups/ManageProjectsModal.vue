<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent class="max-h-[90vh] overflow-y-auto sm:max-w-[560px]">
      <DialogHeader>
        <DialogTitle>{{ $t("groups_manage_projects") }}</DialogTitle>
      </DialogHeader>

      <div class="space-y-2">
        <Label>{{ $t("groups_projects") }}</Label>
        <div class="max-h-72 space-y-2 overflow-y-auto rounded-lg border p-3">
          <template v-if="loadingProjects">
            <Skeleton v-for="n in 5" :key="n" class="h-5 w-full" />
          </template>
          <template v-else>
            <div
              v-for="project in projects"
              :key="project.id"
              class="flex items-center gap-2"
            >
              <Checkbox
                :id="`manage-project-${project.id}`"
                :checked="selected.includes(project.id)"
                @update:checked="toggle(project.id, $event)"
              />
              <Label
                :for="`manage-project-${project.id}`"
                class="cursor-pointer font-normal"
              >
                {{ project.name }}
              </Label>
            </div>
            <p v-if="!projects.length" class="text-sm text-muted-foreground">
              {{ $t("groups_empty") }}
            </p>
          </template>
        </div>
        <p class="text-xs text-muted-foreground">
          {{ $t("groups_select_projects_hint") }}
        </p>
        <p v-if="errorMessage" class="text-sm text-destructive">
          {{ errorMessage }}
        </p>
      </div>

      <DialogFooter>
        <Button
          type="button"
          variant="ghost"
          @click="emit('update:open', false)"
        >
          {{ $t("groups_cancel") }}
        </Button>
        <Button
          type="button"
          :disabled="saving || !selected.length"
          @click="submit"
        >
          {{ $t("groups_save") }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { toast } from "vue-sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useGroupsStore } from "@/stores/groups";
import { useAvailableProjects } from "@/composables/useAvailableProjects";
import { normalizeApiError } from "@/lib/apiError";
import type { Group } from "@/contracts/group";

const props = defineProps<{ open: boolean; group: Group }>();
const emit = defineEmits<{
  (event: "update:open", value: boolean): void;
  (event: "saved"): void;
}>();

const { t } = useI18n();
const groupsStore = useGroupsStore();
const {
  projects,
  loading: loadingProjects,
  fetchProjects,
} = useAvailableProjects();

const selected = ref<number[]>([]);
const saving = ref(false);
const errorMessage = ref("");

watch(
  () => props.open,
  (value) => {
    if (!value) return;
    selected.value = props.group.projects.map((project) => project.id);
    errorMessage.value = "";
    fetchProjects();
  },
);

function toggle(projectId: number, checked: boolean | "indeterminate") {
  if (checked === true) {
    if (!selected.value.includes(projectId)) selected.value.push(projectId);
  } else {
    selected.value = selected.value.filter((id) => id !== projectId);
  }
  errorMessage.value = "";
}

async function submit() {
  saving.value = true;
  try {
    await groupsStore.replaceProjects(props.group.id, {
      project_ids: [...selected.value],
    });
    toast(t("groups_projects_saved"));
    emit("saved");
    emit("update:open", false);
  } catch (error) {
    errorMessage.value =
      normalizeApiError(error).message ?? t("api_errors.generic");
  } finally {
    saving.value = false;
  }
}
</script>
