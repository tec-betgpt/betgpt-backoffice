/**
 * @deprecated Mantenha as chamadas operacionais da Fase 3 no módulo de domínio:
 * `@/domains/campaign-execution`.
 *
 * Este arquivo existe apenas por compatibilidade retroativa.
 */
import campaignExecutionApi, {
  cancel,
  getRun,
  getRunBatches,
  getRunRecipients,
  launch,
  pause,
  prepare,
  resume,
} from "@/domains/campaign-execution/api";

// Back-compat: nomes antigos (pré-módulo).
export const prepareCampaign = prepare;
export const launchCampaignRun = launch;
export const pauseCampaignRun = pause;
export const resumeCampaignRun = resume;
export const cancelCampaignRun = cancel;
export const getCampaignRun = getRun;
export const getCampaignRunBatches = getRunBatches;
export const getCampaignRunRecipients = getRunRecipients;

export default campaignExecutionApi;
