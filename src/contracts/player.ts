import {Param} from "@/contracts/param";
import {PlayerProfile} from "@/contracts/playerProfile";
import {PlayerLogin} from "@/contracts/playerLogin";
import {Project} from "@/contracts/project";
import {Deposit} from "@/contracts/deposit";
import {Withdraw} from "@/contracts/withdraw";
import {PlayerStatus} from "@/contracts/playerStatus";
import {PlayerProject} from "@/contracts/playerProject";
import {SegmentResult} from "@/contracts/segmentResult";
import {PlayerHistory} from "@/contracts/playerHistory";

export interface Player {
  id: number
  email: string
  name: string
  cpf: string | null
  external_id: string | null
  referrer_id: string | null
  gender: string | null
  birthday: string | null
  phone: string | null
  created_at: string
  updated_at: string
  profiles: PlayerProfile[]
  params: Param[]
  logins: PlayerLogin[]
  projects: Project[]
  deposits: Deposit[]
  withdraws: Withdraw[]
  statuses: PlayerStatus[]
  player_projects: PlayerProject[]
  segment_results: SegmentResult[]
  historical: PlayerHistory[]
}
