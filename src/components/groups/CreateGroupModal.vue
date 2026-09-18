<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent class="max-h-[90vh] overflow-y-auto sm:max-w-[560px]">
      <DialogHeader>
        <DialogTitle>{{ $t("groups_create_title") }}</DialogTitle>
      </DialogHeader>

      <form class="space-y-4" @submit.prevent="submit">
        <div class="space-y-2">
          <Label for="group-name">{{ $t("groups_name") }} *</Label>
          <Input id="group-name" v-model="form.name" placeholder="Empresa X" />
        </div>

        <div class="space-y-2">
          <Label for="group-description">{{ $t("groups_description") }}</Label>
          <Input id="group-description" v-model="form.description" />
        </div>

        <div class="space-y-2">
          <Label>{{ $t("groups_projects") }} *</Label>
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
                  :id="`group-project-${project.id}`"
                  :checked="form.project_ids.includes(project.id)"
                  @update:checked="toggleProject(project.id, $event)"
                />
                <Label
                  :for="`group-project-${project.id}`"
                  class="cursor-pointer font-normal"
                >
                  {{ project.name }}
                </Label>
              </div>
            </template>
            <p
              v-if="!loadingProjects && !projects.length"
              class="text-sm text-muted-foreground"
            >
              {{ $t("groups_empty") }}
            </p>
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
            type="submit"
            :disabled="saving || !form.name || !form.project_ids.length"
          >
            {{ $t("groups_save") }}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { toast } from "vue-sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useGroupsStore } from "@/stores/groups";
import { useAvailableProjects } from "@/composables/useAvailableProjects";
import { normalizeApiError } from "@/lib/apiError";
import type { Group } from "@/contracts/group";

const props = defineProps<{ open: boolean }>();
const emit = defineEmits<{
  (event: "update:open", value: boolean): void;
  (event: "created", group: Group): void;
}>();

const { t } = useI18n();
const groupsStore = useGroupsStore();
const {
  projects,
  loading: loadingProjects,
  fetchProjects,
} = useAvailableProjects();

const form = reactive<{
  name: string;
  description: string;
  project_ids: number[];
}>({ name: "", description: "", project_ids: [] });

const saving = ref(false);
const errorMessage = ref("");

watch(
  () => props.open,
  (value) => {
    if (value) {
      form.name = "";
      form.description = "";
      form.project_ids = [];
      errorMessage.value = "";
      fetchProjects();
    }
  },
);

function toggleProject(projectId: number, checked: boolean | "indeterminate") {
  const next =
    checked === true
      ? [...form.project_ids, projectId].filter(
          (id, index, all) => all.indexOf(id) === index,
        )
      : form.project_ids.filter((id) => id !== projectId);

  const selectedProjects = projects.value.filter((project) =>
    next.includes(project.id),
  );
  const ownerIds = new Set(selectedProjects.map((project) => project.user_id));

  if (ownerIds.size > 1) {
    errorMessage.value = t("groups_same_owner_error");
    return;
  }

  errorMessage.value = "";
  form.project_ids = next;
}

async function submit() {
  if (projects.value.length && errorMessage.value) return;
  saving.value = true;
  try {
    const group = await groupsStore.createGroup({
      name: form.name,
      description: form.description || null,
      project_ids: [...form.project_ids],
    });
    toast(t("groups_created"));
    emit("created", group);
    emit("update:open", false);
  } catch (error) {
    errorMessage.value =
      normalizeApiError(error).message ?? t("api_errors.generic");
  } finally {
    saving.value = false;
  }
}
</script>
