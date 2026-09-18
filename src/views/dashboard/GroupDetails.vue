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
      />

      <Tabs v-model="activeTab" class="mt-6">
        <TabsList>
          <TabsTrigger value="overview">
            {{ $t("groups_overview") }}
          </TabsTrigger>
          <TabsTrigger value="projects">
            {{ $t("groups_projects") }}
          </TabsTrigger>
          <TabsTrigger value="members">
            {{ $t("groups_members") }}
          </TabsTrigger>
          <TabsTrigger value="invitations">
            {{ $t("groups_invitations") }}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" class="mt-4">
          <Card>
            <CardContent class="space-y-2 py-6">
              <p>
                <strong>{{ $t("groups_name") }}:</strong> {{ group.name }}
              </p>
              <p>
                <strong>{{ $t("groups_description") }}:</strong>
                {{ group.description || "—" }}
              </p>
              <p>
                <strong>{{ $t("groups_projects") }}:</strong>
                {{ group.projects.length }}
              </p>
              <p>
                <strong>{{ $t("groups_role") }}:</strong>
                {{ $t(`groups_role_${permissions.role}`) }}
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="projects" class="mt-4">
          <ProjectsTab
            :group="group"
            :permissions="permissions"
            @changed="reload"
          />
        </TabsContent>
        <TabsContent value="members" class="mt-4">
          <MembersTab
            :group="group"
            :permissions="permissions"
            @invite="inviteOpen = true"
          />
        </TabsContent>
        <TabsContent value="invitations" class="mt-4">
          <InvitationsTab
            :group="group"
            :permissions="permissions"
            @changed="reload"
            @invite="inviteOpen = true"
          />
        </TabsContent>
      </Tabs>

      <EditGroupModal v-model:open="editOpen" :group="group" @updated="reload" />
      <InviteMemberModal
        v-model:open="inviteOpen"
        :group="group"
        @invited="reload"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import ProjectsTab from "@/components/groups/ProjectsTab.vue";
import MembersTab from "@/components/groups/MembersTab.vue";
import InvitationsTab from "@/components/groups/InvitationsTab.vue";
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
const activeTab = ref("overview");
const editOpen = ref(false);
const inviteOpen = ref(false);
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
