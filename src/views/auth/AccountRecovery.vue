<template>
  <div class="h-screen w-full flex-col flex p-6 items-center align-middle relative">
    <div class="w-full h-16 absolute z-10">
      <img
        :src="mode == 'light' ? '/logo-elevate-square-black.png' : '/logo-elevate-square-white.png'"
        class="h-16 ml-6"
        alt="Logo Elevate"
      />
    </div>
    <div class="mx-10 flex w-full h-screen flex-col justify-center space-y-6 sm:w-[350px]">
      <!-- Step 1: CPF input -->
      <template v-if="step === 1">
        <div class="flex flex-col space-y-2 text-center">
          <h1 class="text-2xl font-semibold tracking-tight">Recuperação de Conta</h1>
          <p class="text-sm text-muted-foreground">
            Informe seu CPF para iniciar o processo de recuperação.
          </p>
        </div>
        <form @submit.prevent="lookupCpf" class="w-full">
          <div class="grid gap-2">
            <div class="grid gap-1 mb-2">
              <Label class="font-semibold text-xs" for="cpf">CPF</Label>
              <Input
                id="cpf"
                v-model="cpf"
                placeholder="Digite seu CPF"
                :disabled="isLoading"
                required
                maxlength="14"
                @input="formatCpf"
              />
            </div>
            <Button :disabled="isLoading" type="submit">
              <LucideSpinner v-if="isLoading" class="mr-2 h-4 w-4 animate-spin" />
              Continuar
            </Button>
          </div>
        </form>
        <Button @click="goBack" variant="outline">Voltar</Button>
      </template>

      <!-- Step 2: Answer security questions -->
      <template v-if="step === 2">
        <div class="flex flex-col space-y-2 text-center">
          <h1 class="text-2xl font-semibold tracking-tight">Perguntas de Segurança</h1>
          <p class="text-sm text-muted-foreground">
            Responda às perguntas de segurança que você cadastrou.
          </p>
        </div>
        <form @submit.prevent="submitAnswers" class="w-full space-y-4">
          <div class="grid gap-1">
            <Label class="font-semibold text-xs">{{ questions[0] }}</Label>
            <Input
              v-model="answer1"
              placeholder="Digite sua resposta"
              :disabled="isLoading"
              required
            />
          </div>
          <div class="grid gap-1">
            <Label class="font-semibold text-xs">{{ questions[1] }}</Label>
            <Input
              v-model="answer2"
              placeholder="Digite sua resposta"
              :disabled="isLoading"
              required
            />
          </div>
          <Button :disabled="isLoading" type="submit" class="w-full">
            <LucideSpinner v-if="isLoading" class="mr-2 h-4 w-4 animate-spin" />
            Verificar
          </Button>
        </form>
        <Button @click="step = 1" variant="outline">Voltar</Button>
      </template>

      <!-- Step 3: Success -->
      <template v-if="step === 3">
        <div class="flex flex-col space-y-4 text-center">
          <div class="flex justify-center">
            <div class="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
              <svg class="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <h1 class="text-2xl font-semibold tracking-tight">Recuperação Iniciada</h1>
          <Button @click="finish" class="w-full">Ir para o Login</Button>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue"
import { useRouter } from "vue-router"
import { useToast } from "@/components/ui/toast/use-toast"
import { useColorMode } from "@vueuse/core"
import { Loader2 as LucideSpinner } from "lucide-vue-next"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Auth from "@/services/auth"

const { toast } = useToast()
const router = useRouter()
const mode = useColorMode()

const step = ref(1)
const isLoading = ref(false)
const cpf = ref("")
const questions = ref<string[]>([])
const answer1 = ref("")
const answer2 = ref("")

const lookupCpf = async () => {
  isLoading.value = true
  try {
    const response = await Auth.recoverQuestions({ document_number: cpf.value.replace(/\D/g, "") })
    questions.value = response.data.questions
    step.value = 2
  } catch(erro) {
    toast({
      title: "Erro",
      description: erro.data.message,
      variant: "destructive",
    })
  } finally {
    isLoading.value = false
  }
}

const submitAnswers = async () => {
  isLoading.value = true
  try {
    await Auth.recoverAnswers({
      cpf: cpf.value.replace(/\D/g, ""),
      answer1: answer1.value,
      answer2: answer2.value,
    })
    step.value = 3
  } catch {
    toast({
      title: "Erro",
      description: "Respostas incorretas. Tente novamente.",
      variant: "destructive",
    })
  } finally {
    isLoading.value = false
  }
}

const formatCpf = (e: Event) => {
  const target = e.target as HTMLInputElement
  let value = target.value.replace(/\D/g, "").slice(0, 11)
  value = value.replace(/(\d{3})(\d)/, "$1.$2")
  value = value.replace(/(\d{3})(\d)/, "$1.$2")
  value = value.replace(/(\d{3})(\d{1,2})$/, "$1-$2")
  cpf.value = value
}

const goBack = () => {
  router.push("/login")
}

const finish = () => {
  router.push("/login")
}
</script>
