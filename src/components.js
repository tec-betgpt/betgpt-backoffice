const cards = import.meta.glob('./components/ui/card/*.vue', { eager: true })
const skeleton = import.meta.glob('./components/ui/skeleton/*.vue', { eager: true })
const chartBar = import.meta.glob('./components/ui/chart-bar/*.vue', { eager: true })
const avatar = import.meta.glob('./components/ui/avatar/*.vue', { eager: true })
const select = import.meta.glob('./components/ui/select/*.vue', { eager: true })
const button = import.meta.glob('./components/ui/button/*.vue', { eager: true })
const tooltip = import.meta.glob('./components/ui/tooltip/*.vue', { eager: true })

export default {
    ...cards,
    ...skeleton,
    ...chartBar,
    ...avatar,
    ...select,
    ...button,
    ...tooltip,
}
