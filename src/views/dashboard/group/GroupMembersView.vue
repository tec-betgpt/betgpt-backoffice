<template>
  <Card>
    <CardContent class="space-y-4 py-4">
      <div class="flex items-center justify-between">
        <h3 class="font-medium">{{ $t("groups_members") }}</h3>
        <Button
          v-if="permissions.canManageInvitations"
          variant="outline"
          @click="emit('invite')"
        >
          {{ $t("groups_invite_person") }}
        </Button>
      </div>

      <ul class="divide-y rounded-lg border">
        <li
          v-for="member in groupsStore.members"
          :key="member.id"
          class="flex items-center justify-between gap-4 px-4 py-3"
        >
          <div class="min-w-0">
            <p class="truncate font-medium">
              {{ member.user?.name ?? member.user?.email ?? `#${member.user_id}` }}
            </p>
            <p class="truncate text-xs text-muted-foreground">
              {{ member.user?.email }}
            </p>
          </div>
          <div class="flex items-center gap-2">
            <Badge variant="outline">{{ $t(`groups_role_${member.role}`) }}</Badge>
            <Badge variant="secondary">
              {{
                $t(
                  member.access_projects
                    ? "groups_access_projects"
                    : "groups_access_view_only",
                )
              }}
            </Badge>
            <DropdownMenu
              v-if="permissions.canManageMembers && member.role !== 'owner'"
            >
              <DropdownMenuTrigger as-child>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal class="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem @click="openEdit(member)">
                  {{ $t("groups_edit") }}
                </DropdownMenuItem>
                <DropdownMenuItem class="text-destructive" @click="remove(member)">
                  {{ $t("groups_remove") }}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </li>
      </ul>

      <EditMemberModal
        v-if="editing"
        v-model:open="editOpen"
        :group-id="group.id"
        :member="editing"
        @updated="reload"
      />
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import { toast } from "vue-sonner";
import { MoreHorizontal } from "lucide-vue-next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import EditMemberModal from "@/components/groups/EditMemberModal.vue";
import { useGroupsStore } from "@/stores/groups";
import { showApiErrorToast } from "@/lib/apiErrorFeedback";
import type { Group } from "@/contracts/group";
import type { GroupMember } from "@/contracts/groupMember";
import type { GroupPermissions } from "@/composables/useGroupPermissions";

const props = defineProps<{ group: Group; permissions: GroupPermissions }>();
const emit = defineEmits<{ (event: "invite"): void }>();

const { t } = useI18n();
const groupsStore = useGroupsStore();

const editing = ref<GroupMember | null>(null);
const editOpen = ref(false);

function openEdit(member: GroupMember) {
  editing.value = member;
  editOpen.value = true;
}

async function reload() {
  await groupsStore.fetchMembers(props.group.id).catch(showApiErrorToast);
}

async function remove(member: GroupMember) {
  if (!window.confirm(t("groups_confirm_delete_description"))) return;
  try {
    await groupsStore.removeMember(props.group.id, member.user_id);
    toast(t("groups_member_removed"));
  } catch (error) {
    showApiErrorToast(error);
  }
}
</script>
