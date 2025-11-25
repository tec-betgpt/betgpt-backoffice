<template>
  <div class="space-y-6 p-10 max-[450px]:p-2 pb-16 w-full">
    <div class="w-full flex justify-between items-center max-sm:flex-col">
      <div class="space-y-0.">
        <h2 class="text-2xl font-bold tracking-tight">Gerenciar Segmentos</h2>
        <p class="text-muted-foreground">
          Crie e gerencie segmentos dinâmicos com regras personalizadas.
        </p>
      </div>

      <div class="w-full flex max-sm:justify-center justify-end max-sm:flex-col gap-2 max-sm:mt-3 items-center">
        <Button @click="openCreateModal" class="max-sm:w-full">
          <PlusIcon class="mr-2 h-4 w-4" />
          Novo Segmento
        </Button>
        <Button @click="showExport = true" :disabled="!exportSeg.length" class="max-sm:w-full">
          <Download /> Exportar
          {{ exportSeg.length > 1 ? "Segmentos" : "Segmento" }}
        </Button>
      </div>
    </div>

    <Card>
      <CardHeader>
        <CardTitle>Segmentos</CardTitle>
      </CardHeader>
      <CardContent class="py-4">
        <CustomDataTable
          :select="true"
          @update:selected="onSelectedChanged"
          :loading="isLoading"
          :data="segments"
          :columns="columns"
          :find="fetchSegments"
          :update-text="handleName"
          :search-fields="[{ key: 'name', placeholder: 'Buscar por nome...' }]"
        />

        <CustomPagination
          class="mt-4"
          :select-page="fetchSegments"
          :pages="pages"
          :per_pages="perPage"
          @update:perPages="args => perPage = args"
        />
      </CardContent>
    </Card>

    <Dialog v-model:open="showModal">
      <DialogContent class="sm:max-w-4xl max-h-[90dvh] overflow-y-scroll">
        <DialogHeader>
          <DialogTitle>
            {{ isEditing ? "Editar Segmento" : "Criar Novo Segmento" }}
          </DialogTitle>
          <DialogDescription>
            Defina as regras para seu segmento dinâmico
          </DialogDescription>
        </DialogHeader>

        <Card class="grid gap-4 p-4" v-for="(form, formIndex) in form">
          <div class="grid grid-cols-4 items-center gap-4">
            <Label for="name" class="text-right">Nome do Segmento</Label>
            <Input
              id="name"
              v-model="form.name"
              placeholder="Ex: Clientes VIP"
              class="col-span-3"
              required
            />
          </div>

          <div class="grid grid-cols-4 items-start gap-4">
            <Label for="description" class="text-right mt-2">Descrição</Label>
            <Textarea
              id="description"
              v-model="form.description"
              placeholder="Descrição opcional do segmento"
              class="col-span-3"
              rows="2"
            />
          </div>

          <Separator class="my-4" />

          <div class="space-y-6">
            <div
              v-for="(group, groupIndex) in form.conditionGroups"
              :key="groupIndex"
              class="space-y-4"
            >
              <div class="flex items-center justify-between">
                <Label>Grupo de Condições {{ groupIndex + 1 }}</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  @click="removeConditionGroup(groupIndex, formIndex)"
                  class="text-destructive"
                >
                  <Trash2Icon class="h-4 w-4" />
                </Button>
              </div>

              <div class="space-y-1 pl-6 border-l-2 border-muted">
                <template
                  v-for="(condition, conditionIndex) in group.conditions"
                  :key="conditionIndex"
                >
                  <div
                    v-if="conditionIndex > 0"
                    class="flex justify-center h-8"
                  >
                    <ToggleGroup
                      v-model="condition.conditionOperator"
                      type="single"
                      variant="outline"
                      class="h-8"
                    >
                      <ToggleGroupItem value="AND" class="h-8 px-3"
                        >E</ToggleGroupItem
                      >
                      <ToggleGroupItem value="OR" class="h-8 px-3"
                        >OU</ToggleGroupItem
                      >
                    </ToggleGroup>
                  </div>

                  <div class="flex items-center gap-2 py-1">
                    <Select
                      v-model="condition.field"
                      class="flex-1 min-w-[120px]"
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um campo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>{{ $t(group.name) }}</SelectLabel>
                          <SelectItem
                            v-for="field in group.fields"
                            :key="field.field_key"
                            :value="field.field_key"
                          >
                            {{ $t(field.label) }}
                          </SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>

                    <Select
                      v-model="condition.operator"
                      class="flex-1 min-w-[120px]"
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Operador" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Operadores</SelectLabel>
                          <SelectItem
                            v-for="op in getOperators(
                              condition,
                              groupIndex,
                              formIndex
                            )"
                            :key="op"
                            :value="op"
                          >
                            {{ $t(op) }}
                          </SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>

                    <Input
                      v-if="
                        showTextInput(condition, groupIndex, formIndex) &&
                        !['empty', 'not_empty'].includes(condition.operator)
                      "
                      v-model="condition.value"
                      placeholder="Valor"
                      class="flex-1 min-w-[240px]"
                    />

                    <Input
                      v-else-if="
                        showNumberInput(condition, groupIndex, formIndex) &&
                        !['empty', 'not_empty'].includes(condition.operator)
                      "
                      v-model.number="condition.value"
                      placeholder="Número"
                      type="number"
                      class="flex-1"
                    />

                    <div
                      v-else-if="
                        showDateInput(condition, groupIndex, formIndex) &&
                        !['empty', 'not_empty'].includes(condition.operator)
                      "
                      class="flex items-center gap-2 flex-1"
                    >
                      <Select v-model="condition.dateType" class="flex-1">
                        <SelectTrigger>
                          <SelectValue placeholder="Tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectLabel>Tipo</SelectLabel>
                            <SelectItem value="actual_date"
                              >Data Atual</SelectItem
                            >
                            <SelectItem value="custom_date"
                              >Escolher Data</SelectItem
                            >
                          </SelectGroup>
                        </SelectContent>
                      </Select>

                      <template v-if="condition.dateType === 'custom_date'">
                        <Popover>
                          <PopoverTrigger as-child>
                            <Button variant="outline" class="flex-1">
                              {{ condition.value || "Selecione" }}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent class="w-auto p-0">
                            <Calendar v-model="condition.value" />
                          </PopoverContent>
                        </Popover>
                      </template>

                      <template v-else>
                        <Select v-model="condition.dateModifier">
                          <SelectTrigger>
                            <SelectValue placeholder="Precisão" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              <SelectLabel>Precisão</SelectLabel>
                              <SelectItem value="exact">Exatamente</SelectItem>
                              <SelectItem value="plus">Mais</SelectItem>
                              <SelectItem value="minus">Menos</SelectItem>
                            </SelectGroup>
                          </SelectContent>
                        </Select>

                        <Input
                          v-if="
                            ['plus', 'minus'].includes(condition.dateModifier)
                          "
                          v-model.number="condition.daysOffset"
                          type="number"
                          placeholder="Dias"
                          class="w-20"
                          min="0"
                          max="365"
                        />
                      </template>

                      <Select v-model="condition.dateFilter" class="flex-1">
                        <SelectTrigger>
                          <SelectValue placeholder="Filtrar por" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectLabel>Filtrar por</SelectLabel>
                            <SelectItem value="full_date"
                              >Data Completa</SelectItem
                            >
                            <SelectItem value="m-d">Mês e Dia</SelectItem>
                            <SelectItem value="m">Mês</SelectItem>
                            <SelectItem value="d">Dia</SelectItem>
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </div>

                    <Select
                      v-else-if="
                        showBooleanInput(condition, groupIndex, formIndex)
                      "
                      v-model="condition.value"
                      class="flex-1"
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Sim</SelectItem>
                        <SelectItem value="false">Não</SelectItem>
                      </SelectContent>
                    </Select>

                    <Button
                      v-if="group.conditions.length > 1"
                      variant="ghost"
                      size="sm"
                      @click="
                        removeCondition(groupIndex, conditionIndex, formIndex)
                      "
                      class="text-destructive"
                    >
                      <Trash2Icon class="h-4 w-4" />
                    </Button>
                  </div>
                </template>

                <Button
                  variant="outline"
                  size="sm"
                  @click="addCondition(groupIndex, formIndex)"
                  class="mt-2"
                >
                  <PlusIcon class="mr-2 h-4 w-4" />
                  Adicionar Condição
                </Button>
              </div>

              <div
                v-if="groupIndex < form.conditionGroups.length - 1"
                class="flex justify-center"
              >
                <ToggleGroup
                  v-model="group.groupOperator"
                  type="single"
                  variant="outline"
                  class="h-8"
                >
                  <ToggleGroupItem value="AND" class="h-8 px-3"
                    >E</ToggleGroupItem
                  >
                  <ToggleGroupItem value="OR" class="h-8 px-3"
                    >OU</ToggleGroupItem
                  >
                </ToggleGroup>
              </div>
            </div>

            <Button variant="outline" @click="addConditionGroup(formIndex)">
              <PlusIcon class="mr-2 h-4 w-4" />
              Adicionar Grupo de Condições
            </Button>
          </div>

          <Separator class="my-4" />

          <div class="grid grid-cols-4 items-start gap-4">
            <Label class="text-right mt-2">Segmentos Salvos</Label>
            <div class="col-span-3 space-y-2">
              <Select
                v-model="selectedSavedSegment"
                @update:model-value="
                  (value) => {
                    loadSavedSegment(value, formIndex);
                  }
                "
              >
                <SelectTrigger>
                  <SelectValue placeholder="Carregar segmento salvo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Segmentos</SelectLabel>
                    <SelectItem
                      v-for="segment in savedSegments"
                      :key="segment.id"
                      :value="segment.id"
                    >
                      {{ segment.name }} ({{
                        segment.condition_groups.reduce(
                          (acc, g) => acc + g.conditions.length,
                          0
                        )
                      }}
                      condições)
                    </SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>

              <div class="flex gap-2">
                <Button
                  variant="outline"
                  @click="clearSelectedSegment"
                  :disabled="!selectedSavedSegment"
                >
                  <XIcon class="mr-2 h-4 w-4" />
                  Limpar Seleção
                </Button>
                <Button variant="outline" @click="clearAllConditions">
                  <Trash2Icon class="mr-2 h-4 w-4" />
                  Limpar Todas as Condições
                </Button>
              </div>
            </div>
          </div>
        </Card>

        <DialogFooter>
          <Button variant="outline" @click="showModal = false">
            Cancelar
          </Button>
          <Button type="submit" @click="saveSegment" :disabled="isProcessing">
            <Loader2Icon
              v-if="isProcessing"
              class="mr-2 h-4 w-4 animate-spin"
            />
            {{ isEditing ? "Salvar Alterações" : "Criar Segmento" }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <Dialog v-model:open="showContactsDialog">
      <DialogContent class="sm:max-w-6xl h-[80vh]">
        <DialogHeader>
          <DialogTitle>Contatos do Segmento</DialogTitle>
          <DialogDescription>
            Lista de contatos que atendem às condições do segmento
            <span v-if="contacts.length" class="text-foreground">
              ({{ contacts.length }} de
              {{
                segments.find((s) => s.id === currentSegmentId)
                  ?.total_contacts || 0
              }})
            </span>
          </DialogDescription>
        </DialogHeader>

        <div class="h-full overflow-auto">
          <CustomDataInfinite
            :loading="isLoadingContacts"
            :columns="contactsColumns"
            :data="contacts"
            :update-text="setSearch"
            :find="fetchContacts"
            :has-more="hasMoreContacts"
            :current-page="currentContactsPage"
            :search-fields="[
              {
                key: 'all_fields',
                placeholder: 'Buscar por nome ou e-mail...',
              },
            ]"
            @load-more="loadMoreContacts"
            @reset="resetContactsData"
            :exportable="true"
            @export="handleExportContacts"
          />
        </div>
      </DialogContent>
    </Dialog>

    <Dialog v-model:open="showExport">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Exportar Segmentos</DialogTitle>
        </DialogHeader>
        <DialogDescription>
          Selecione os projetos que irão receber os segmentos selecionados.
        </DialogDescription>
        <div class="flex flex-col gap-2">
          <div
            v-for="project in listGroupProject"
            class="flex items-center gap-2"
          >
            <Checkbox
              :class="{ hidden: activeGroupProjectId === project.id }"
              :checked="selectProjects.includes(project.id)"
              :id="project.id"
              @update:checked="
                (value) =>
                  value
                    ? selectProjects.push(project.id)
                    : selectProjects.splice(
                        selectProjects.indexOf(project.id),
                        1
                      )
              "
            />
            <label
              :for="project.id"
              class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              :class="{ hidden: activeGroupProjectId === project.id }"
            >
              {{ project.name }}
            </label>
          </div>
        </div>
        <DialogFooter>
          <Button @click="exportSegment">Exportar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <div
      v-if="showSheet"
      class="fixed inset-0 z-40 bg-black/80"
      @click="showSheet = false"
    ></div>
    <div
      :class="[
        'fixed top-0 right-0 z-50 h-full w-3/5 transform bg-background p-6 shadow-lg transition-transform duration-300 ease-in-out',
        showSheet ? 'translate-x-0' : 'translate-x-full',
      ]"
    >
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-semibold">Criar Público Alvo</h2>
        <Button variant="ghost" @click="showSheet = false">
          <XIcon class="h-4 w-4" />
        </Button>
      </div>
      <p class="text-sm text-muted-foreground">
        Crie um novo público alvo para o segmento: {{ currentSegment?.name }}
      </p>

      <div class="mt-4 h-[calc(100%-8rem)] overflow-y-auto pr-4">
        <div class="space-y-4">
          <div class="grid grid-cols-4 items-center gap-4">
            <Label for="ta-name" class="text-right">Nome</Label>
            <Input id="ta-name" v-model="targetAudienceForm.name" placeholder="Ex: Compradores de alto valor" class="col-span-3" />
          </div>
          <div class="grid grid-cols-4 items-start gap-4">
            <Label for="ta-description" class="text-right mt-2">Descrição</Label>
            <Textarea id="ta-description" v-model="targetAudienceForm.description" placeholder="Descrição opcional" class="col-span-3" rows="2" />
          </div>
          <div class="grid grid-cols-4 items-center gap-4">
            <div class="text-right flex items-center justify-end gap-1">
                <Label for="ta-duration">Duração da Adesão</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <InfoIcon class="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Número de dias que um contato permanecerá no público.<br>Deixe em branco para adesão permanente.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
            </div>
            <Input id="ta-duration"  v-model="targetAudienceForm.duration" placeholder="Permanente" class="col-span-3" />
          </div>
          <div class="grid grid-cols-4 items-start gap-4">
            <Label class="text-right mt-2">Sincronizar com</Label>
            <div class="col-span-3 space-y-2">
              <div v-for="provider in availableProviders" :key="provider.id" class="flex items-center gap-2">
                <Checkbox
                    :id="'provider-' + provider.id"
                    :checked="targetAudienceForm.sync_providers?.includes(provider.id)"
                    @update:checked="(checked) => updateSyncProviders(checked, provider.id)"
                />
                <Label :for="'provider-' + provider.id" class="font-normal">{{ provider.label }}</Label>
              </div>
            </div>
          </div>
          <Separator class="my-4" />

          <div class="space-y-4">
            <template v-for="(group, groupIndex) in targetAudienceForm.condition_groups" :key="groupIndex">
                <div v-if="groupIndex > 0" class="relative flex justify-center">
                    <div class="absolute inset-0 flex items-center">
                        <span class="w-full border-t"></span>
                    </div>
                    <div class="relative flex justify-center text-xs uppercase">
                        <span class="bg-background px-2 text-muted-foreground font-semibold">E</span>
                    </div>
                </div>

                <div class="space-y-4 p-4 border rounded-md">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-4">
                            <Label>Grupo de Condições {{ groupIndex + 1 }}</Label>
                             <div class="flex items-center gap-2">
                                <Label class="text-sm text-muted-foreground">Lógica interna:</Label>
                                <ToggleGroup
                                    v-model="group.logic_operator"
                                    type="single"
                                    variant="outline"
                                    class="h-8"
                                >
                                    <ToggleGroupItem value="AND" class="h-8 px-3">E</ToggleGroupItem>
                                    <ToggleGroupItem value="OR" class="h-8 px-3">OU</ToggleGroupItem>
                                </ToggleGroup>
                            </div>
                        </div>
                        <Button
                            v-if="targetAudienceForm.condition_groups.length > 1"
                            variant="ghost"
                            size="sm"
                            @click="removeTaConditionGroup(groupIndex)"
                            class="text-destructive"
                        >
                            <Trash2Icon class="h-4 w-4" />
                        </Button>
                    </div>

                    <div class="space-y-3">
                        <template v-for="(condition, conditionIndex) in group.conditions" :key="conditionIndex">
                           <div v-if="conditionIndex > 0" class="flex justify-center items-center text-sm font-bold text-muted-foreground pt-2">
                                {{ group.logic_operator === 'AND' ? 'E' : 'OU' }}
                            </div>

                            <div class="flex items-center gap-2 py-1">
                                <Select v-model="condition.field" class="flex-1 min-w-[120px]">
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione um campo" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup v-for="fieldGroup in targetAudienceFields" :key="fieldGroup.name">
                                    <SelectLabel>{{ $t(fieldGroup.name) }}</SelectLabel>
                                    <SelectItem v-for="field in fieldGroup.fields" :key="field.field_key" :value="field.field_key">
                                        {{ $t(field.label) }}
                                    </SelectItem>
                                    </SelectGroup>
                                </SelectContent>
                                </Select>

                                <Select v-model="condition.operator" class="flex-1 min-w-[120px]">
                                <SelectTrigger>
                                    <SelectValue placeholder="Operador" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                    <SelectLabel>Operadores</SelectLabel>
                                    <SelectItem v-for="op in getTaOperators(condition)" :key="op" :value="op">
                                        {{ $t(op) }}
                                    </SelectItem>
                                    </SelectGroup>
                                </SelectContent>
                                </Select>

                                <Input
                                v-if="showTaTextInput(condition) && !['empty', 'not_empty'].includes(condition.operator)"
                                v-model="condition.value"
                                placeholder="Valor"
                                class="flex-1 min-w-[240px]"
                                />

                                <Input
                                v-else-if="showTaNumberInput(condition) && !['empty', 'not_empty'].includes(condition.operator)"
                                v-model.number="condition.value"
                                placeholder="Número"
                                type="number"
                                class="flex-1"
                                />

                                <Select
                                v-else-if="showTaBooleanInput(condition)"
                                v-model="condition.value"
                                class="flex-1"
                                >
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="true">Sim</SelectItem>
                                    <SelectItem value="false">Não</SelectItem>
                                </SelectContent>
                                </Select>

                                <Button v-if="group.conditions.length > 1" variant="ghost" size="sm" @click="removeTaCondition(groupIndex, conditionIndex)" class="text-destructive">
                                <Trash2Icon class="h-4 w-4" />
                                </Button>
                            </div>
                        </template>

                        <Button variant="outline" size="sm" @click="addTaCondition(groupIndex)" class="mt-2">
                        <PlusIcon class="mr-2 h-4 w-4" />
                        Adicionar Condição
                        </Button>
                    </div>
                </div>
            </template>

            <Button variant="outline" @click="addTaConditionGroup">
              <PlusIcon class="mr-2 h-4 w-4" />
              Adicionar Grupo de Condições
            </Button>
          </div>
        </div>
      </div>
      <div class="mt-auto pt-6 flex justify-end gap-2">
         <Button variant="outline" @click="showSheet = false">Cancelar</Button>
         <Button @click="saveTargetAudience" :disabled="isProcessing">
            <Loader2Icon v-if="isProcessing" class="mr-2 h-4 w-4 animate-spin" />
            Salvar
         </Button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { h, ref, onMounted, watch } from "vue";
