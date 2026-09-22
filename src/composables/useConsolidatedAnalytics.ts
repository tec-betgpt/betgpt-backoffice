import type { ComputedRef } from "vue";

export interface ConsolidatedAnalyticsPeriod {
  chartName: string;
  chartResource?: string;
  title: string;
  type?: "numeric" | "percent" | "currency";
  glossary?: string;
  period: Array<{ name: string; value: Array<Record<string, unknown>> }>;
}

type PeriodRow = Record<string, unknown>;
type PeriodArray = Array<Record<string, unknown>>;

function arr(value: unknown): PeriodArray {
  return Array.isArray(value) ? (value as PeriodArray) : [];
}

function row(value: unknown): PeriodRow {
  return value && typeof value === "object" ? (value as PeriodRow) : {};
}

function normalize(data: PeriodRow) {
  const percentNet = arr(data.percent_net_deposits_period).map((item) => ({
    date: item.date,
    ["7 Dias %"]: Number(item["7 Dias %"] ?? 0) / 100,
    ["14 Dias %"]: Number(item["14 Dias %"] ?? 0) / 100,
    ["28 Dias %"]: Number(item["28 Dias %"] ?? 0) / 100,
  }));

  const registrationDeposit = arr(data.registration_deposit_rate_period).map(
    (item) => ({
      date: item.date,
      ["% Entrada"]: Number(item["% Entrada"] ?? 0) / 100,
    }),
  );

  const depositConversion = arr(data.deposit_conversion_rate_period).map(
    (item) => ({
      date: item.date,
      ["% Conversão"]: Number(item["% Saída"] ?? 0) / 100,
    }),
  );

  const ftd = arr(data.percent_ftd_day_period).map((item) => ({
    date: item.date,
    ["FTD/Dia"]: Number(item["FTD/Dia"] ?? 0) / 100,
  }));

  const uniqueLogins = arr(data.unique_player_logins_period).map((item) => ({
    date: item.date,
    ["Logins únicos"]: item["Logins"],
    ["Depositantes únicos"]: item["Depositantes"] ?? 0,
  }));

  const uniqueLoginsMovingAverage = arr(
    data.unique_player_logins_moving_average_period,
  ).map((item) => ({
    date: item.date,
    ["7 Dias"]: item["7 Dias"],
    ["14 Dias"]: item["14 Dias"],
    ["28 Dias"]: item["28 Dias"],
  }));

  const loginDepositConversion = arr(
    data.login_to_deposit_conversion_rate_period,
  ).map((item) => ({
    date: item.date,
    ["% Conversão"]: Number(item["% Conversão"] ?? 0) / 100,
  }));

  const loginDepositConversionMovingAverage = arr(
    data.login_to_deposit_conversion_rate_moving_average_period,
  ).map((item) => ({
    date: item.date,
    ["7 Dias"]: Number(item["7 Dias"] ?? 0) / 100,
    ["14 Dias"]: Number(item["14 Dias"] ?? 0) / 100,
    ["28 Dias"]: Number(item["28 Dias"] ?? 0) / 100,
  }));

  const valueNet = arr(data.value_net_deposits_period).map((item) => ({
    date: item.date,
    ["Líquido"]: item["Entradas"],
  }));

  const valueDeposits = arr(data.value_deposits_period).map((item) => ({
    date: item.date,
    ["Total Entradas"]: item["Entradas"],
  }));

  const deposits = arr(data.deposits_period);
  const netDeposits = arr(data.net_deposits_period);
  const activeUsers = arr(data.active_users_period);
  const withdraws = arr(data.value_withdraws_period);
  const users = arr(data.users_period);
  const logins = arr(data.player_logins_period);

  return {
    usersPeriod: [
      { name: "Registrados", value: users },
      { name: "Ativos", value: users },
    ],
    loginsDays: [{ name: "Logins", value: logins }],
    uniquePlayerLoginsPeriod: [
      { name: "Logins únicos", value: uniqueLogins },
      { name: "Depositantes únicos", value: uniqueLogins },
    ],
    uniquePlayerLoginsMovingAveragePeriod: [
      { name: "7 Dias", value: uniqueLoginsMovingAverage },
      { name: "14 Dias", value: uniqueLoginsMovingAverage },
      { name: "28 Dias", value: uniqueLoginsMovingAverage },
    ],
    loginToDepositConversionRatePeriod: [
      { name: "% Conversão", value: loginDepositConversion },
    ],
    loginToDepositConversionRateMovingAveragePeriod: [
      { name: "7 Dias", value: loginDepositConversionMovingAverage },
      { name: "14 Dias", value: loginDepositConversionMovingAverage },
      { name: "28 Dias", value: loginDepositConversionMovingAverage },
    ],
    depositsPeriod: [
      { name: "7 Dias", value: deposits },
      { name: "14 Dias", value: deposits },
      { name: "28 Dias", value: deposits },
    ],
    percentNetDepositsPeriod: [
      { name: "7 Dias %", value: percentNet },
      { name: "14 Dias %", value: percentNet },
      { name: "28 Dias %", value: percentNet },
    ],
    netDepositsPeriod: [
      { name: "7 Dias", value: netDeposits },
      { name: "14 Dias", value: netDeposits },
      { name: "28 Dias", value: netDeposits },
    ],
    activeUsersPeriod: [
      { name: "7 Dias", value: activeUsers },
      { name: "14 Dias", value: activeUsers },
      { name: "28 Dias", value: activeUsers },
    ],
    percentFtdDayPeriod: [{ name: "FTD/Dia", value: ftd }],
    valueNetDepositsPeriod: [{ name: "Líquido", value: valueNet }],
    valueDepositsPeriod: [{ name: "Total Entradas", value: valueDeposits }],
    valueWithdrawsPeriod: [{ name: "Saídas", value: withdraws }],
    registrationDepositRatePeriod: [
      { name: "% Entrada", value: registrationDeposit },
    ],
    depositConversionRatePeriod: [{ name: "% Conversão", value: depositConversion }],
  };
}

