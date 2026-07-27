import api from "./base.js";

export type CampaignMailSettings = {
  is_enabled: boolean;
  host: string | null;
  port: number | null;
  encryption: string | null;
  username: string | null;
  from_address: string | null;
  from_name: string | null;
  has_password: boolean;
  updated_at?: string | null;
  resolved?: {
    is_ready: boolean;
    source: string;
    host: string | null;
    port: number | null;
    encryption: string | null;
    from_address: string | null;
    from_name: string | null;
  };
};

export type CampaignMailSettingsPayload = {
  is_enabled: boolean;
  host?: string | null;
  port?: number | null;
  encryption?: string | null;
  username?: string | null;
  password?: string | null;
  from_address?: string | null;
  from_name?: string | null;
};

const CampaignMailSettingsService = {
  get() {
    return api.get("/campaign-mail-settings").then((res) => res.data?.data as CampaignMailSettings);
  },
  save(payload: CampaignMailSettingsPayload) {
    return api.put("/campaign-mail-settings", payload).then((res) => res.data?.data as CampaignMailSettings);
  },
};

export default CampaignMailSettingsService;