import Segments from "@/services/segments";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useToast } from "@/components/ui/toast/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  ArrowDown,
  ArrowUp,
  RefreshCcw,
  UploadIcon,
  Download,
} from "lucide-vue-next";
import { CaretSortIcon } from "@radix-icons/vue";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  PlusIcon,
  XIcon,
  Trash2Icon,
  Loader2Icon,
  CalendarIcon,
  MoreHorizontalIcon,
  InfoIcon,
} from "lucide-vue-next";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import CustomDataTable from "@/components/custom/CustomDataTable.vue";
import CustomPagination from "@/components/custom/CustomPagination.vue";
import CustomDataInfinite from "@/components/custom/CustomDataInfinite.vue";
import { useWorkspaceStore } from "@/stores/workspace";
import { createColumnHelper } from "@tanstack/vue-table";
import { useI18n } from "vue-i18n";
import { Checkbox } from "@/components/ui/checkbox";
import { useRouter } from "vue-router";
import TargetAudience from "@/services/targetAudience";

const { t } = useI18n();
const { toast } = useToast();
const router = useRouter();
const isLoading = ref(false);
const isProcessing = ref(false);
const showModal = ref(false);
const showSheet = ref(false);
const currentSegment = ref(null);
const showExport = ref(false);
const isEditing = ref(false);
const selectedSavedSegment = ref<number | null>(null);
const workspaceStore = useWorkspaceStore();
const activeGroupProjectId = workspaceStore.activeGroupProject?.id ?? null;
const listGroupProject = workspaceStore.group_projects.filter(
  (value) => value.id !== activeGroupProjectId
);

