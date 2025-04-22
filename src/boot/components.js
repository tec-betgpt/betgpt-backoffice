const card = import.meta.glob('./../components/ui/card/*.vue', { eager: true })
const skeleton = import.meta.glob('./../components/ui/skeleton/*.vue', { eager: true })
const chartBar = import.meta.glob('./../components/ui/chart-bar/*.vue', { eager: true })
const avatar = import.meta.glob('./../components/ui/avatar/*.vue', { eager: true })
const select = import.meta.glob('./../components/ui/select/*.vue', { eager: true })
const button = import.meta.glob('./../components/ui/button/*.vue', { eager: true })
const tooltip = import.meta.glob('./../components/ui/tooltip/*.vue', { eager: true })
const input = import.meta.glob('./../components/ui/input/*.vue', { eager: true })
const label = import.meta.glob('./../components/ui/label/*.vue', { eager: true })
const badge = import.meta.glob('./../components/ui/badge/*.vue', { eager: true })
const dialog = import.meta.glob('./../components/ui/dialog/*.vue', { eager: true })
const collapsible = import.meta.glob('./../components/ui/collapsible/*.vue', { eager: true })
const sidebar = import.meta.glob('./../components/ui/sidebar/*.vue', { eager: true })
const dropdownMenu = import.meta.glob('./../components/ui/dropdown-menu/*.vue', { eager: true })
const breadcrumb = import.meta.glob('./../components/ui/breadcrumb/*.vue', { eager: true })
const separator = import.meta.glob('./../components/ui/separator/*.vue', { eager: true })
const sheet = import.meta.glob('./../components/ui/sheet/*.vue', { eager: true })
const checkbox = import.meta.glob('./../components/ui/checkbox/*.vue', { eager: true })
const table = import.meta.glob('./../components/ui/table/*.vue', { eager: true })
const lineChart = import.meta.glob('./../components/ui/chart-line/*.vue', { eager: true })

export default {
    ...card,
    ...skeleton,
    ...chartBar,
    ...avatar,
    ...select,
    ...button,
    ...tooltip,
    ...input,
    ...label,
    ...badge,
    ...dialog,
    ...collapsible,
    ...sidebar,
    ...dropdownMenu,
    ...breadcrumb,
    ...separator,
    ...sheet,
    ...checkbox,
    ...table,
    ...lineChart,
}
