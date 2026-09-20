<template>
  <div class="w-full p-10 pb-16 max-[450px]:p-2">
    <div v-if="loading" class="space-y-4">
      <Skeleton class="h-16 w-full" />
      <Skeleton class="h-10 w-96" />
      <Skeleton class="h-64 w-full" />
    </div>

    <template v-else-if="group">
      <GroupDetailHeader
        :group="group"
        :permissions="permissions"
        @edit="editOpen = true"
        @archive="archive"
        @delete="deleteOpen = true"
        @transfer="transferOpen = true"
      />

      <div class="mt-6">
        <router-view v-slot="{ Component }">
          <component
            :is="Component"
            :group="group"
            :permissions="permissions"
            @changed="reload"
            @invite="inviteOpen = true"
            @transferred="reload"
          />
        </router-view>
      </div>

      <EditGroupModal v-model:open="editOpen" :group="group" @updated="reload" />
      <InviteMemberModal
        v-model:open="inviteOpen"
        :group="group"
        @invited="reload"
      />
      <TransferOwnershipModal
        v-model:open="transferOpen"
        :group="group"
        @transferred="reload"
      />

      <AlertDialog v-model:open="deleteOpen">
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {{ $t("groups_confirm_delete") }}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {{ $t("groups_confirm_delete_description") }}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{{ $t("groups_cancel") }}</AlertDialogCancel>
            <AlertDialogAction class="bg-red-600" @click="confirmDelete">
              {{ $t("groups_delete") }}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </template>

    <Card v-else>
      <CardContent class="py-16 text-center text-muted-foreground">
        Grupo não encontrado.
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { toast } from "vue-sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import GroupDetailHeader from "@/components/groups/GroupDetailHeader.vue";
import EditGroupModal from "@/components/groups/EditGroupModal.vue";
import InviteMemberModal from "@/components/groups/InviteMemberModal.vue";
import TransferOwnershipModal from "@/components/groups/TransferOwnershipModal.vue";
import { useGroupsStore } from "@/stores/groups";
import { useAuthStore } from "@/stores/auth";
import { resolveGroupPermissions } from "@/composables/useGroupPermissions";
import { normalizeApiError } from "@/lib/apiError";
import { showApiErrorToast } from "@/lib/apiErrorFeedback";

const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const groupsStore = useGroupsStore();
const authStore = useAuthStore();

const loading = ref(true);
const editOpen = ref(false);
const inviteOpen = ref(false);
const transferOpen = ref(false);
const deleteOpen = ref(false);

const groupId = computed(() => Number(route.params.id));
const group = computed(() => groupsStore.currentGroup);

const currentUserId = computed<number | null>(
  () => (authStore.user as any)?.id ?? null,
);
const permissions = computed(() =>
  resolveGroupPermissions(group.value, currentUserId.value),
);

async function reload() {
  loading.value = true;
  try {
    await groupsStore.fetchGroup(groupId.value);
    await groupsStore.fetchMembers(groupId.value);
    await groupsStore.fetchInvitations(groupId.value);
  } catch (error) {
    if (normalizeApiError(error).status === 404) {
      toast.error(t("groups_empty"));
      router.replace({ name: "groups" });
      return;
    }
    showApiErrorToast(error);
  } finally {
    loading.value = false;
  }
}

async function archive() {
  try {
    await groupsStore.updateGroup(groupId.value, { status: "archived" });
    toast(t("groups_updated"));
  } catch (error) {
    showApiErrorToast(error);
  }
}

async function confirmDelete() {
  try {
    await groupsStore.deleteGroup(groupId.value);
    toast(t("groups_deleted"));
    router.push({ name: "groups" });
  } catch (error) {
    showApiErrorToast(error);
  }
}

onMounted(reload);
</script>
