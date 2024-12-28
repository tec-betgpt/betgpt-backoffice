<template>
  <div>
    <div v-if="isTwoFactorPending">
      <div class="mb-4">
        <h3 class="text-lg font-medium">{{ $t('two_factor_add_method') }}</h3>
        <p class="text-sm text-muted-foreground">
          {{ $t('two_factor_choose_option') }}
        </p>
      </div>
      <Separator class="mb-3" />
      <div class="flex justify-center gap-4">
        <TwoFactorDialog />
      </div>
    </div>
    <div v-else>
      <div class="mb-4">
        <h3 class="text-lg font-medium">{{ $t('two_factor_already_enabled') }}</h3>
        <p class="text-sm text-muted-foreground">
          {{ $t('two_factor_account_secure') }}
        </p>
      </div>
      <Separator class="mb-3" />
      <div class="w-full grid grid-cols-1 place-items-center p-4 gap-4">
        <ShieldCheck :size="128" :stroke-width="2" absoluteStrokeWidth />
        <DisableTwoFactorDialog />
      </div>
    </div>
  </div>
</template>


<script setup>
import { computed } from 'vue';
import { useAuthStore } from '@/stores/auth';
import TwoFactorDialog from "@/views/configurations/SecurityTwoFactor/TwoFactorDialog.vue";
import DisableTwoFactorDialog from "@/views/configurations/SecurityTwoFactor/DisableTwoFactorDialog.vue";
import { ShieldCheck } from 'lucide-vue-next';


const authStore = useAuthStore();
const isTwoFactorPending = computed(() => {
  const auth2fa = authStore.user.preferences.auth2fa;
  return auth2fa == null || auth2fa === 'pending';
});
</script>
