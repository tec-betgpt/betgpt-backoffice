<template>
  <div>
    <Button class="bg-yellow-400 text-black" @click="modal = true">
      <ListFilter />
      Filtro
    </Button>

    <Dialog v-model:open="modal">
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>
            Filtros
          </DialogTitle>
          <DialogDescription>
            Selecione os filtros desejados
          </DialogDescription>
        </DialogHeader>
        <form @submit.prevent="applyFilters">
          <div class="grid gap-4 py-4">
            <div class="grid items-center gap-4">
              <Select v-model="user">
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar usuário" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="row in users" :key="row.id" :value="row">
                    {{ row.first_name }} {{ row.last_name }}
                  </SelectItem>
                </SelectContent>
              </Select>

              <Select v-model="limit">
                <SelectTrigger>
                  <SelectValue placeholder="Limite" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="page in [15, 25, 50, 100, 500, 1000, 3000]" :key="page" :value="page">
                    {{ page }} Por página
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter class="pt-2">
            <Button variant="ghost" @click="modal = false">
              Cancelar
            </Button>
            <Button class="bg-yellow-300" type="submit">
              Aplicar Filtros
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  </div>
</template>
<script setup lang="ts">
import { ListFilter } from "lucide-vue-next";
import { onMounted, ref, defineProps } from "vue";
import Users from '@/services/users';

// data
const modal = ref(false);
const users = ref([]);
const user = ref(null);
const limit = ref(6);

// hooks
onMounted(() => {
  console.log("FilterDialogComponent mounted");
  _users();
})

const props = defineProps<{ setFilters: Function }>();

// functions
const _users = async (params = {}) => {
  try {
    users.value = await Users.list(params)
  } catch (e) {
    console.error(e)
  }
}

const applyFilters = () => {
  props.setFilters({
    user_id: user.value ? user.value.id : null,
    limit: limit.value,
  });
  modal.value = false;
};
</script>