const showContactsDialog = ref(false);
const isLoadingContacts = ref(false);
const hasMoreContacts = ref(false);
const currentContactsPage = ref(1);
const contacts = ref<any[]>([]);
const currentSegmentId = ref<number | null>(null);
const operatorMap = {
  string: [
    "equals",
    "not_equals",
    "contains",
    "not_contains",
    "starts_with",
    "not_starts_with",
    "ends_with",
    "empty",
    "not_empty",
  ],
  number: [
    "equals",
    "not_equals",
    "greater_than",
    "less_than",
    "greater_or_equal",
    "less_or_equal",
    "empty",
    "not_empty",
  ],
  date: [
    "equals",
    "before",
    "after",
    "on_or_before",
    "on_or_after",
    "empty",
    "not_empty",
  ],
  boolean: ["is", "is_not", "empty", "not_empty"],
};
const availableProviders = [
  { id: 'meta', label: 'Meta Ads' },
 // { id: 'google-analytics', label: 'Google Analytics' }
];

const exportSeg = ref([]);
const selectProjects = ref([]);
const form = ref([
  {
    id: null as number | null,
    name: "",
    description: "",
    globalOperator: "AND" as "AND" | "OR",
    conditionGroups: [] as Array<{
      name: string;
      groupOperator: "AND" | "OR";
      fields: Array<{
        field_key: string;
        label: string;
        data_type: string;
        [key: string]: any;
      }>;
      conditions: Array<{
        conditionOperator: "AND" | "OR";
        field: string;
        operator: string;
        value: any;
        modifier?: string;
        dateType?: "actual_date" | "custom_date";
        dateModifier?: string;
        dateFilter?: string;
        daysOffset?: number;
      }>;
    }>,
  },
]);


