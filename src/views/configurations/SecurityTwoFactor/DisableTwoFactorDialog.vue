<template>
  <Dialog :open="isDialogOpen" @update:open=" isDialogOpen = $event">
    <DialogTrigger as-child>
      <Button @click="openDialog">{{ $t('disable') }}</Button>
    </DialogTrigger>
    <DialogContent class="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>{{ $t('deactivate_2fa') }}</DialogTitle>
      </DialogHeader>

      <div v-if="step">
        <DialogDescription>
          {{ $t('confirm_deactivation_2fa') }}
        </DialogDescription>
      </div>
      <div v-if="!step && !loading" class="flex flex-col gap-4">
        <DialogDescription v-if="userAuth.user.preferences.auth2fa === 'email'">
          {{ $t('verification_code_email') }}
        </DialogDescription>
        <DialogDescription v-else>
          {{ $t('verification_code_app') }}
        </DialogDescription>

        <CustomPinInput class="w-full flex justify-center" :finish="disable2fa" />
      </div>
      <div class="flex justify-center w-full align-middle">
        <LucideSpinner v-if="loading" class="mr-2 h-6 w-6 animate-spin" />
      </div>

      <DialogFooter v-if="step && !loading" class="flex gap-2 w-full justify-end">
        <Button @click="nextStep">{{ $t('continue') }}</Button>
        <Button @click="closeDialog" variant="outline">{{ $t('cancel') }}</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>


<script setup lang="ts">
import {ref, watch} from 'vue';
import {Loader2 as LucideSpinner, X} from "lucide-vue-next";
import Users from '@/services/users'
import Auth from '@/services/auth'
import Form from "vform";
import { useToast } from "@/components/ui/toast/use-toast";
const { toast } = useToast();
import i18n from "@/i18n";
import {useAuthStore} from "@/stores/auth";
import CustomPinInput from "@/components/custom/CustomPinInput.vue";

const userAuth = useAuthStore()
const isDialogOpen = ref(false);
const loading = ref(false);
const step = ref(true);

function openDialog() {
  isDialogOpen.value = true;
}
function closeDialog() {
  step.value = true
  isDialogOpen.value = false;
}
watch(isDialogOpen, (value) => {
  if (!value) {
    closeDialog()
  }
})
const form2fa = ref(new Form({
  two_factor_code:""
}))

const disable2fa = async (code: Array<string>) => {
  if (code.length < 6) {
    toast({
      title: i18n.global.t("warning"),
      description:  i18n.global.t("error_not_code"),
      duration:3000,
      variant:'destructive'
    });
    return
  }
  loading.value = true;

  try {
    form2fa.value.two_factor_code = code.join("");

    const data = await Users.disableTwoFactor(form2fa.value)

    step.value = true;

    toast({
      title: i18n.global.t("success"),
      description:  i18n.global.t(data.message),
      duration:3000
    });

  } catch (error: any) {
    console.error("Erro ao desativar 2FA:", error);
    step.value = true;


  } finally {
    closeDialog();
    loading.value = false;
    userAuth.fetchUser();
  }
};

const nextStep = async () => {
  loading.value = true;

  try {
    step.value = false;
    if (userAuth.user.preferences.auth2fa === "email") {
      await Auth.getResendTwoFactor(userAuth.user.id)
    }

    step.value = false;
  } catch (error: any) {
    closeDialog()
    toast({
      title: i18n.global.t("warning"),
      description: "Falha ao desativar 2FA: ",
      duration:3000,
      variant:'destructive'
    });
  }

  loading.value = false;
};

</script>
