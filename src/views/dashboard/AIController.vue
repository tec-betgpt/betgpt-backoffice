<template>
  <div class="space-y-6 p-4 md:p-10 pb-16 w-full bg-slate-50/30 dark:bg-transparent min-h-screen transition-colors">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-foreground">
      <div>
        <h2 class="text-xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">Controlador de IA</h2>
        <p class="text-xs md:text-sm text-muted-foreground mt-1">Configure o comportamento, modelos e ferramentas disponíveis para a inteligência artificial.</p>
      </div>
      <div class="flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0">
        <Button variant="outline" size="sm" class="flex-1 sm:flex-none" @click="resetConfig">
          <RotateCcw class="mr-2 h-4 w-4" />
          Resetar
        </Button>
        <Button size="sm" class="flex-1 sm:flex-none shadow-sm" @click="saveConfig" :disabled="isSaving">
          <Save v-if="!isSaving" class="mr-2 h-4 w-4" />
          <Loader2 v-else class="mr-2 h-4 w-4 animate-spin" />
          Salvar Alterações
        </Button>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <!-- Coluna Esquerda: Configurações de Prompt e Modelo -->
      <div class="lg:col-span-8 space-y-6">
        <!-- Prompt do Sistema -->
        <Card class="shadow-sm border-none md:border">
          <CardHeader>
            <div class="flex items-center gap-2">
              <Terminal class="h-5 w-5 text-indigo-500" />
              <CardTitle class="text-lg">Prompt do Sistema</CardTitle>
            </div>
            <CardDescription>
              Instruções base que definem a personalidade e as regras de operação da IA.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Skeleton v-if="isLoading" class="h-[300px] w-full rounded-xl" />
            <Textarea 
              v-else
              v-model="config.system_prompt" 
              placeholder="Ex: Você é um assistente especializado em análise de dados de apostas..." 
              class="min-h-[300px] font-mono text-sm resize-none bg-slate-50/50 dark:bg-slate-900/20"
            />
          </CardContent>
        </Card>

        <!-- Parâmetros -->
        <Card class="shadow-sm border-none md:border">
          <CardHeader>
            <div class="flex items-center gap-2">
              <Settings2 class="h-5 w-5 text-amber-500" />
              <CardTitle class="text-lg">Parâmetros de Geração</CardTitle>
            </div>
            <CardDescription>
              Ajuste a criatividade e o limite de resposta da inteligência artificial.
            </CardDescription>
          </CardHeader>
          <CardContent class="grid grid-cols-1 md:grid-cols-2 gap-8 py-6 text-foreground">
            <template v-if="isLoading">
              <div class="space-y-4" v-for="i in 2" :key="i">
                <Skeleton class="h-4 w-24" />
                <Skeleton class="h-2 w-full" />
                <Skeleton class="h-10 w-full" />
              </div>
            </template>
            <template v-else>
              <div class="space-y-4">
                <div class="flex justify-between items-center">
                  <label class="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Temperatura</label>
                  <Badge variant="outline" class="font-mono">{{ config.temperature }}</Badge>
                </div>
                <input type="range" v-model.number="config.temperature" min="0" max="1" step="0.1" class="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600">
                <p class="text-[10px] text-muted-foreground italic leading-relaxed">
                  Valores próximos a 0 tornam as respostas mais determinísticas e precisas. Valores próximos a 2 aumentam a criatividade e aleatoriedade.
                </p>
              </div>
              <div class="space-y-4">
                <div class="flex justify-between items-center">
                  <label class="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Limite de Tokens (Max Tokens)</label>
                  <Badge variant="outline" class="font-mono">{{ config.max_tokens }}</Badge>
                </div>
                <input type="range" v-model.number="config.max_tokens" min="256" max="8192" step="256" class="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600">
                <p class="text-[10px] text-muted-foreground italic leading-relaxed">
                  Define o tamanho máximo da resposta gerada. Um valor maior permite respostas mais longas, mas consome mais recursos.
                </p>
              </div>
            </template>
          </CardContent>
        </Card>
      </div>

      <!-- Coluna Direita: MCP Tools -->
      <div class="lg:col-span-4 space-y-6">
        <Card class="shadow-sm border-none md:border h-full flex flex-col">
          <CardHeader>
            <div class="flex items-center gap-2">
              <Wrench class="h-5 w-5 text-blue-500" />
              <CardTitle class="text-lg text-foreground">Funções MCP</CardTitle>
            </div>
            <CardDescription>
              Ative ou desative ferramentas que a IA pode invocar para executar ações.
            </CardDescription>
          </CardHeader>
          <CardContent class="flex-1 overflow-y-auto px-6">
            <div class="space-y-4" v-if="isLoading">
              <div v-for="i in 5" :key="i" class="flex items-start space-x-3 p-3">
                <Skeleton class="h-4 w-4 mt-1" />
                <div class="space-y-2 flex-1">
                  <Skeleton class="h-4 w-1/3" />
                  <Skeleton class="h-3 w-full" />
                </div>
              </div>
            </div>
            <div class="space-y-4 max-h-52" v-else>
              <div v-for="tool in mcpTools" :key="tool.name" 
                class="flex items-start space-x-3 p-3 rounded-xl border transition-all hover:bg-slate-50 dark:hover:bg-slate-900/50 cursor-pointer"
                :class="config.enabled_tools.includes(String(tool.name)) ? 'border-indigo-200 bg-indigo-50/30 dark:border-indigo-900/30' : 'border-transparent bg-slate-50/50 dark:bg-slate-900/20'"
                @click="toggleTool(tool.name)"
              >
                <Checkbox 
                  :id="String(tool.name)" 
                  :checked="config.enabled_tools.includes(String(tool.name))"
                  @update:checked="toggleTool(tool.name)"
                  class="mt-1"
                />
                <div class="grid gap-1.5 leading-none">
                  <label :for="String(tool.name)" class="text-sm font-semibold leading-none cursor-pointer flex items-center gap-2 text-foreground">
                    {{ tool.name_display || tool.name }}
                    <Badge v-if="tool.is_new" variant="secondary" class="text-[9px] px-1 h-4">Novo</Badge>
                  </label>
                  <p class="text-xs text-muted-foreground line-clamp-2">
                    {{ tool.description }}
                  </p>
                </div>
              </div>
            </div>

          </CardContent>
          <div class="p-6 border-t bg-slate-50/50 dark:bg-slate-900/10">
            <div class="flex items-center justify-between">
              <span class="text-xs font-medium text-slate-500" v-if="!isLoading">{{ config.enabled_tools.length }} ferramentas ativas</span>
              <Skeleton v-else class="h-4 w-24" />
              <Button variant="link" size="sm" class="h-auto p-0 text-xs" @click="selectAllTools" :disabled="isLoading">Selecionar Todas</Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { 
  Terminal, Save, RotateCcw, 
  Loader2, Wrench, Settings2 
} from "lucide-vue-next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast/use-toast";
import IntelligenceArtificial from "@/services/intelligenceArtificial";

