<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { useAuthStore } from "@/stores/auth";
import { setPostLoginRedirect } from "@/lib/postLoginRedirect";
import McpAuth from "@/services/mcpAuth";

const { t } = useI18n();

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const error = ref<string | null>(null);

const mcpUrl = String(
  import.meta.env.VITE_MCP_URL ?? "https://mcp.myelevate.ai",
).replace(/\/+$/, "");

const redirectUri = `${mcpUrl}/auth/handoff/callback`;

onMounted(async () => {
  if (!authStore.user) {
    setPostLoginRedirect(route.fullPath);
    await router.replace({ name: "login" });
    return;
  }

  const state = String(route.query.state ?? "");

  if (!state) {
    error.value = t("mcp_auth.missing_state");
    return;
  }

  try {
    const result = await McpAuth.handoff({
      redirect_uri: redirectUri,
      state,
    });

    if (!result?.code) {
      throw new Error("missing_code");
    }

    const query = new URLSearchParams({ code: result.code, state });

    window.location.replace(`${redirectUri}?${query.toString()}`);
  } catch {
    error.value = t("mcp_auth.error");
  }
});
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-background p-6">
    <div class="w-full max-w-md rounded-xl border bg-muted/30 p-8 text-center">
      <template v-if="error">
        <p class="text-sm font-medium">{{ t("mcp_auth.error_title") }}</p>
        <p class="mt-2 text-sm text-muted-foreground">{{ error }}</p>
      </template>

      <template v-else>
        <div
          class="mx-auto size-8 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-primary"
        />
        <p class="mt-4 text-sm font-medium">{{ t("mcp_auth.connecting") }}</p>
        <p class="mt-2 text-sm text-muted-foreground">
          {{ t("mcp_auth.connecting_hint") }}
        </p>
      </template>
    </div>
  </div>
</template>