const targetAudienceForm = ref({
  id: null,
  name: "",
  description: "",
  duration: null,
  condition_groups: [],
  sync_providers: [''],
});
const targetAudienceFields = ref([]);


const segments = ref<Array<any>>([]);
const savedSegments = ref<Array<any>>([]);
const allFields = ref<Array<any>>([]);
const nameSegment = ref();
const orderId = ref("");
const order = ref(false);
const segmentColumnHelper = createColumnHelper<SegmentData>();
const perPage = ref(10);
interface SegmentData {
  id: number;
  name: string;
  description: string;
}
const onSelectedChanged = (value) => {
  exportSeg.value = value.map((v) => v.id);
};
const getField = (condition: any, groupIndex: number, formIndex: number) => {
  const group = form.value[formIndex].conditionGroups[groupIndex];
  return condition?.field
    ? group.fields.find((f) => f.field_key === condition.field)
    : null;
};

const getOperators = (
  condition: any,
  groupIndex: number,
  formIndex: number
) => {
  const field = getField(condition, groupIndex, formIndex);
  return field
    ? operatorMap[field.data_type as keyof typeof operatorMap] || []
    : [];
};

const showTextInput = (condition: any, groupIndex: number, formIndex: number) =>
  getField(condition, groupIndex, formIndex)?.data_type === "string";

const showNumberInput = (
  condition: any,
  groupIndex: number,
  formIndex: number
) => getField(condition, groupIndex, formIndex)?.data_type === "number";

const showDateInput = (condition: any, groupIndex: number, formIndex: number) =>
  getField(condition, groupIndex, formIndex)?.data_type === "date";

const showBooleanInput = (
  condition: any,
  groupIndex: number,
  formIndex: number
) => getField(condition, groupIndex, formIndex)?.data_type === "boolean";

const fetchSegmentFields = async () => {
  try {
    const response = await Segments.groups();
    if (Array.isArray(response.data)) {
      allFields.value = response.data.map((group) => ({
        name: group.name,
        fields: group.fields.map((field) => ({
          ...field,
          field_key: field.field_key || `field_${field.id}`,
        })),
      }));
      return true;
    }
    throw new Error("Estrutura de dados inesperada");
  } catch (error) {
    console.error("Erro ao carregar campos:", error);
    toast({
      title: "Erro",
      description: "Não foi possível carregar os campos de condição",
      variant: "destructive",
    });
    return false;
  }
};

const openCreateModal = () => {
  resetForm();
  isEditing.value = false;
  showModal.value = true;
};

const resetForm = () => {
  form.value = [
    {
      id: null,
      name: "",
      description: "",
      globalOperator: "AND",
      conditionGroups: allFields.value.map((group) => ({
        name: group.name,
        groupOperator: "AND",
        fields: [...group.fields],
        conditions: [
          {
            conditionOperator: "AND",
            field: "",
            operator: "",
            value: "",
            modifier: "exact",
          },
        ],
      })),
    },
  ];
  selectedSavedSegment.value = null;
};

const updateFormFields = (formIndex: number) => {
  form.value[formIndex].conditionGroups.forEach((group) => {
    group.fields = [...allFields.value.flatMap((g) => g.fields)];
  });
};

const addConditionGroup = (index: number) => {
  form.value[index].conditionGroups.push({
    name: allFields.value[0]?.name || "Novo Grupo",
    groupOperator: "AND",
    fields: [...(allFields.value[0]?.fields || [])],
    conditions: [
      {
        conditionOperator: "AND",
        field: "",
        operator: "",
        value: "",
        modifier: "exact",
      },
    ],
  });
};

