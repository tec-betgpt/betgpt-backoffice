export interface DnsRecord {
  id: string;
  type: string;
  name: string;
  content: string;
  ttl: number;
  proxied: boolean;
  priority: number | null;
}

export interface DnsRecordsMeta {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
}

export interface DnsRecordsPage {
  records: DnsRecord[];
  meta: DnsRecordsMeta;
}

export interface DnsZone {
  id: string;
  name: string;
}

export interface DnsRecordPayload {
  type: string;
  name: string;
  content: string;
  ttl?: number | null;
  proxied?: boolean;
}