const { toast } = useToast();
const isSaving = ref(false);
const isLoading = ref(true);

const config = ref({
  system_prompt: "",
  temperature: 0.7,
  max_tokens: 2048,
  enabled_tools: [] as string[]
});

const mcpTools = ref([] as any[]);

const fetchSettings = async () => {
  isLoading.value = true;
  try {
    const [settings, tools] = await Promise.all([
      IntelligenceArtificial.getAiSettings(),
      IntelligenceArtificial.getAvailableTools()
    ]);

    // Se vier como objeto do back, convertemos para array interno para facilitar o uso no template/checkboxes
    let enabledArray = [];
    if (Array.isArray(settings.enabled_tools)) {
      enabledArray = settings.enabled_tools;
    } else if (settings.enabled_tools && typeof settings.enabled_tools === 'object') {
      enabledArray = Object.keys(settings.enabled_tools).filter(key => settings.enabled_tools[key] === true);
    }

    // Se vier como objeto do back, convertemos para array interno (usando nomes para correspondência)


    config.value = {
      system_prompt: settings.system_prompt || "",
      temperature: settings.temperature || 0.7,
      max_tokens: settings.max_tokens || 2048,
      enabled_tools: enabledArray.map(name => String(name)) 
    };

    mcpTools.value = tools;
    } catch (error) {
    console.error(error);
    toast({ title: "Erro", description: "Não foi possível carregar as configurações da IA.", variant: "destructive" });
    } finally {
    isLoading.value = false;
    }
    };

    onMounted(fetchSettings);

    const toggleTool = (name: any) => {
    const toolName = String(name);
    const index = config.value.enabled_tools.indexOf(toolName);
    if (index > -1) {
    config.value.enabled_tools.splice(index, 1);
    } else {
    config.value.enabled_tools.push(toolName);
    }
    };

    const selectAllTools = () => {
    config.value.enabled_tools = mcpTools.value.map(t => String(t.name));
    };

    const resetConfig = () => {
    fetchSettings();
    toast({ title: "Restaurado", description: "Configurações recarregadas do servidor." });
    };

    const saveConfig = async () => {
    isSaving.value = true;
    try {
    // Criamos o payload de ferramentas usando o NOME como chave
    const toolsPayload = {} as Record<string, boolean>;
    mcpTools.value.forEach(tool => {
      // Usamos tool.name como chave e verificamos se ele está no array de ativos
      toolsPayload[tool.name] = config.value.enabled_tools.includes(String(tool.name));
    });

    const payload = {
      ...config.value,
      enabled_tools: toolsPayload
    };

    await IntelligenceArtificial.saveAiSettings(payload);
    toast({
      title: "Configurações Salvas",
      description: "O controlador de IA foi atualizado com sucesso.",
    });
    } catch (error) {
    console.error(error);
    toast({ title: "Erro ao salvar", description: "Falha ao persistir as configurações no servidor.", variant: "destructive" });
    } finally {
    isSaving.value = false;
    }
    };

</script>

<style scoped>
.overflow-y-auto::-webkit-scrollbar {
  width: 4px;
}
.overflow-y-auto::-webkit-scrollbar-thumb {
  background-color: #cbd5e1;
  border-radius: 20px;
}
.dark .overflow-y-auto::-webkit-scrollbar-thumb {
  background-color: #334155;
}
</style>