const removeConditionGroup = (groupIndex: number, formIndex: number) => {
  if (form.value[formIndex].conditionGroups.length > 1) {
    form.value[formIndex].conditionGroups.splice(groupIndex, 1);
  } else {
    toast({
      title: "Aviso",
      description: "Você deve ter pelo menos um grupo de condições",
      variant: "destructive",
    });
  }
};

const addCondition = (groupIndex: number, formIndex: number) => {
  form.value[formIndex].conditionGroups[groupIndex].conditions.push({
    conditionOperator: "AND",
    field: "",
    operator: "",
    value: "",
    modifier: "exact",
  });
};
const updateSyncProviders = (checked, providerId) => {
  const providers = targetAudienceForm.value.sync_providers;
  const index = providers.indexOf(providerId);

  if (checked && index === -1) {
    providers.push(providerId);
  } else if (!checked && index !== -1) {
    providers.splice(index, 1);
  }
};
const removeCondition = (
  groupIndex: number,
  conditionIndex: number,
  formIndex: number
) => {
  if (form.value[formIndex].conditionGroups[groupIndex].conditions.length > 1) {
    form.value[formIndex].conditionGroups[groupIndex].conditions.splice(
      conditionIndex,
      1
    );
  } else {
    toast({
      title: "Aviso",
      description: "Você deve ter pelo menos uma condição no grupo",
      variant: "destructive",
    });
  }
};

const loadSavedSegment = async (segmentId: number, formIndex: number) => {
  try {
    isLoading.value = true;
    const segment = savedSegments.value.find((s) => s.id === segmentId);
    if (!segment) {
      toast({
        title: "Aviso",
        description: "Segmento não encontrado",
        variant: "destructive",
      });
      return;
    }

    const parseConditionValue = (condition: any) => {
      try {
        if (typeof condition.value === "object") {
          return condition.value.value ? condition.value : condition;
        }
        const parsed = JSON.parse(condition.value);
        return parsed.value ? parsed : parsed;
      } catch {
        return {
          value: condition.value,
          type: "custom_date",
          dateModifier: "exact",
          dateFilter: "full_date",
          daysOffset: 0,
        };
      }
    };

    const newConditionGroups = segment.condition_groups.map((group) => {
      return {
        name: "Grupo de Condições",
        groupOperator: group.logic_operator,
        fields: [...allFields.value.flatMap((g) => g.fields)],
        conditions: group.conditions.map((condition) => {
          const valueData = parseConditionValue(condition);
          const fieldType = condition.field?.data_type;

          const baseCondition = {
            conditionOperator: condition.logic_operator,
            field: condition.field?.field_key || "",
            operator: condition.operator,
            value: valueData.value?.value || valueData.value,
            modifier: condition.modifier || "exact",
          };

          if (fieldType === "date") {
            return {
              ...baseCondition,
              dateType:
                valueData.type || valueData.value?.type || "custom_date",
              dateModifier:
                valueData.dateModifier ||
                valueData.value?.dateModifier ||
                "exact",
              dateFilter:
                valueData.dateFilter ||
                valueData.value?.dateFilter ||
                "full_date",
              daysOffset:
                valueData.daysOffset || valueData.value?.daysOffset || 0,
              value:
                valueData.type === "custom_date" ||
                valueData.value?.type === "custom_date"
                  ? valueData.value?.value || valueData.value
                  : new Date().toISOString().split("T")[0],
            };
          }

          if (fieldType === "boolean") {
            return {
              ...baseCondition,
              value: String(valueData.value),
            };
          }

          return baseCondition;
        }),
      };
    });

    form.value = [
      {
        ...form.value[formIndex],
        conditionGroups:
          newConditionGroups.length > 0
            ? newConditionGroups
            : [
                {
                  name: "Novo Grupo",
                  groupOperator: "AND",
                  fields: [...allFields.value.flatMap((g) => g.fields)],
                  conditions: [
                    {
                      conditionOperator: "AND",
                      field: "",
                      operator: "",
                      value: "",
                      modifier: "exact",
                    },
                  ],
                },
              ],
      },
    ];

    form.value[formIndex].conditionGroups.forEach((group, groupIndex) => {
      group.conditions.forEach((condition) => {
        if (condition.field) {
          const validOperators = getOperators(condition, groupIndex, formIndex);
          if (validOperators && !validOperators.includes(condition.operator)) {
            condition.operator = "";
          }
        }
      });
    });
  } catch (error) {
    console.error("Error loading segment:", error);
    toast({
      title: "Erro",
      description: "Não foi possível carregar o segmento",
      variant: "destructive",
    });
  } finally {
    isLoading.value = false;
  }
};

const clearSelectedSegment = () => {
  selectedSavedSegment.value = null;
  resetForm();
};

const clearAllConditions = (formIndex: number) => {
  form.value[formIndex].conditionGroups = [
    {
      name: "Novo Grupo",
      groupOperator: "AND",
      fields: [...allFields.value.flatMap((g) => g.fields)],
      conditions: [
        {
          conditionOperator: "AND",
          field: "",
          operator: "",
          value: "",
          modifier: "exact",
        },
      ],
    },
  ];
};

const handleName = (text: string) => {
  nameSegment.value = text;
};

function handlerOrder(column: string, direction: boolean) {
  if (column) {
    orderId.value = column;
    order.value = direction;
  }
  fetchSegments();
}

const fetchSegments = async (current: number = pages.value.current) => {
  try {
    isLoading.value = true;
    const params = {
      page: current,
      filter_id: activeGroupProjectId,
      find_name: nameSegment.value,
      sort_by: orderId.value,
      sort_order: order.value ? "asc" : "desc",
      per_page: perPage.value,
    };
    const response = await Segments.index(params);
    segments.value = response.data.segments || [];
    pages.value = {
      current: response.data.pagination.current_page,
      last: response.data.pagination.last_page,
      total: response.data.pagination.total,
    };

    savedSegments.value = [...segments.value];
  } catch (error) {
    console.error("Error loading segments:", error);
    toast({
      title: "Erro",
      description: "Não foi possível carregar os segmentos",
      variant: "destructive",
    });
  } finally {
    isLoading.value = false;
  }
};
watch(perPage,()=>fetchSegments(1));
const prepareConditionValue = (
  condition: any,
  groupIndex: number,
  formIndex: number
) => {
  const field = getField(condition, groupIndex, formIndex);
  if (!field) return condition.value;

  if (["empty", "not_empty"].includes(condition.operator)) {
    return null;
  }

  if (field.data_type === "date") {
    if (condition.dateType === "custom_date") {
      return {
        type: "custom_date",
        value: condition.value,
        dateModifier: null,
        dateFilter: "full_date",
        daysOffset: 0,
      };
    } else {
      return {
        type: "actual_date",
        value: "actual_date",
        dateModifier: condition.dateModifier,
        dateFilter: condition.dateFilter,
        daysOffset: condition.daysOffset || 0,
      };
    }
  }

  return condition.value;
};

