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
            <p v-if="!projects.length" class="text-sm text-muted-foreground">
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
const { projects } = useAvailableProjects();

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
    }
  },
);

function toggleProject(projectId: number, checked: boolean | "indeterminate") {
  if (checked === true) {
    if (!form.project_ids.includes(projectId)) {
      form.project_ids = [...form.project_ids, projectId];
    }
  } else {
    form.project_ids = form.project_ids.filter((id) => id !== projectId);
  }
  errorMessage.value = "";
}

async function submit() {
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
