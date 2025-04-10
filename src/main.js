import { createApp } from 'vue'
import { createPinia } from 'pinia'
import i18n from './i18n'
import App from './App.vue'
import router from './router'
import VueTippy from 'vue-tippy'
import { toCurrency } from './filters/currencyFilter'
import { toK } from './filters/numberFilter'
import 'tippy.js/dist/tippy.css'
import { useAuthStore } from '@/stores/auth'
import { useConfigStore } from '@/stores/config'
import moment from 'moment'
import 'moment/dist/locale/pt-br'
import './assets/styles/main.css'
import globalComponents from '@/components.js'

const app = createApp(App)
const pinia = createPinia()

moment.locale('pt-br')

app.config.globalProperties.$toCurrency = toCurrency
app.config.globalProperties.$moment = moment
app.config.globalProperties.$toK = toK

app.use(VueTippy, {
  directive: 'tippy',
  component: 'tippy',
})

app.use(pinia)
app.use(router)
app.use(i18n)

for (const [path, component] of Object.entries(globalComponents)) {
  const componentName = path.split('/').pop()?.replace('.vue', '') || ''
  app.component(componentName, (component).default)
}

const authStore = useAuthStore()
authStore.restoreSession()

const configStore = useConfigStore()
configStore.fetchConfigs()

app.mount('#app')
