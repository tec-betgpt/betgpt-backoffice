<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent class="sm:max-w-[480px]">
      <DialogHeader>
        <DialogTitle>
          {{ $t("groups_invite_person") }} — {{ group.name }}
        </DialogTitle>
      </DialogHeader>

      <form class="space-y-4" @submit.prevent="submit">
        <div class="space-y-2">
          <Label for="invite-email">{{ $t("groups_email") }} *</Label>
          <Input
            id="invite-email"
            v-model="form.email"
            type="email"
            placeholder="maria@ex.com"
          />
        </div>

        <div class="space-y-2">
          <Label>{{ $t("groups_role") }} *</Label>
          <Select v-model="form.role">
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="admin">
                {{ $t("groups_role_admin") }}
              </SelectItem>
              <SelectItem value="editor">
                {{ $t("groups_role_editor") }}
              </SelectItem>
              <SelectItem value="viewer">
                {{ $t("groups_role_viewer") }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div class="flex items-start gap-2">
          <Checkbox
            id="invite-access-projects"
            :checked="form.access_projects"
            @update:checked="form.access_projects = $event === true"
          />
          <div class="grid gap-1">
            <Label
              for="invite-access-projects"
              class="cursor-pointer font-normal"
            >
              {{ $t("groups_give_project_access") }}
            </Label>
            <p class="text-xs text-muted-foreground">
              {{ $t("groups_give_project_access_hint") }}
            </p>
          </div>
        </div>

        <p v-if="errorMessage" class="text-sm text-destructive">
          {{ errorMessage }}
        </p>

        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            @click="emit('update:open', false)"
          >
            {{ $t("groups_cancel") }}
          </Button>
          <Button type="submit" :disabled="saving || !form.email">
            {{ $t("groups_send") }}
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
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useGroupsStore } from "@/stores/groups";
import { normalizeApiError } from "@/lib/apiError";
import type { Group, GroupRole } from "@/contracts/group";

const props = defineProps<{ open: boolean; group: Group }>();
const emit = defineEmits<{
  (event: "update:open", value: boolean): void;
  (event: "invited"): void;
}>();

const { t } = useI18n();
const groupsStore = useGroupsStore();

const form = reactive<{
  email: string;
  role: Exclude<GroupRole, "owner">;
  access_projects: boolean;
}>({ email: "", role: "viewer", access_projects: false });

const saving = ref(false);
const errorMessage = ref("");

watch(
  () => props.open,
  (value) => {
    if (!value) return;
    form.email = "";
    form.role = "viewer";
    form.access_projects = false;
    errorMessage.value = "";
  },
);

async function submit() {
  saving.value = true;
  try {
    await groupsStore.createInvitation(props.group.id, {
      email: form.email,
      role: form.role,
      access_projects: form.access_projects,
    });
    toast(t("groups_invite_sent"));
    emit("invited");
    emit("update:open", false);
  } catch (error) {
    errorMessage.value =
      normalizeApiError(error).message ?? t("api_errors.generic");
  } finally {
    saving.value = false;
  }
}
</script>
