<template>
  <Card>
    <CardContent class="space-y-4 py-4">
      <div class="flex items-center justify-between">
        <h3 class="font-medium">{{ $t("groups_invitations") }}</h3>
        <Button
          v-if="permissions.canManageInvitations"
          variant="outline"
          @click="emit('invite')"
        >
          {{ $t("groups_invite_person") }}
        </Button>
      </div>

      <ul v-if="pending.length" class="divide-y rounded-lg border">
        <li
          v-for="invitation in pending"
          :key="invitation.id"
          class="flex items-center justify-between gap-4 px-4 py-3"
        >
          <div class="min-w-0">
            <p class="truncate">{{ invitation.email }}</p>
            <p class="text-xs text-muted-foreground">
              {{ $t(`groups_role_${invitation.role}`) }}
              <span v-if="invitation.expires_at">
                · {{ $t("groups_expires_at") }}
                {{ formatDate(invitation.expires_at) }}
              </span>
            </p>
          </div>
          <Button
            v-if="permissions.canManageInvitations"
            variant="ghost"
            size="sm"
            @click="revoke(invitation)"
          >
            {{ $t("groups_revoke") }}
          </Button>
        </li>
      </ul>
      <p v-else class="py-8 text-center text-sm text-muted-foreground">
        {{ $t("groups_empty") }}
      </p>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { toast } from "vue-sonner";
import moment from "moment";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useGroupsStore } from "@/stores/groups";
import { showApiErrorToast } from "@/lib/apiErrorFeedback";
import type { Group } from "@/contracts/group";
import type { GroupInvitation } from "@/contracts/groupInvitation";
import type { GroupPermissions } from "@/composables/useGroupPermissions";

defineProps<{ group: Group; permissions: GroupPermissions }>();
const emit = defineEmits<{
  (event: "changed"): void;
  (event: "invite"): void;
}>();

const { t } = useI18n();
const groupsStore = useGroupsStore();

const pending = computed(() =>
  groupsStore.invitations.filter(
    (invitation) => invitation.status === "pending",
  ),
);

function formatDate(value: string) {
  return moment(value).format("DD/MM/YYYY");
}

async function revoke(invitation: GroupInvitation) {
  try {
    await groupsStore.revokeInvitation(invitation.id);
    toast(t("groups_invite_revoked"));
    emit("changed");
  } catch (error) {
    showApiErrorToast(error);
  }
}
</script>
