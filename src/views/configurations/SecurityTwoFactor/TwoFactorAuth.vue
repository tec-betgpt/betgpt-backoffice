<template>
  <div class="flex flex-wrap items-start justify-between gap-4 rounded-lg border p-4 sm:p-6">
    <div class="flex min-w-0 flex-1 gap-3">
      <ShieldCheck
        v-if="!isTwoFactorPending"
        class="mt-0.5 size-5 shrink-0 text-emerald-500"
      />
      <ShieldAlert v-else class="mt-0.5 size-5 shrink-0 text-muted-foreground" />
      <div class="space-y-1">
        <div class="flex flex-wrap items-center gap-2">
          <h4 class="font-medium">Verificação em duas etapas</h4>
          <Badge :variant="isTwoFactorPending ? 'outline' : 'secondary'">
            {{ statusLabel }}
          </Badge>
        </div>
        <p class="text-sm text-muted-foreground">
          {{ isTwoFactorPending ? 'Proteja o acesso com um código extra, enviado por e-mail ou gerado num aplicativo.' : $t('two_factor_account_secure') }}
        </p>
      </div>
    </div>
    <div class="flex flex-wrap gap-2">
      <TwoFactorDialog v-if="isTwoFactorPending" @success="handleCreateSuccess" />
      <DisableTwoFactorDialog v-else />
    </div>
  </div>
</template>


<script setup>
import { computed } from 'vue';
import { useAuthStore } from '@/stores/auth';
import TwoFactorDialog from "@/views/configurations/SecurityTwoFactor/TwoFactorDialog.vue";
import DisableTwoFactorDialog from "@/views/configurations/SecurityTwoFactor/DisableTwoFactorDialog.vue";
import { ShieldAlert, ShieldCheck } from 'lucide-vue-next';


const authStore = useAuthStore();
const isTwoFactorPending = computed(() => {
  const auth2fa = authStore.user.preferences.auth2fa;
  return auth2fa == null || auth2fa === 'pending';
});

const statusLabel = computed(() => {
  if (isTwoFactorPending.value) return 'Desativada';
  return authStore.user.preferences.auth2fa === 'email' ? 'Ativada por e-mail' : 'Ativada por aplicativo';
});

const handleCreateSuccess = () =>{
  authStore.fetchUser()
}
</script>