const saveSegment = async () => {
  isProcessing.value = true;

  try {
    if (!form.value.filter((f) => f.name)) {
      throw new Error("O nome do segmento é obrigatório");
    }

    const hasValidConditions = form.value
      .map((seg) => seg.conditionGroups)
      .some((group) =>
        group.map((value) =>
          value.conditions.some(
            (condition) =>
              condition.field &&
              condition.operator &&
              (["empty", "not_empty"].includes(condition.operator) ||
                condition.value !== undefined)
          )
        )
      );

    if (!hasValidConditions) {
      throw new Error("Defina pelo menos uma condição válida");
    }

    const payload = form.value.map((seg, index) => ({
      name: seg.name,
      description: seg.description,
      filter_id: activeGroupProjectId,
      conditions: {
        global_operator: seg.globalOperator,
        groups: seg.conditionGroups.map((group, groupIndex) => ({
          group_operator: group.groupOperator,
          conditions: group.conditions.map((condition) => {
            const field = getField(condition, groupIndex, index);

            const value = ["empty", "not_empty"].includes(condition.operator)
              ? ""
              : prepareConditionValue(condition, groupIndex, index);

            return {
              field: condition.field,
              operator: condition.operator,
              value: value,
              condition_operator: condition.conditionOperator,
              modifier: condition.modifier,
              dateType: condition.dateType,
              dateModifier: condition.dateModifier,
              dateFilter: condition.dateFilter,
              daysOffset: condition.daysOffset,
            };
          }),
        })),
      },
    }));

    if (isEditing.value && form.value[0].id) {
      await Segments.update(form.value[0].id, payload);
    } else {
      await Segments.create(payload);
    }

    await fetchSegments();
    selectedSavedSegment.value = null;
    showModal.value = false;
    toast({
      title: "Sucesso",
      description: isEditing.value
        ? "Segmento atualizado com sucesso"
        : "Segmento criado com sucesso",
      variant: "default",
    });
  } catch (error) {
    toast({
      title: "Erro",
      description: error.message || "Ocorreu um erro ao salvar o segmento",
      variant: "destructive",
    });
  } finally {
    isProcessing.value = false;
  }
};

const deleteSegment = async (segmentId: number) => {
  try {
    isLoading.value = true;
    await Segments.delete(segmentId);
    await fetchSegments();
    toast({
      title: "Sucesso",
      description: "Segmento removido com sucesso",
      variant: "default",
    });
  } catch (error) {
    toast({
      title: "Erro",
      description: "Não foi possível remover o segmento",
      variant: "destructive",
    });
  } finally {
    isLoading.value = false;
  }
};

const handleExportContacts = async () => {
  if (!currentSegmentId.value) {
    console.error("currentSegmentId is not defined");
    return;
  }

  router.push({
    name: "exports",
    query: {
      type: "segments",
      target_id: currentSegmentId.value,
    },
  });
};

const handleEdit = (segment: any) => {
  resetForm();
  isEditing.value = true;
  form.value[0].id = segment.id;
  form.value[0].name = segment.name;
  form.value[0].description = segment.description;
  form.value[0].globalOperator = "AND";
  selectedSavedSegment.value = segment.id;
  loadSavedSegment(segment.id, 0);
  showModal.value = true;
};

const formatDate = (dateString: string) => {
  const options: Intl.DateTimeFormatOptions = {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  };
  return new Date(dateString).toLocaleDateString("pt-BR", options);
};

const loadMoreContacts = async () => {
  if (!hasMoreContacts.value || isLoadingContacts.value) return;

  const nextPage = currentContactsPage.value + 1;
  await fetchContacts(nextPage);
};

const openContactsDialog = (segmentId: number) => {
  const segment = segments.value.find((s) => s.id === segmentId);

  if (!segment || segment.total_contacts <= 0) {
    toast({
      title: "Aviso",
      description: "Este segmento não possui contatos",
      variant: "default",
    });
    return;
  }

  currentSegmentId.value = segmentId;
  showContactsDialog.value = true;

  contacts.value = segment.initial_contacts || [];
  currentContactsPage.value = 1;
  hasMoreContacts.value = segment.total_contacts > contacts.value.length;
};

const resetContactsData = () => {
  contacts.value = [];
  currentContactsPage.value = 1;
  hasMoreContacts.value = false;
};

const exportSegment = async () => {
  try {
    await Segments.export({
      project_id: activeGroupProjectId,
      segment_ids: exportSeg.value,
      target_project_ids: selectProjects.value,
    });
    toast({
      title: "Exportação iniciada",
      description: "Exportação do Segmento em andamento...",
      variant: "default",
    });

    showExport.value = false;
    toast({
      title: "Sucesso",
      description: "Segmento exportado com sucesso",
      variant: "default",
    });
  } catch (error) {
    console.error("Error exporting segment:", error);
    toast({
      title: "Erro",
      description: "Não foi possível exportar o segmento",
      variant: "destructive",
    });
  }
};

const importSegment = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  if (!input.files?.length) return;

  try {
    const files = input.files;
    var f = [];
    for (const file of files) {
      const fileContent = await file.text();
      var json = JSON.parse(fileContent);
      if (Array.isArray(json)) {
        json.forEach((v) => f.push(v));
      } else {
        f.push(json);
      }
    }
    form.value = f.map((segmentData) => ({
      id: null,
      name: segmentData.name + " (Importado)",
      description: segmentData.description,
      globalOperator: segmentData.conditions.global_operator,
      conditionGroups: segmentData.conditions.groups.map((group: any) => ({
        name: "Grupo Importado",
        groupOperator: group.group_operator,
        fields: [...allFields.value.flatMap((g) => g.fields)],
        conditions: group.conditions.map((condition: any) => ({
          conditionOperator: condition.condition_operator,
          field: condition.field,
          operator: condition.operator,
          value: condition.value,
          modifier: condition.modifier || "exact",
          dateType: condition.dateType,
          dateModifier: condition.dateModifier,
          dateFilter: condition.dateFilter,
          daysOffset: condition.daysOffset,
        })),
      })),
    }));
    showModal.value = true;
    isEditing.value = false;
    toast({
      title: "Sucesso",
      description:
        "Segmento importado com sucesso. Revise as condições antes de salvar.",
      variant: "default",
    });
  } catch (error) {
    console.error("Error importing segment:", error);
    toast({
      title: "Erro",
      description: "Não foi possível importar o segmento. Verifique o arquivo.",
      variant: "destructive",
    });
  } finally {
    input.value = "";
  }
};

const getInitialContacts = (segmentId: number) => {
  const segment = segments.value.find((s) => s.id === segmentId);
  return segment?.initial_contacts || [];
};

