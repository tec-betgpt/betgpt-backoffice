import { ref, onMounted, onUnmounted } from "vue"
import { useToast } from "@/components/ui/toast/use-toast"
import axios from "axios"
import { sendPendingErrors } from "./useErrorTracker"

export function useInternetConnection(checkInterval = 5000) {
    const isOnline = ref(true)
    const { toast } = useToast()
    let intervalId: ReturnType<typeof setInterval> | null = null

    const checkConnection = async () => {
        const wasOnline = isOnline.value
        let effectivelyOnline = false
        let errorType: 'network' | 'server' | null = null

        try {
            if (!navigator.onLine) {
                effectivelyOnline = false
                errorType = 'network'
            } else {
                await axios.head(`${import.meta.env.VITE_PUBLIC_API_URL}/live`, {
                    timeout: 3000,
                    headers: { 'Cache-Control': 'no-cache' }
                })
                effectivelyOnline = true
            }
        } catch (error: any) {
            effectivelyOnline = false

            if (error.response) {
                errorType = 'server'
                effectivelyOnline = true
            } else if (error.request) {
                errorType = 'network'
            } else {
                errorType = 'network'
            }
        }

        if (wasOnline && !effectivelyOnline) {
            isOnline.value = false

            const isNetworkError = errorType === 'network'
            toast({
                title: isNetworkError ? "Sem conexão" : "Erro no Servidor",
                description: isNetworkError
                    ? "Verifique sua internet."
                    : "Nosso serviço está instável no momento.",
                variant: "destructive",
                duration: 5000,
            })
        } else if (!wasOnline && effectivelyOnline) {
            isOnline.value = true
            toast({
                title: "Conectado",
                description: "Sua conexão foi restaurada.",
                duration: 5000,
            })
            
            sendPendingErrors()
        }
    }

    const handleNativeChange = () => checkConnection()

    onMounted(() => {
        checkConnection()
        window.addEventListener('online', handleNativeChange)
        window.addEventListener('offline', handleNativeChange)
        intervalId = setInterval(checkConnection, checkInterval)
    })

    onUnmounted(() => {
        if (intervalId) clearInterval(intervalId)
        window.removeEventListener('online', handleNativeChange)
        window.removeEventListener('offline', handleNativeChange)
    })

    return { isOnline }
}