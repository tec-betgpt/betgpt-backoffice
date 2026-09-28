<template>
  <div class="flex min-h-screen items-center justify-center bg-muted/40 p-4">
    <div class="w-full max-w-md rounded-lg border bg-background p-6 shadow-sm">
      <div
        v-if="loading"
        class="flex items-center gap-2 text-sm text-muted-foreground"
      >
        <LucideSpinner class="h-4 w-4 animate-spin" />
        {{ $t("group_invite_loading") }}
      </div>

      <template v-else-if="invitation">
        <h1 class="text-lg font-semibold">{{ $t("group_invite_title") }}</h1>

        <p class="mt-2 text-sm">
          {{
            $t("groups_invite_banner", {
              name: invitation.group.name,
              role: $t(`groups_role_${invitation.role}`),
            })
          }}
        </p>

        <p class="mt-1 text-xs text-muted-foreground">
          {{ invitation.email }} · {{ $t(`groups_role_${invitation.role}`) }}
        </p>

        <div v-if="!authStore.user" class="mt-5">
          <Button class="w-full" @click="goToLogin">
            {{ $t("group_invite_login_to_accept") }}
          </Button>
        </div>

        <p
          v-else-if="invitation.email_matches_current_user === false"
          class="mt-5 text-sm text-destructive"
        >
          {{ $t("groups_wrong_email") }}
        </p>

        <div v-else class="mt-5 flex gap-2">
          <Button
            variant="ghost"
            class="flex-1"
            :disabled="saving"
            @click="decline"
          >
            {{ $t("groups_decline") }}
          </Button>
          <Button class="flex-1" :disabled="saving" @click="accept">
            {{ $t("groups_accept") }}
          </Button>
        </div>
      </template>

      <p v-else class="text-sm text-destructive">
        {{ errorMessage ?? $t("group_invite_invalid") }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { toast } from "vue-sonner";
import { Loader2 as LucideSpinner } from "lucide-vue-next";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/auth";
import {
  acceptInvitation,
  declineInvitation,
  validateInvitation,
} from "@/services/groups";
import type { GroupInvitationPublic } from "@/contracts/groupInvitation";
import { setPostLoginRedirect } from "@/lib/postLoginRedirect";
import { normalizeApiError } from "@/lib/apiError";

const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const authStore = useAuthStore();

const uuid = String(route.params.uuid ?? "");
const token = String(route.query.token ?? "");

const loading = ref(true);
const saving = ref(false);
const invitation = ref<GroupInvitationPublic | null>(null);
const errorMessage = ref<string | null>(null);

onMounted(load);

async function load() {
  loading.value = true;
  errorMessage.value = null;

  try {
    invitation.value = await validateInvitation(uuid, token);
  } catch (error) {
    errorMessage.value = normalizeApiError(error).message ?? t("group_invite_invalid");
  } finally {
    loading.value = false;
  }
}

function goToLogin() {
  setPostLoginRedirect(route.fullPath);
  router.push({ name: "login" });
}

async function accept() {
  saving.value = true;

  try {
    await acceptInvitation(uuid, token);
    toast(t("groups_invite_accepted"));
    router.push("/groups");
  } catch (error) {
    const normalized = normalizeApiError(error);

    if (normalized.status === 422) {
      toast.error(t("groups_wrong_email"));
      return;
    }

    toast.error(normalized.message ?? t("try_again_later"));
  } finally {
    saving.value = false;
  }
}

async function decline() {
  saving.value = true;

  try {
    await declineInvitation(uuid, token);
    toast(t("groups_invite_declined"));
    router.push("/");
  } catch (error) {
    toast.error(normalizeApiError(error).message ?? t("try_again_later"));
  } finally {
    saving.value = false;
  }
}
</script>