const orderContacts = ref();
const directionContacts = ref(false);
const columnHelperContacts = createColumnHelper<User>();
function createHeaderButton(label: string, columnKey: string) {
  return h(
    Button,
    {
      variant: orderContacts.value === columnKey ? "default" : "ghost",
      onClick: () => {
        orderContacts.value = columnKey;
        directionContacts.value = !directionContacts.value;
        fetchContacts();
      },
      class: "h-fit text-pretty my-1",
    },
    () => [
      label,
      h(
        orderContacts.value === columnKey
          ? directionContacts.value
            ? ArrowDown
            : ArrowUp
          : CaretSortIcon,
        { class: "" }
      ),
    ]
  );
}

const searchValues = ref<Record<string, string>>({});
const setSearch = (values: Record<string, string>) => {
  searchValues.value = values;
};

const fetchContacts = async (page: number) => {
  if (!currentSegmentId.value) return;

  isLoadingContacts.value = true;

  try {
    const searchParams = Object.keys(searchValues.value).reduce((acc, key) => {
      if (searchValues.value[key]) {
        acc[key] = searchValues.value[key];
      }
      return acc;
    }, {} as Record<string, string>);

    const response = await Segments.contacts(currentSegmentId.value, {
      page,
      perPage: 20,
      ...searchParams,
      orderBy: orderContacts.value || "id",
      orderDirection: directionContacts.value ? "asc" : "desc",
    });

    if (page === 1) {
      contacts.value = response.data.players;
    } else {
      contacts.value = [...contacts.value, ...response.data.players];
    }

    hasMoreContacts.value = response.data.hasMore;
    currentContactsPage.value = page; // Atualiza a página atual

    if (page === 1) {
      const segmentIndex = segments.value.findIndex(
        (s) => s.id === currentSegmentId.value
      );
      if (segmentIndex !== -1) {
        segments.value[segmentIndex].initial_contacts = [
          ...response.data.players,
        ];
      }
    }
  } catch (error) {
    console.error("Error loading contacts:", error);
    toast({
      title: "Erro",
      description: "Não foi possível carregar os contatos",
      variant: "destructive",
    });
  } finally {
    isLoadingContacts.value = false;
  }
};

const isUpdating = ref<number | null>(null);

const forceSegmentUpdate = async (segmentId: number) => {
  isUpdating.value = segmentId;
  try {
    toast({
      title: "Sucesso",
      description: "Atualização do segmento iniciada...",
      variant: "default",
    });
    await Segments.forceUpdate(segmentId);
  } catch (error)
 {
    toast({
      title: "Erro",
      description:
        error.response?.data?.message || "Falha ao forçar atualização",
      variant: "destructive",
    });
  } finally {
    isUpdating.value = null;
  }
};


const getTaField = (condition) => {
  const allTaFields = targetAudienceFields.value.flatMap(g => g.fields);
  return condition?.field
    ? allTaFields.find((f) => f.field_key === condition.field)
    : null;
};

const getTaOperators = (condition) => {
  const field = getTaField(condition);
  return field ? field.operators || [] : [];
};

const showTaTextInput = (condition) => getTaField(condition)?.data_type === 'string';
const showTaNumberInput = (condition) => getTaField(condition)?.data_type === 'number';
const showTaBooleanInput = (condition) => getTaField(condition)?.data_type === 'boolean';


const addTaConditionGroup = () => {
  targetAudienceForm.value.condition_groups.push({
    logic_operator: "AND",
    conditions: [{ field: "", operator: "", value: "" }],
  });
};

const removeTaConditionGroup = (groupIndex) => {
  if (targetAudienceForm.value.condition_groups.length > 1) {
    targetAudienceForm.value.condition_groups.splice(groupIndex, 1);
  }
};

const addTaCondition = (groupIndex) => {
  targetAudienceForm.value.condition_groups[groupIndex].conditions.push({
    field: "",
    operator: "",
    value: "",
  });
};

const removeTaCondition = (groupIndex, conditionIndex) => {
  if (targetAudienceForm.value.condition_groups[groupIndex].conditions.length > 1) {
    targetAudienceForm.value.condition_groups[groupIndex].conditions.splice(conditionIndex, 1);
  }
};

const fetchTargetAudienceFields = async () => {
  try {
    const response = await TargetAudience.getAvailableConditions();
    if (Array.isArray(response)) {
      const groups = response.reduce((acc, field) => {
        if (!acc[field.source]) {
          acc[field.source] = {
            name: field.source,
            fields: []
          };
        }
        acc[field.source].fields.push({
          field_key: field.property,
          label: field.label,
          data_type: field.type,
          operators: field.operators,
          source: field.source,
        });
        return acc;
      }, {});

      targetAudienceFields.value = Object.values(groups);

    } else {
       throw new Error("Estrutura de dados inesperada para campos de público alvo");
    }
  } catch (error) {
    console.error("Erro ao carregar campos de público alvo:", error);
    toast({
      title: "Erro",
      description: "Não foi possível carregar os campos para o público alvo.",
      variant: "destructive",
    });
  }
};

const resetTargetAudienceForm = () => {
  targetAudienceForm.value = {
    name: "",
    description: "",
    duration: null,
    condition_groups: [
      {
        logic_operator: "AND",
        conditions: [{ field: "", operator: "", value: "" }],
      },
    ],
  };
};

const saveTargetAudience = async () => {
    isProcessing.value = true;
    try {
        if (!activeGroupProjectId) throw new Error("Nenhum projeto selecionado.");

        const payload = {
            project_id: workspaceStore.activeGroupProject.project_id,
            segment_id: currentSegment.value?.id,
            name: targetAudienceForm.value.name,
            description: targetAudienceForm.value.description,
            duration: targetAudienceForm.value.duration,
            condition_groups: targetAudienceForm.value.condition_groups.map(group => ({
                logic_operator: group.logic_operator,
                conditions: group.conditions.map(c => {
                    const field = getTaField(c);
                    if (!field || !c.operator || c.value === '') return null;
                    return {
                        source: field.source,
                        property: c.field,
                        operator: c.operator,
                        value: c.value,
                    };
                }).filter(Boolean)
            })).filter(g => g.conditions.length > 0)
        };

        if (!payload.name) throw new Error('O nome do público alvo é obrigatório.');
        if (payload.condition_groups.length === 0) throw new Error("Defina pelo menos uma condição válida.");

        await TargetAudience.store(payload);

        toast({
            title: "Sucesso!",
            description: "Público alvo salvo com sucesso."
        });
        showSheet.value = false;
    } catch(e) {
        toast({
            title: "Erro",
            description: e.message || "Não foi possível salvar o público alvo.",
            variant: "destructive"
        });
    } finally {
        isProcessing.value = false;
    }
}

function viewTargetAudience(segment) {
  if (segment.audiences && segment.audiences.length > 0) {
    const audienceId = segment.audiences[0].id;
    router.push({
      name: 'target-audiences',
      query: { openAudienceId: audienceId }
    });
  }
}

