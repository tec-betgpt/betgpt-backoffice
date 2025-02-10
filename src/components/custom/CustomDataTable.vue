<script setup lang="ts">
import { PropType, ref, watch } from "vue";
import {Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow} from "@/components/ui/table";
import { FlexRender, getCoreRowModel, useVueTable } from "@tanstack/vue-table";
import {Skeleton} from "@/components/ui/skeleton";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button"

const props = defineProps({
  columns: {
    type: Array as PropType<Array<any>>,
    required: true,
  },
  data: {
    type: Array as PropType<Array<Record<string, any>>>,
    required: true,
  },
  loading:{
    type: Boolean,
    required: true,
  },
  updateText:{
    type:Function,

  },
  find:{
    type: Function as ()=>{},

  },
  result:{

  },
  placeholder:{
    type: String,
  }

});

const dataTable = ref([...props.data]);
const name = ref()
const table = ref(
    useVueTable({
      data: dataTable.value,
      columns: props.columns,
      getCoreRowModel: getCoreRowModel(),
    })
);

watch(
    () => props.data,
    (newData) => {
      dataTable.value = [...newData]; // Atualiza os dados
      table.value = useVueTable({
        data: dataTable.value,
        columns: props.columns,
        getCoreRowModel: getCoreRowModel(),
      }); // Recria a tabela com os novos dados
    },
    { deep: true }
);
const checkIfEmpty = () => {
  if (!name.value) {
   props.find()
  }
};
watch(name,()=>{
  props.updateText(name.value)
})
</script>

<template>
    <div v-if="updateText" class="flex flex-col sm:flex-row gap-2">
      <Input class="sm:max-w-sm  w-full" :placeholder="placeholder?placeholder:'Buscar...'"
             v-model="name"
             @input="checkIfEmpty"
      />
      <Button  @click="find()" :disabled="loading">
        Buscar
      </Button>
      <div class=" flex flex-1 gap-2">

      </div>
      <slot>

      </slot>

    </div>

    <Table class="w-full my-2 ">

      <TableHeader>
        <TableRow v-for="headerGroup in table.getHeaderGroups()" :key="headerGroup.id">
          <TableHead v-for="header in headerGroup.headers" :key="header.id">
            <FlexRender :render="header.column.columnDef.header" :props="header.getContext()" />
          </TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        <template v-if="loading">
          <TableRow v-for="headerGroup in table.getHeaderGroups()" :key="`loading-${n}`">
            <TableCell  v-for="header in headerGroup.headers" :key="n">
              <Skeleton v-for="index in 5" class="h-4 w-full bg-gray-300 my-4"/>
            </TableCell>
          </TableRow>
        </template>
        <TableRow v-else v-for="row in table.getRowModel().rows" :key="row.id">
          <TableCell v-for="cell in row.getVisibleCells()" :key="cell.id">
            <FlexRender :render="cell.column.columnDef.cell" :props="cell.getContext()" />
          </TableCell>
        </TableRow>

      </TableBody>
      <TableFooter>
      <TableRow>
        <TableCell v-for="r in result">
          {{r}}
        </TableCell>
      </TableRow>
    </TableFooter>

    </Table>

</template>
