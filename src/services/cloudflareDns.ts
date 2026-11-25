import api from "./base";
import type {
  DnsRecordPayload,
  DnsRecordsPage,
  DnsZone,
} from "@/contracts/dnsRecord";

interface CloudflareIntegrationParams {
  project_id: number | string;
  integration_id: number | string;
}

export default {
  /** GET /v1/projects/integrations/oauth/cloudflare/zones */
  async zones(params: CloudflareIntegrationParams): Promise<DnsZone[]> {
    const { data } = await api.get(
      "/projects/integrations/oauth/cloudflare/zones",
      { params },
    );
    return data.data ?? [];
  },

  /** GET /v1/projects/{project}/integrations/cloudflare/zones/{zone}/dns-records */
  async index(
    projectId: number | string,
    zoneId: string,
    params: { page?: number; per_page?: number } = {},
  ): Promise<DnsRecordsPage> {
    const { data } = await api.get(
      `/projects/${projectId}/integrations/cloudflare/zones/${zoneId}/dns-records`,
      { params },
    );
    return data.data;
  },

  /** POST /v1/projects/{project}/integrations/cloudflare/zones/{zone}/dns-records */
  async store(
    projectId: number | string,
    zoneId: string,
    payload: DnsRecordPayload,
  ) {
    const { data } = await api.post(
      `/projects/${projectId}/integrations/cloudflare/zones/${zoneId}/dns-records`,
      payload,
    );
    return data.data;
  },

  /** PUT /v1/projects/{project}/integrations/cloudflare/zones/{zone}/dns-records/{record} */
  async update(
    projectId: number | string,
    zoneId: string,
    recordId: string,
    payload: DnsRecordPayload,
  ) {
    const { data } = await api.put(
      `/projects/${projectId}/integrations/cloudflare/zones/${zoneId}/dns-records/${recordId}`,
      payload,
    );
    return data.data;
  },

  /** DELETE /v1/projects/{project}/integrations/cloudflare/zones/{zone}/dns-records/{record} */
  async destroy(
    projectId: number | string,
    zoneId: string,
    recordId: string,
  ): Promise<void> {
    await api.delete(
      `/projects/${projectId}/integrations/cloudflare/zones/${zoneId}/dns-records/${recordId}`,
    );
  },
};