/**
 * Transforma a resposta de `GET /analytics` (ou `/groups/{group}/analytics`)
 * na lista de períodos consumida pelos `PeriodComponent`. Extraído de
 * `Analytics.vue` para reuso entre a visão de projeto e a consolidada de grupo.
 */
export function mapAnalyticsResponse(
  payload: unknown,
): ConsolidatedAnalyticsPeriod[] {
  const data = row(payload);
  const meta = row(data.meta);
  const p = normalize(data);

  const glossary = (key: string, fallback: string) =>
    (meta[key] as string) || fallback;

  return [
    {
      chartName: "users",
      title: "Usuários",
      glossary: glossary("users_period", "Dados de Usuários registrados e ativos"),
      period: p.usersPeriod,
    },
    {
      chartName: "logins_days",
      chartResource: "Controls",
      title: "Logins diários",
      glossary: glossary("player_logins_period", "Dados de Logins diários"),
      period: p.loginsDays,
    },
    {
      chartName: "unique_logins",
      chartResource: "Controls",
      title: "Logins únicos e depositantes únicos",
      glossary: glossary(
        "unique_player_logins_period",
        "Logins únicos e depositantes únicos por dia",
      ),
      period: p.uniquePlayerLoginsPeriod,
    },
    {
      chartName: "unique_logins_moving_average",
      chartResource: "Controls",
      title: "Média móvel - Logins únicos",
      glossary: glossary(
        "unique_player_logins_moving_average_period",
        "Média móvel de logins únicos em janelas de 7, 14 e 28 dias",
      ),
      period: p.uniquePlayerLoginsMovingAveragePeriod,
    },
    {
      chartName: "login_deposit_conversion",
      chartResource: "Controls",
      title: "Taxa de Conversão Login → Depósito",
      type: "percent",
      glossary: glossary(
        "login_to_deposit_conversion_rate_period",
        "Percentual diário de depositantes únicos sobre logins únicos",
      ),
      period: p.loginToDepositConversionRatePeriod,
    },
    {
      chartName: "login_deposit_conversion_moving_average",
      chartResource: "Controls",
      title: "Média móvel - Conversão Login → Depósito",
      type: "percent",
      glossary: glossary(
        "login_to_deposit_conversion_rate_moving_average_period",
        "Média móvel da taxa de conversão login único para depositante único em janelas de 7, 14 e 28 dias",
      ),
      period: p.loginToDepositConversionRateMovingAveragePeriod,
    },
    {
      chartName: "deposits",
      chartResource: "Controls",
      type: "currency",
      title: "Entrada por periodo",
      glossary: glossary(
        "deposits_period",
        "Dados de entrada por período, com diferença de 7D, 14D e 28D",
      ),
      period: p.depositsPeriod,
    },
    {
      chartName: "percent_net_deposits",
      chartResource: "Controls",
      type: "percent",
      title: "Percentual de entradas líquidas por período",
      glossary: glossary(
        "percent_net_deposits_period",
        "Percentual de entradas líquidas em relação ao total por período",
      ),
      period: p.percentNetDepositsPeriod,
    },
    {
      chartName: "net_deposits",
      chartResource: "Controls",
      type: "currency",
      title: "Entradas Líquidas por período",
      glossary: glossary(
        "net_deposits_period",
        "Valor líquido das entradas realizadas em cada período",
      ),
      period: p.netDepositsPeriod,
    },
    {
      chartName: "active_users",
      chartResource: "Controls",
      title: "Usuários Ativos por período",
      glossary: glossary(
        "active_users_period",
        "Quantidade de usuários ativos em cada período",
      ),
      period: p.activeUsersPeriod,
    },
    {
      chartName: "percent_ftd",
      chartResource: "Controls",
      type: "percent",
      title: "Percentual FTD por dia",
      glossary: glossary(
        "percent_ftd_day_period",
        "Percentual de First Time Deposits (FTD) por dia",
      ),
      period: p.percentFtdDayPeriod,
    },
    {
      chartName: "value_net_deposits",
      chartResource: "Controls",
      type: "currency",
      title: "Valor de Entradas Líquidas por período",
      glossary: glossary(
        "value_net_deposits_period",
        "Valor total das entradas líquidas por período",
      ),
      period: p.valueNetDepositsPeriod,
    },
    {
      chartName: "value_deposits",
      chartResource: "Controls",
      type: "currency",
      title: "Valor de Entradas por período",
      glossary: glossary(
        "value_deposits_period",
        "Valor total das entradas realizadas por período",
      ),
      period: p.valueDepositsPeriod,
    },
    {
      chartName: "value_withdraws",
      chartResource: "Controls",
      type: "currency",
      title: "Valor de Saídas por período",
      glossary: glossary(
        "value_withdraws_period",
        "Valor total das saídas realizadas por período",
      ),
      period: p.valueWithdrawsPeriod,
    },
    {
      chartName: "reg_dep_rate",
      chartResource: "Controls",
      title: "Taxa de Registro/Entrada por período",
      type: "percent",
      glossary: glossary(
        "registration_deposit_rate_period",
        "Percentual de usuários registrados que realizaram entrada por período",
      ),
      period: p.registrationDepositRatePeriod,
    },
    {
      chartName: "dep_conv_rate",
      chartResource: "Controls",
      title: "Taxa de Conversão de Entrada por período",
      type: "percent",
      glossary: glossary(
        "deposit_conversion_rate_period",
        "Percentual de conversão de entradas pagas por período",
      ),
      period: p.depositConversionRatePeriod,
    },
  ];
}

export type ConsolidatedAnalytics = ComputedRef<ConsolidatedAnalyticsPeriod[]>;
