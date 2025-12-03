<template>
  <Button size="icon" variant="ghost" @click="open()">
    <Eye />
  </Button>

  <Dialog :open="dialog" @update:open="dialog = false">
    <DialogContent class="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>Detalhes do Cliente</DialogTitle>
        <DialogDescription>
          Detalhes do cliente {{ player?.name }}.
        </DialogDescription>
      </DialogHeader>
      <div v-if="player" class="grid gap-4 pt-4 text-sm">
        <div>
          <div class="text-xs font-bold">Nome</div>
          <div class="text-sm">
            {{ player.name ?? 'Não Informado' }}
          </div>
        </div>

        <div>
          <div class="text-xs font-bold">Email</div>
          <div class="text-sm">
            {{ player.email }}
          </div>
        </div>

        <div>
          <div class="text-xs font-bold">Nascimento</div>
          <div class="text-sm">
            {{ $moment(player.birthday).format('DD/MM/YYYY') }} ({{ getAge(player.birthday) }} anos)
          </div>
        </div>

        <div>
          <div class="text-xs font-bold">Contato</div>
          <div class="text-sm">
            {{ formatPhoneNumber(player.phone) }}
          </div>
        </div>

        <div>
          <div class="text-xs font-bold">Cadastrado em</div>
          <div class="text-sm">
            {{ $moment(player.created_at).format('DD/MM/YYYY') }}
          </div>
        </div>
      </div>
      <DialogFooter>
        <Button @click="dialog = false">Fechar</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
<script setup lang="ts">
import { ref, defineProps } from "vue";
import { Eye } from "lucide-vue-next";
import Players from "@/services/players";

const props = defineProps<{ row: any, filterId: any }>()

const dialog = ref(false);
const player = ref();

const open = async () => {
  await show();
  dialog.value = true;
};

const show = async () => {
  try {
    player.value = await Players.show(props.row.id, { filter_id: props.filterId });
  } catch(e) {
    console.error(e);
  }
};

const getAge = (value: number) => {
  const today = new Date();
  const birthDate = new Date(value);
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

const formatPhoneNumber = (value: string) => {
  if (!value) return '';

  const cleaned = ('' + value).replace(/\D/g, '');
  const match = cleaned.match(/^(\d{2})(\d{5})(\d{4})$/);
  if (match) {
    return '(' + match[1] + ') ' + match[2] + '-' + match[3];
  }
  return value;
}
</script>
