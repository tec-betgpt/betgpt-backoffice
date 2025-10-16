<template>
  <Dialog :open="isDialogOpen" @update:open="isDialogOpen = $event">
    <DialogTrigger as-child>
      <Button @click="openDialog('email')">{{ $t("use_email") }}</Button>
    </DialogTrigger>
    <DialogTrigger as-child>
      <Button @click="openDialog('app')">{{ $t("use_2fa_app") }}</Button>
    </DialogTrigger>
    <DialogContent class="sm:max-w-[425px]">
      <DialogHeader class="flex justify-between w-full">
        <DialogTitle>{{ $t("activating_2fa") }}</DialogTitle>
      </DialogHeader>
      <div v-if="finish">
        <div v-if="step.type === 'email'">
          <div v-if="step.step">
            <DialogDescription>
              {{ $t("email_confirmation_prompt") }}
            </DialogDescription>
          </div>
          <div
            v-if="!step.step && !loading"
            class="flex justify-center gap-2 w-full flex-col"
          >
            <DialogDescription>{{ $t("email_enter_code") }}</DialogDescription>
            <div class="flex justify-center w-full align-middle gap-2">
              <Pin :finish="validate2fa" />
            </div>
          </div>
        </div>
        <div v-if="step.type === 'app'">
          <div v-if="step.step">
            <DialogDescription>
              {{ $t("app_setup_instructions") }}
            </DialogDescription>
          </div>
          <div
            v-if="!step.step && !loading"
            class="flex flex-col justify-center align-middle gap-3 w-full"
          >
            <div class="flex flex-col gap-1">
              <DialogDescription> 1° {{ $t("app_scan_qr") }}</DialogDescription>
              <img
                v-if="qrCode[0]"
                :src="qrCode[0]"
                alt="QRCODE"
                class="w-1/3 mx-auto"
              />
              <p class="text-xs text-gray-600 text-center">
                {{ $t("app_alternative_instruction") }}
              </p>
              <p class="text-sm font-bold text-center">{{ qrCode[1] }}</p>
            </div>
            <div class="flex flex-col gap-3">
              <DialogDescription
                >2° {{ $t("app_enter_code") }}</DialogDescription
              >
              <div class="flex justify-center w-full align-middle gap-2">
                <Pin :finish="validate2fa" />
              </div>
            </div>
          </div>
        </div>
        <div class="flex w-full justify-center">
          <LucideSpinner v-if="loading" class="mr-2 h-6 w-6 animate-spin" />
        </div>
        <DialogFooter v-if="step.step" class="flex gap-2 w-full justify-end">
          <Button @click="active2fa()">{{ $t("continue") }}</Button>
          <Button @click="closeDialog" variant="outline">{{
            $t("back")
          }}</Button>
        </DialogFooter>
      </div>
      <div v-else class="flex flex-col justify-center align-middle gap-4">
        <DialogDescription
          v-html="$t('recovery_key_instruction')"
        ></DialogDescription>
        <Card>
          <CardContent class="flex flex-wrap gap-2 p-4 justify-center">
            <Badge
              class="p-2"
              v-for="(value, key) in securityCode?.split('-')"
              :key="key"
            >
              {{ value }}
            </Badge>
          </CardContent>
        </Card>
        <DialogDescription>
          <span class="text-red-500 font-semibold">⚠️ {{ $t("warning") }}</span>
          {{ $t("do_not_share_keys") }}
        </DialogDescription>
        <ClipboardButton type="copy" :clip="copySecurityCode" variant="Text" />
      </div>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { Loader2 as LucideSpinner, X } from "lucide-vue-next";
import { useToast } from "@/components/ui/toast/use-toast";
import Pin from "@/components/custom/CustomPinInput.vue";
import { useAuthStore } from "@/stores/auth";
import ClipboardButton from "@/components/custom/ClipboardButton.vue";
import Users from "@/services/users";

import i18n from "@/i18n";
const { toast } = useToast();
const isDialogOpen = ref(false);
const step = ref({ type: "", step: true });
const auth = useAuthStore();
const loading = ref(false);
const qrCode = ref<string[]>([]);
const finish = ref(true);
const securityCode = ref<string>();
const form2fa = ref({
  two_factor_code: "",
  type: "",
});

watch(isDialogOpen, (value) => {
  if (!value) {
    closeDialog();
  }
});
function openDialog(type: string) {
  step.value.type = type;
  form2fa.value.type = type;
  isDialogOpen.value = true;
}
function closeDialog() {
  isDialogOpen.value = false;
  step.value.step = true;
  step.value.type = "";
  finish.value = true;
  auth.fetchUser();
}
function copySecurityCode() {
  return securityCode.value;
}
const active2fa = async () => {
  step.value.step = false;
  loading.value = true;

  try {
    qrCode.value = [];
    const data = await Users.activeTwoFactor(form2fa.value);

    if (data.message === "app") {
      qrCode.value = data.data;
    }
  } catch (error: any) {
    console.error("Erro ao ativar 2FA:", error);
    closeDialog();
    step.value.step = true;
    qrCode.value = [];
  }

  loading.value = false;
};

const validate2fa = async (code: Array<string>) => {
  if (code.length < 6) {
    toast({
      title: i18n.global.t("warning"),
      description: i18n.global.t("error_not_code"),
      duration: 3000,
      variant: "destructive",
    });
    return;
  }
  loading.value = true;

  try {
    form2fa.value.two_factor_code = code.join("");
    const data = await Users.validateTwoFactor(form2fa.value);

    toast({
      title: i18n.global.t("success"),
      description: i18n.global.t(data.message),
      duration: 3000,
    });

    finish.value = false;
    securityCode.value = data.data;
  } catch (error: any) {
    console.error("Erro ao validar 2FA:", error);
    isDialogOpen.value = false;
    step.value.step = true;
    step.value.type = "";
    finish.value = true;
  }

  loading.value = false;
};
</script>
