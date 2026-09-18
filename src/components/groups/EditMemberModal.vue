<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent class="sm:max-w-[460px]">
      <DialogHeader>
        <DialogTitle>{{ member.user?.name ?? member.user?.email }}</DialogTitle>
      </DialogHeader>

      <form class="space-y-4" @submit.prevent="submit">
        <div class="space-y-2">
          <Label>{{ $t("groups_role") }} *</Label>
          <Select v-model="role">
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
            id="member-access-projects"
            :checked="accessProjects"
            @update:checked="accessProjects = $event === true"
          />
          <div class="grid gap-1">
            <Label
              for="member-access-projects"
              class="cursor-pointer font-normal"
            >
              {{ $t("groups_give_project_access") }}
            </Label>
            <p class="text-xs text-muted-foreground">
              {{ $t("groups_give_project_access_hint") }}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            @click="emit('update:open', false)"
          >
            {{ $t("groups_cancel") }}
          </Button>
          <Button type="submit" :disabled="groupsStore.saving">
            {{ $t("groups_save") }}
          </Button>
        </DialogFooter>
      </form>
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useGroupsStore } from "@/stores/groups";
import { showApiErrorToast } from "@/lib/apiErrorFeedback";
import type { GroupMember } from "@/contracts/groupMember";
import type { GroupRole } from "@/contracts/group";

const props = defineProps<{
  open: boolean;
  groupId: number;
  member: GroupMember;
}>();
const emit = defineEmits<{
  (event: "update:open", value: boolean): void;
  (event: "updated"): void;
}>();

const { t } = useI18n();
const groupsStore = useGroupsStore();

const role = ref<Exclude<GroupRole, "owner">>("viewer");
const accessProjects = ref(false);

watch(
  () => props.open,
  (value) => {
    if (!value) return;
    role.value = props.member.role === "owner" ? "admin" : props.member.role;
    accessProjects.value = props.member.access_projects;
  },
);

async function submit() {
  try {
    await groupsStore.updateMember(props.groupId, props.member.user_id, {
      role: role.value,
      access_projects: accessProjects.value,
    });
    toast(t("groups_member_updated"));
    emit("updated");
    emit("update:open", false);
  } catch (error) {
    showApiErrorToast(error);
  }
}
</script>
