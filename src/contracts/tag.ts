export interface Tag {
  id: number;
  uuid: string;
  project_id: number | null; // null indica Tag Global/Ecossistema
  name: string;
  slug: string;
  description: string | null;
  color: string | null;      // Hexadecimal (ex: #FF5733)
  parent_id: number | null;
  is_active: boolean;
  metadata: TagMetadata | null;
  expires_at: string | null; // ISO 8601
  parent?: Tag;
  children?: Tag[];
}

export interface TagMetadata {
  triggers?: {
    on_attach?: TriggerAction[];
    on_detach?: TriggerAction[];
  };
  [key: string]: any; // Extensível para parâmetros dinâmicos
}

export interface TriggerAction {
  type: 'webhook';
  url: string;
}

export interface TaggablePayload {
  tag_id: number;
  taggable_id: number;
  taggable_type: 'player' | 'segment'; // Modelos suportados
}
