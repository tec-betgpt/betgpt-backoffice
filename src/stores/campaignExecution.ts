/**
 * @deprecated Use o store do domínio (Fase 3) em `@/domains/campaign-execution`.
 *
 * Este arquivo existe apenas por compatibilidade retroativa.
 */
export {
  extractExecutionErrorMessage,
  useCampaignExecutionStore,
} from "@/domains/campaign-execution/store";
export type { CampaignExecutionAction } from "@/domains/campaign-execution/store";
