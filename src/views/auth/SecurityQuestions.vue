<template>
  <div class="h-screen w-full flex-col flex p-6 items-center align-middle relative">
    <div class="w-full h-16 absolute z-10">
      <img
        :src="mode == 'light' ? '/logo-elevate-square-black.png' : '/logo-elevate-square-white.png'"
        class="h-16 ml-6"
        alt="Logo Elevate"
      />
    </div>
    <div class="mx-10 flex w-full h-screen flex-col justify-center space-y-6 sm:w-[400px]">
      <div class="flex flex-col space-y-2 text-center">
        <h1 class="text-2xl font-semibold tracking-tight">
          Configurar perguntas de segurança
        </h1>
        <p class="text-sm text-muted-foreground">
          Antes de continuar, configure suas perguntas de segurança. Elas serão usadas caso você precise recuperar sua conta.
        </p>
      </div>
      <form @submit.prevent="saveQuestions" class="w-full space-y-4">
        <div class="grid gap-1">
          <Label class="font-semibold text-xs">Pergunta 1</Label>
          <Select v-model="question1">
            <SelectTrigger>
              <SelectValue placeholder="Selecione uma pergunta" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                v-for="(q, i) in availableQuestions"
                :key="i"
                :value="q.id"
              >
                {{ q.question }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div class="grid gap-1">
          <Label class="font-semibold text-xs">Resposta 1</Label>
          <Input
            v-model="answer1"
            placeholder="Digite sua resposta"
            :disabled="isSaving"
            required
          />
        </div>
        <div class="grid gap-1">
          <Label class="font-semibold text-xs">Pergunta 2</Label>
          <Select v-model="question2">
            <SelectTrigger>
              <SelectValue placeholder="Selecione uma pergunta" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                v-for="(q, i) in availableQuestions"
                :key="i"
                :value="q.id"
              >
                {{ q.question }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div class="grid gap-1">
          <Label class="font-semibold text-xs">Resposta 2</Label>
          <Input
            v-model="answer2"
            placeholder="Digite sua resposta"
            :disabled="isSaving"
            required
          />
        </div>
        <div class="flex flex-col gap-2 pt-2">
          <Button type="submit" :disabled="isSaving">
            <LucideSpinner v-if="isSaving" class="mr-2 h-4 w-4 animate-spin" />
            Salvar
          </Button>
          <Button variant="outline" type="button" @click="logout">
            Sair
          </Button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue"
import { useRouter } from "vue-router"
import { useAuthStore } from "@/stores/auth"
import { useToast } from "@/components/ui/toast/use-toast"
import { useColorMode } from "@vueuse/core"
import { Loader2 as LucideSpinner } from "lucide-vue-next"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Auth from "@/services/auth"

const { toast } = useToast()
const router = useRouter()
const authStore = useAuthStore()
const mode = useColorMode()

const availableQuestions = ref<string[]>([])
const question1 = ref("")
const answer1 = ref("")
const question2 = ref("")
const answer2 = ref("")
const isSaving = ref(false)

onMounted(async () => {
  try {
    const data = await Auth.getSecurityQuestions()
    availableQuestions.value = data.data ?? []
  } catch {
    availableQuestions.value = []
  }
})

async function saveQuestions() {
  if (!question1.value || !answer1.value || !question2.value || !answer2.value) {
    toast({
      title: "Aviso",
      description: "Preencha todas as perguntas e respostas.",
      variant: "destructive",
    })
    return
  }
  isSaving.value = true
  try {
    await Auth.saveSecurityQuestions({
      question1: question1.value,
      answer1: answer1.value,
      question2: question2.value,
      answer2: answer2.value,
    })
    authStore.setRequiresSecurityQuestions(false)
    toast({
      title: "Sucesso",
      description: "Perguntas de segurança salvas com sucesso.",
    })
    router.push("/")
  } catch {
    toast({
      title: "Erro",
      description: "Erro ao salvar perguntas de segurança.",
      variant: "destructive",
    })
  } finally {
    isSaving.value = false
  }
}

async function logout() {
  await authStore.logout()
  router.push("/login")
}
</script>
