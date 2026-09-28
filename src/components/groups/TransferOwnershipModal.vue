<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent class="sm:max-w-[480px]">
      <DialogHeader>
        <DialogTitle>{{ $t("groups_transfer_title") }}</DialogTitle>
        <DialogDescription>
          {{ $t("groups_transfer_description") }}
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-2">
        <Label>{{ $t("groups_transfer_member") }} *</Label>
        <Select v-model="selectedUserId">
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem
              v-for="member in candidates"
              :key="member.user_id"
              :value="String(member.user_id)"
            >
              {{ member.user?.name ?? member.user?.email ?? `#${member.user_id}` }}
            </SelectItem>
          </SelectContent>
        </Select>
        <p v-if="!candidates.length" class="text-sm text-muted-foreground">
          {{ $t("groups_empty") }}
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
          :disabled="groupsStore.saving || !selectedUserId"
          @click="submit"
        >
          {{ $t("groups_transfer") }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { toast } from "vue-sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { normalizeApiError } from "@/lib/apiError";
import type { Group } from "@/contracts/group";

const props = defineProps<{ open: boolean; group: Group }>();
const emit = defineEmits<{
  (event: "update:open", value: boolean): void;
  (event: "transferred"): void;
}>();

const { t } = useI18n();
const groupsStore = useGroupsStore();

const selectedUserId = ref("");
const errorMessage = ref("");

const candidates = computed(() =>
  groupsStore.members.filter(
    (member) =>
      member.role !== "owner" && member.user_id !== props.group.owner_user_id,
  ),
);

watch(
  () => props.open,
  (value) => {
    if (!value) return;
    selectedUserId.value = "";
    errorMessage.value = "";
  },
);

async function submit() {
  const userId = Number(selectedUserId.value);
  if (!Number.isFinite(userId)) return;
  try {
    await groupsStore.transferOwnership(props.group.id, userId);
    toast(t("groups_transferred"));
    emit("transferred");
    emit("update:open", false);
  } catch (error) {
    errorMessage.value =
      normalizeApiError(error).message ?? t("api_errors.generic");
  }
}
</script>
