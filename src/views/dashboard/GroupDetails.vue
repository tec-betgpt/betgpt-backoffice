<template>
  <div class="w-full p-10 pb-16 max-[450px]:p-2">
    <div v-if="loading" class="space-y-4">
      <Skeleton class="h-16 w-full" />
      <Skeleton class="h-10 w-96" />
      <Skeleton class="h-64 w-full" />
    </div>

    <template v-else-if="group">
      <div
        v-if="permissions.canEdit || permissions.canDelete || permissions.isOwner"
        class="mb-4 flex items-center justify-end gap-2"
      >
        <Button v-if="permissions.canEdit" variant="outline" @click="editOpen = true">
          {{ $t("groups_edit") }}
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <Button variant="ghost" size="icon">
              <MoreHorizontal class="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem v-if="permissions.canEdit" @click="archive">
              {{ $t("groups_archive") }}
            </DropdownMenuItem>
            <DropdownMenuItem v-if="permissions.isOwner" @click="transferOpen = true">
              {{ $t("groups_transfer") }}
            </DropdownMenuItem>
            <DropdownMenuItem
              v-if="permissions.canDelete"
              class="text-destructive"
              @click="deleteOpen = true"
            >
              {{ $t("groups_delete") }}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div>
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
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { toast } from "vue-sonner";
import { MoreHorizontal } from "lucide-vue-next";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import EditGroupModal from "@/components/groups/EditGroupModal.vue";
import InviteMemberModal from "@/components/groups/InviteMemberModal.vue";
import TransferOwnershipModal from "@/components/groups/TransferOwnershipModal.vue";
import { useGroupsStore } from "@/stores/groups";
import { useAuthStore } from "@/stores/auth";
import { useWorkspaceStore } from "@/stores/workspace";
import { resolveGroupPermissions } from "@/composables/useGroupPermissions";
import { normalizeApiError } from "@/lib/apiError";
import { showApiErrorToast } from "@/lib/apiErrorFeedback";

const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const groupsStore = useGroupsStore();
const authStore = useAuthStore();
const workspaceStore = useWorkspaceStore();

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

    // Sem permissão de gestão de convites, não busca a lista (evita 403).
    if (permissions.value.canManageInvitations) {
      await groupsStore.fetchInvitations(groupId.value);
    }
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

/** Id numérico de um workspace `group_31` / `project_12`. */
function parseWorkspaceId(raw: unknown): number | null {
  const match = /(?:group|project)_(\d+)/.exec(String(raw ?? ""));
  if (match) return Number(match[1]);
  const numeric = Number(String(raw ?? "").replace(/\D/g, ""));
  return Number.isFinite(numeric) && numeric > 0 ? numeric : null;
}

// As telas do grupo só fazem sentido com um grupo como workspace. Com um
// projeto ativo, apenas a lista/criação de grupos permanece acessível.
// Ao trocar o grupo no seletor, mantém a tela atual mas apontando para o novo
// grupo (a URL muda e o conteúdo recarrega).
watch(
  () => workspaceStore.activeGroupProject,
  (project) => {
    if (!project) return;
    if (project.type !== "group") {
      router.replace({ name: "groups" });
      return;
    }

    const workspaceGroupId = parseWorkspaceId(
      project.id ?? project.project_id,
    );
    if (
      workspaceGroupId != null &&
      String(workspaceGroupId) !== String(route.params.id)
    ) {
      router.replace({
        name: (route.name as string) ?? "groups.overview",
        params: { id: workspaceGroupId },
      });
    }
  },
  { immediate: true },
);

// Navegação entre grupos (mudança do id na rota) recarrega o grupo atual.
watch(groupId, (id, previous) => {
  if (id !== previous) reload();
});

onMounted(reload);
</script>
