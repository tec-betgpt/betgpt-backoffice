export enum LinkDomainStatus {
  PENDING = 'pending',
  CONFIGURED = 'configured',
  ERROR = 'error',
}

export enum LinkDomainSslStatus {
  PENDING = 'pending',
  CONFIGURED = 'configured',
  ERROR = 'error',
}

export interface LinkDomain {
  id: number;
  project_id: number;
  domain: string;
  status: LinkDomainStatus;
  ssl_status: LinkDomainSslStatus | null;
  checked_at: string | null;
  error_message: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string | null;
  data: T;
}