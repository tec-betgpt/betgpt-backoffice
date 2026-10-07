<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent class="sm:max-w-[480px]">
      <DialogHeader>
        <DialogTitle>{{ $t("groups_edit_title") }}</DialogTitle>
      </DialogHeader>
      <form class="space-y-4" @submit.prevent="submit">
        <div class="space-y-2">
          <Label for="edit-group-name">{{ $t("groups_name") }} *</Label>
          <Input id="edit-group-name" v-model="form.name" />
        </div>
        <div class="space-y-2">
          <Label for="edit-group-description">
            {{ $t("groups_description") }}
          </Label>
          <Input id="edit-group-description" v-model="form.description" />
        </div>
        <div class="space-y-2">
          <Label>
            {{ $t("groups_status_active") }} /
            {{ $t("groups_status_archived") }}
          </Label>
          <Select v-model="form.status">
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">
                {{ $t("groups_status_active") }}
              </SelectItem>
              <SelectItem value="archived">
                {{ $t("groups_status_archived") }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            @click="emit('update:open', false)"
          >
            {{ $t("groups_cancel") }}
          </Button>
          <Button type="submit" :disabled="groupsStore.saving || !form.name">
            {{ $t("groups_save") }}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { reactive, watch } from "vue";
import { useI18n } from "vue-i18n";
import { toast } from "vue-sonner";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useGroupsStore } from "@/stores/groups";
import { showApiErrorToast } from "@/lib/apiErrorFeedback";
import type { Group, GroupStatus } from "@/contracts/group";

const props = defineProps<{ open: boolean; group: Group }>();
const emit = defineEmits<{
  (event: "update:open", value: boolean): void;
  (event: "updated"): void;
}>();

const { t } = useI18n();
const groupsStore = useGroupsStore();

const form = reactive<{
  name: string;
  description: string;
  status: GroupStatus;
}>({ name: "", description: "", status: "active" });

watch(
  () => props.open,
  (value) => {
    if (!value) return;
    form.name = props.group.name;
    form.description = props.group.description ?? "";
    form.status = props.group.status;
  },
);

async function submit() {
  try {
    await groupsStore.updateGroup(props.group.id, {
      name: form.name,
      description: form.description || null,
      status: form.status,
    });
    toast(t("groups_updated"));
    emit("updated");
    emit("update:open", false);
  } catch (error) {
    showApiErrorToast(error);
  }
}
</script>
