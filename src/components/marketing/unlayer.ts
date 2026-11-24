export type EmailDesign = Record<string, unknown>;

export interface EmailBuilderContent {
  design: EmailDesign;
  html: string;
}

export interface UnlayerEditor {
  addEventListener(event: string, callback: (...args: any[]) => void): void;
  loadDesign(design: EmailDesign): void;
  exportHtml(callback: (data: EmailBuilderContent) => void): void;
  destroy?: () => void;
}

interface UnlayerGlobal {
  createEditor(options: Record<string, unknown>): UnlayerEditor;
}

declare global {
  interface Window {
    unlayer?: UnlayerGlobal;
  }
}

const UNLAYER_SCRIPT_URL = "https://editor.unlayer.com/embed.js";
export const EMAIL_DESIGN_METADATA_KEY = "email_design";

export const EMAIL_MERGE_TAGS = {
  first_name: { name: "Primeiro nome", value: "{{first_name}}", sample: "Maria" },
  name: { name: "Nome completo", value: "{{name}}", sample: "Maria Souza" },
  last_name: { name: "Sobrenome", value: "{{last_name}}", sample: "Souza" },
  email: { name: "E-mail", value: "{{email}}", sample: "maria@email.com" },
  phone: { name: "Telefone", value: "{{phone}}", sample: "(11) 99999-9999" },
  external_id: { name: "ID do jogador", value: "{{external_id}}", sample: "12345" },
};

let loading: Promise<UnlayerGlobal> | null = null;

export function loadUnlayer(): Promise<UnlayerGlobal> {
  if (window.unlayer) return Promise.resolve(window.unlayer);
  if (loading) return loading;

  loading = new Promise<UnlayerGlobal>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = UNLAYER_SCRIPT_URL;
    script.async = true;
    script.onload = () => (window.unlayer ? resolve(window.unlayer) : reject(new Error("Editor indisponível.")));
    script.onerror = () => {
      loading = null;
      script.remove();
      reject(new Error("Não foi possível carregar o editor de e-mail."));
    };
    document.head.appendChild(script);
  });

  return loading;
}

// Templates antigos só têm HTML: abrem como um bloco HTML editável dentro do editor.
export function designFromHtml(html: string): EmailDesign {
  return {
    counters: { u_row: 1, u_column: 1, u_content_html: 1 },
    body: {
      id: "body",
      rows: [
        {
          id: "row-1",
          cells: [1],
          columns: [
            {
              id: "column-1",
              contents: [
                {
                  id: "html-1",
                  type: "html",
                  values: { html, containerPadding: "0px", _meta: { htmlID: "u_content_html_1", htmlClassNames: "u_content_html" } },
                },
              ],
              values: { _meta: { htmlID: "u_column_1", htmlClassNames: "u_column" } },
            },
          ],
          values: { _meta: { htmlID: "u_row_1", htmlClassNames: "u_row" } },
        },
      ],
      values: { contentWidth: "600px", backgroundColor: "#ffffff", _meta: { htmlID: "u_body", htmlClassNames: "u_body" } },
    },
    schemaVersion: 16,
  };
}

export function isEmailDesign(value: unknown): value is EmailDesign {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value) && "body" in (value as object);
}
