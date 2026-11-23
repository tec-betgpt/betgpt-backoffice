/**
 * Sufixos de segundo nível mais comuns: nesses casos o domínio registrável
 * (raiz) tem três rótulos (`meusite.com.br`), não dois.
 */
const SECOND_LEVEL_SUFFIXES = new Set([
  // Brasil
  "com.br",
  "net.br",
  "org.br",
  "gov.br",
  "edu.br",
  "mil.br",
  "art.br",
  "blog.br",
  "biz.br",
  "info.br",
  "pro.br",
  "tv.br",
  "esp.br",
  "seg.br",
  "tur.br",
  "adv.br",
  "arq.br",
  "eng.br",
  "med.br",
  "odo.br",
  "vet.br",
  "psic.br",
  "fisio.br",
  "nutri.br",
  "farm.br",
  "bio.br",
  "ind.br",
  "inf.br",
  "jus.br",
  "leg.br",
  "mp.br",
  "rec.br",
  "srv.br",
  "trd.br",
  "def.br",
  "nom.br",
  "am.br",
  "coop.br",
  "emp.br",
  "etc.br",
  "far.br",
  "flog.br",
  "fot.br",
  "imob.br",
  "mat.br",
  "mus.br",
  "not.br",
  "radio.br",
  "teo.br",
  "vlog.br",
  "wiki.br",
  "zlg.br",
  // Reino Unido
  "co.uk",
  "org.uk",
  "me.uk",
  "ltd.uk",
  "plc.uk",
  "net.uk",
  "sch.uk",
  "ac.uk",
  "gov.uk",
  // Oceania
  "com.au",
  "net.au",
  "org.au",
  "edu.au",
  "gov.au",
  "id.au",
  "co.nz",
  "net.nz",
  "org.nz",
  "govt.nz",
  "ac.nz",
  // África do Sul
  "co.za",
  "org.za",
  "net.za",
  "gov.za",
  "ac.za",
  // América Latina
  "com.mx",
  "org.mx",
  "gob.mx",
  "net.mx",
  "com.ar",
  "gob.ar",
  "org.ar",
  "net.ar",
  "com.co",
  "net.co",
  "org.co",
  "gov.co",
  "com.pe",
  "gob.pe",
  "org.pe",
  "com.ve",
  "com.uy",
  "com.py",
  "com.bo",
  "com.ec",
  "com.do",
  "com.gt",
  "com.sv",
  "com.hn",
  "com.ni",
  "com.pa",
  "com.cr",
  "com.cl",
]);

/**
 * Normaliza o que o usuário digitou para um hostname: remove protocolo,
 * caminho, espaços, ponto final e caixa alta.
 */
export function normalizeHostname(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/^[a-z][a-z0-9+.-]*:\/\//, "")
    .replace(/[/?#].*$/, "")
    .replace(/\.+$/, "");
}

const IPV4_PATTERN = /^\d{1,3}(\.\d{1,3}){3}$/;

/**
 * Indica se o host informado é um domínio raiz (apex), e não um subdomínio.
 *
 * `meusite.com` e `meusite.com.br` retornam `true`; `links.meusite.com.br`
 * retorna `false`. Valores inválidos, IPs e hosts sem ponto também retornam
 * `false`, para não bloquear o cadastro com um aviso indevido.
 */
export function isApexDomain(value: string): boolean {
  const host = normalizeHostname(value);

  if (!host) return false;
  if (IPV4_PATTERN.test(host)) return false;
  if (host.includes(":")) return false; // IPv6

  const labels = host.split(".");
  if (labels.length < 2) return false;
  if (labels.some((label) => label === "")) return false;

  const lastTwo = labels.slice(-2).join(".");
  const expectedLabels = SECOND_LEVEL_SUFFIXES.has(lastTwo) ? 3 : 2;

  return labels.length === expectedLabels;
}
