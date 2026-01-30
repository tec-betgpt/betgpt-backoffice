import {User} from "@/contracts/user";
import {ProjectProfile} from "@/contracts/projectProfile";
import {ProjectMetric} from "@/contracts/projectMetric";
import {ProjectSmsfunnel} from "@/contracts/projectSmsfunnel";
import {ProjectGoogleAnalytics} from "@/contracts/projectGoogleAnalytics";
import {Deposit} from "@/contracts/deposit";
import {Withdraw} from "@/contracts/withdraw";
import {PlayerProject} from "@/contracts/playerProject";
import {ProjectActiveCampaign} from "@/contracts/projectActiveCampaign";
import {ProtectionList} from "@/contracts/protectionList";
import {Segment} from "@/contracts/segment";
import {TargetAudience} from "@/contracts/targetAudience";
import {GeneratedReport} from "@/contracts/generatedReport";
import {Sector} from "@/contracts/sector";
import {ConversionDefinition} from "@/contracts/conversionDefinition";
import {Chat} from "@/contracts/chat";
import {JarbasConfig} from "@/contracts/jarbasConfig";
import {HistoryExport} from "@/contracts/historyExport";
import {UserPreference} from "@/contracts/userPreference";
import {Role} from "@/contracts/role";
import {PlayerProfile} from "@/contracts/playerProfile";
import {PlayerStatus} from "@/contracts/playerStatus";
import {ProjectActiveCampaignData} from "@/contracts/projectActiveCampaignData";
import {ProjectActiveCampaignMessage} from "@/contracts/projectActiveCampaignMessage";
import {UserProjectGroupProject} from "@/contracts/userProjectGroupProject";
import {ProjectIntegration} from "@/contracts/projectIntegration";
import {PlayerLogin} from "@/contracts/playerLogin";
import {Param} from "@/contracts/param";
import {ProjectReturnReport} from "@/contracts/projectReturnReport";

export interface Project {
  id: number
  name: string
  uuid: string
  user_id: number
  webhook_url: string
  created_at: string
  updated_at: string
  profile: ProjectProfile
  metrics: ProjectMetric[]
  smsfunnel: ProjectSmsfunnel[]
  google_analytics: ProjectGoogleAnalytics[]
  deposits: Deposit[]
  withdraws: Withdraw[]
  user: User
  users: User[]
  player_projects: PlayerProject[]
  project_active_campaigns: ProjectActiveCampaign[]
  protection_lists: ProtectionList[]
  segments: Segment[]
  target_audiences: TargetAudience[]
  generated_reports: GeneratedReport[]
  sectors: Sector[]
  conversion_definitions: ConversionDefinition[]
  chats: Chat[]
  jarbas_configs: JarbasConfig[]
  history_exports: HistoryExport[]
  user_preferences: UserPreference[]
  roles: Role[]
  player_profiles: PlayerProfile[]
  player_statuses: PlayerStatus[]
  project_active_campaign_data: ProjectActiveCampaignData[]
  project_active_campaign_messages: ProjectActiveCampaignMessage[]
  user_project_group_projects: UserProjectGroupProject[]
  integrations: ProjectIntegration[]
  player_logins: PlayerLogin[]
  params: Param[]
  project_return_reports: ProjectReturnReport[]
}
