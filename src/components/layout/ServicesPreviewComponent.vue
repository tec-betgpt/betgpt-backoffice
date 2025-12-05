<template>
  <div v-if="service && service.id" class="p-2" @click="$router.push({ name: 'service-consumeds.index' })">
    <SidebarGroup class="bg-black rounded-md text-white relative overflow-hidden cursor-pointer">
      <SidebarMenu>
        <SidebarMenuItem>
          <div class="flex items-center justify-start gap-2">
            <Gem class="shrink-0 group-data-[collapsible=icon]:size-4 w-6 text-yellow-300" />
            <div class="group-data-[collapsible=icon]:hidden">
              <div class="text-sm">{{ service.name }}</div>
              <div class="text-xs">Serviço/Plano</div>
            </div>
          </div>
        </SidebarMenuItem>
      </SidebarMenu>

      <img
        src="/bg-2.png"
        class="absolute -bottom-10 -right-2 w-full group-data-[collapsible=icon]:hidden"
        alt="bg-2"
      />
    </SidebarGroup>
  </div>
</template>
<script setup lang="ts">
import { onMounted, ref } from "vue";
import { SidebarGroup, SidebarMenu, SidebarMenuItem } from '@/components/ui/sidebar'
import { Gem } from "lucide-vue-next"
import Users from '@/services/users'

const service = ref(false);

const load = async () => {
  try {
    service.value = await Users.service()
  } catch (e) {
    console.error(e)
  }
}

onMounted(async () => {
  await load()
})
</script>