function createTargetAudience(segment) {
  currentSegment.value = segment;
  resetTargetAudienceForm();
  showSheet.value = true;
}

const columns = [
  segmentColumnHelper.accessor("name", {
    header({ column }) {
      return createHeaderButton(
        "Nome",
        "name",
        orderId.value,
        order.value,
        handlerOrder
      );
    },
    cell: ({ row }) => {
      return h("div", { class: "flex flex-col" }, [
        h("div", { class: "capitalize" }, row.getValue("name")),
        h(
          "div",
          {
            class: "text-xs text-muted-foreground mt-1 line-clamp-2",
            title: row.original.description,
          },
          row.original.description || "Sem descrição"
        ),
      ]);
    },
  }),
  {
    accessorKey: "total_contacts",
    header: "Total de Contatos",
    cell: ({ row }) => {
      const total = row.original.total_contacts;
      const hasContacts = total > 0;
      const lastExecuted = row.original.last_job_execute_at;

      return h(
        "div",
        {
          class: "flex items-center gap-2",
          onClick: hasContacts
            ? () => openContactsDialog(row.original.id)
            : undefined,
          style: {
            cursor: hasContacts ? "pointer" : "default",
            textDecoration: hasContacts ? "underline" : "none",
            opacity: hasContacts ? 1 : 0.5,
          },
        },
        [
          h("span", total || "0"),
          !lastExecuted &&
            h(
              "span",
              { class: "text-muted-foreground text-xs" },
              "(não executado)"
            ),
        ]
      );
    },
  },
  ,
  {
    accessorKey: "last_job_execute_at",
    header: "Última Atualização",
    cell: ({ row }) => {
      const date = row.original.last_job_execute_at;
      return h("div", { class: "flex items-center gap-2" }, [
        h("div", date ? formatDate(date) : "-"),
        h(
          Button,
          {
            variant: "ghost",
            size: "icon",
            class: "h-8 w-8",
            onClick: (e) => {
              e.stopPropagation();
              forceSegmentUpdate(row.original.id);
            },
            disabled: isUpdating.value === row.original.id,
          },
          [
            h(RefreshCcw, {
              class: "h-4 w-4",
              class: {
                "animate-spin": isUpdating.value === row.original.id,
              },
            }),
          ]
        ),
      ]);
    },
  },
  {
    accessorKey: "updated_at",
    header: "Editado pela última vez",
    cell: ({ row }) => {
      const date = row.original.updated_at;
      return h("div", date ? formatDate(date) : "-");
    },
  },
  {
    accessorKey: "actions",
    header: "Ações",
    cell: ({ row }) => {
      return h(DropdownMenu, {}, [
        h(
          DropdownMenuTrigger,
          { asChild: true },
          h(
            Button,
            {
              "aria-haspopup": "true",
              size: "icon",
              variant: "ghost",
              disabled: isLoading.value,
            },
            [
              h(MoreHorizontalIcon, { class: "h-4 w-4" }),
              h("span", { class: "sr-only" }, "Ações"),
            ]
          )
        ),
        h(DropdownMenuContent, { align: "end" }, [
          h(DropdownMenuLabel, {}, "Ações"),
          h(DropdownMenuSeparator, {}),
          h(
            DropdownMenuItem,
            {
              onClick: () => handleEdit(row.original),
            },
            "Editar"
          ),
          (row.original.audiences && row.original.audiences.length > 0)
            ? h(
                DropdownMenuItem,
                { onClick: () => viewTargetAudience(row.original) },
                "Ver Publico Alvo"
              )
            : h(
                DropdownMenuItem,
                { onClick: () => createTargetAudience(row.original) },
                "Criar Publico Alvo"
              ),
          h(
            DropdownMenuItem,
            {
              onClick: () => deleteSegment(row.original.id),
            },
            h("div", { class: "flex items-center text-destructive" }, "Remover")
          ),
        ]),
      ]);
    },
  },
];

const contactsColumns = [
  columnHelperContacts.accessor("id", {
    header({ column }) {
      return createHeaderButton("ID", "id");
    },
    cell: ({ row }) => h("div", {}, row.original.id),
  }),
  columnHelperContacts.accessor("name", {
    header({ column }) {
      return createHeaderButton("Nome", "name");
    },
    cell: ({ row }) =>
      h("div", { class: "capitalize" }, `${row.original.name}`),
  }),
  columnHelperContacts.accessor("email", {
    header({ column }) {
      return createHeaderButton("E-mail", "email");
    },
    cell: ({ row }) => h("div", {}, row.original.email),
  }),
];

const pages = ref({
  current: 1,
  total: 0,
  last: 0,
});

onMounted(async () => {
  isLoading.value = true;
  try {
    await fetchSegmentFields();
    await fetchTargetAudienceFields();
    await fetchSegments();
    resetForm();
  } catch (error) {
    console.error("Error loading data:", error);
  } finally {
    isLoading.value = false;
  }
});

watch(selectedSavedSegment, (newValue) => {
  if (!newValue && showModal.value) {
    resetForm();
  }
});

watch(
  () => form.value.map((f) => f.conditionGroups),
  (allGroups) => {
    allGroups.forEach((groups, formIndex) => {
      groups?.forEach((group, groupIndex) => {
        group?.conditions?.forEach((condition) => {
          if (condition.field && condition.operator) {
            const field = getField(condition, groupIndex, formIndex);
            if (field) {
              if (["empty", "not_empty"].includes(condition.operator)) {
                condition.value = "";
                condition.dateType = undefined;
                condition.dateModifier = undefined;
                condition.daysOffset = undefined;
              }

              if (
                field.data_type === "date" &&
                !showDateInput(condition, groupIndex, formIndex)
              ) {
                condition.dateType = undefined;
                condition.dateModifier = undefined;
                condition.daysOffset = undefined;
              }
            }
          }

          if (condition?.field && condition?.operator) {
            const validOperators = getOperators(
              condition,
              groupIndex,
              formIndex
            );
            if (
              validOperators &&
              !validOperators.includes(condition.operator)
            ) {
              condition.operator = "";
            }
          }
        });
      });
    });
  },
  { deep: true }
);

watch(
  () => targetAudienceForm.value.condition_groups,
  (groups) => {
    groups?.forEach((group) => {
      group?.conditions?.forEach((condition) => {
        if (condition.field) {
          const validOperators = getTaOperators(condition);
          if (validOperators && !validOperators.includes(condition.operator)) {
            condition.operator = "";
          }
        }
        if (condition.field && condition.operator) {
            const field = getTaField(condition);
            if (field && ["empty", "not_empty"].includes(condition.operator)) {
                condition.value = "";
            }
        }
      });
    });
  },
  { deep: true }
);
</script>
