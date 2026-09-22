<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent class="sm:max-w-[480px]">
      <DialogHeader>
        <DialogTitle>
          {{ transaction ? $t("groups_fin_edit") : $t("groups_fin_new") }}
        </DialogTitle>
      </DialogHeader>

      <form class="space-y-4" @submit.prevent="submit">
        <div class="space-y-2">
          <Label>{{ $t("groups_fin_type") }} *</Label>
          <Select v-model="form.type">
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="revenue">
                {{ $t("groups_fin_type_revenue") }}
              </SelectItem>
              <SelectItem value="cost">
                {{ $t("groups_fin_type_cost") }}
              </SelectItem>
              <SelectItem value="investment">
                {{ $t("groups_fin_type_investment") }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div class="space-y-2">
          <Label for="group-fin-category">{{ $t("groups_fin_category") }}</Label>
          <Input
            id="group-fin-category"
            v-model="form.category_type"
            placeholder="receita_grupo"
          />
        </div>

        <div class="space-y-2">
          <Label for="group-fin-amount">{{ $t("groups_fin_amount") }} *</Label>
          <Input
            id="group-fin-amount"
            v-model="form.amount"
            type="number"
            step="0.01"
          />
        </div>

        <div class="space-y-2">
          <Label for="group-fin-date">{{ $t("groups_fin_date") }} *</Label>
          <Input id="group-fin-date" v-model="form.date" type="date" />
        </div>

        <div class="space-y-2">
          <Label for="group-fin-description">
            {{ $t("groups_fin_description") }}
          </Label>
          <Input id="group-fin-description" v-model="form.description" />
        </div>

        <p v-if="errorMessage" class="text-sm text-destructive">
          {{ errorMessage }}
        </p>

        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            @click="emit('update:open', false)"
          >
            {{ $t("groups_cancel") }}
          </Button>
          <Button type="submit" :disabled="saving || !form.amount || !form.date">
            {{ $t("groups_save") }}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { toast } from "vue-sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createGroupFinancialTransaction,
  updateGroupFinancialTransaction,
} from "@/services/groups";
import { normalizeApiError } from "@/lib/apiError";
import type {
  GroupFinancialTransaction,
  GroupFinancialType,
} from "@/contracts/groupFinancial";

const props = defineProps<{
  open: boolean;
  groupId: number;
  transaction?: GroupFinancialTransaction | null;
}>();
const emit = defineEmits<{
  (event: "update:open", value: boolean): void;
  (event: "saved"): void;
}>();

const { t } = useI18n();

const form = reactive<{
  type: GroupFinancialType;
  category_type: string;
  amount: string;
  date: string;
  description: string;
}>({
  type: "revenue",
  category_type: "",
  amount: "",
  date: "",
  description: "",
});

const saving = ref(false);
const errorMessage = ref("");

watch(
  () => props.open,
  (value) => {
    if (!value) return;
    errorMessage.value = "";
    if (props.transaction) {
      form.type = props.transaction.type;
      form.category_type = props.transaction.category_type ?? "";
      form.amount = String(props.transaction.amount ?? "");
      form.date = props.transaction.date?.slice(0, 10) ?? "";
      form.description = props.transaction.description ?? "";
    } else {
      form.type = "revenue";
      form.category_type = "";
      form.amount = "";
      form.date = "";
      form.description = "";
    }
  },
);

async function submit() {
  saving.value = true;
  try {
    const payload = {
      type: form.type,
      category_type: form.category_type || null,
      amount: Number(form.amount),
      date: form.date,
      description: form.description || null,
    };
    if (props.transaction) {
      await updateGroupFinancialTransaction(
        props.groupId,
        props.transaction.id,
        payload,
      );
      toast(t("groups_fin_updated"));
    } else {
      await createGroupFinancialTransaction(props.groupId, payload);
      toast(t("groups_fin_created"));
    }
    emit("saved");
    emit("update:open", false);
  } catch (error) {
    errorMessage.value =
      normalizeApiError(error).message ?? t("api_errors.generic");
  } finally {
    saving.value = false;
  }
}
</script>
