const toNumber = (value, fallback) => {
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

// ─── Pricing por modelo (USD por 1M tokens) ────────────────────────────────
const PRICING_POR_MODELO = {
  "gemini-2.5-flash-lite": { input: 0.10, output: 0.40 },
  "gemini-2.5-flash":      { input: 0.30, output: 2.50 },
  "gemini-2.5-pro":        { input: 1.25, output: 10.0 },
  "deepseek-chat":         { input: 0.14, output: 0.28 },
};

// Pricing por defecto (Flash, modelo más usado)
const DEFAULT_PRICING = PRICING_POR_MODELO["gemini-2.5-flash"];

const getPricingConfig = () => {
  const costoInput = toNumber(process.env.GEMINI_COSTO_INPUT, DEFAULT_PRICING.input);
  const costoOutput = toNumber(process.env.GEMINI_COSTO_OUTPUT, DEFAULT_PRICING.output);
  const pctInput = toNumber(process.env.GEMINI_PCT_INPUT, 0.4);
  const pctOutput = toNumber(process.env.GEMINI_PCT_OUTPUT, 0.6);

  return {
    costoInput,
    costoOutput,
    pctInput,
    pctOutput,
  };
};

/**
 * Calcula costo estimado a partir de tokens totales (legacy, split por porcentaje).
 * Se usa para datos históricos de DB que solo tienen totalTokens.
 */
const calcularCostoDesdeTokens = (tokens) => {
  const { costoInput, costoOutput, pctInput, pctOutput } = getPricingConfig();
  const totalTokens = parseInt(tokens, 10) || 0;

  const tokensInput = Math.round(totalTokens * pctInput);
  const tokensOutput = Math.round(totalTokens * pctOutput);

  const costoInputUsd = (tokensInput / 1_000_000) * costoInput;
  const costoOutputUsd = (tokensOutput / 1_000_000) * costoOutput;

  return {
    totalTokens,
    tokensInput,
    tokensOutput,
    costoInputUsd,
    costoOutputUsd,
    costoTotalUsd: costoInputUsd + costoOutputUsd,
  };
};

/**
 * Calcula costo REAL con tokens de input/output separados y pricing del modelo real.
 * Usar esta función para nuevas consultas donde tenemos el desglose.
 */
const calcularCostoReal = (inputTokens, outputTokens, modelo = "gemini-2.5-flash") => {
  const pricing = PRICING_POR_MODELO[modelo] || DEFAULT_PRICING;
  const inp = parseInt(inputTokens, 10) || 0;
  const out = parseInt(outputTokens, 10) || 0;

  const costoInputUsd = (inp / 1_000_000) * pricing.input;
  const costoOutputUsd = (out / 1_000_000) * pricing.output;

  return {
    inputTokens: inp,
    outputTokens: out,
    totalTokens: inp + out,
    modelo,
    costoInputUsd,
    costoOutputUsd,
    costoTotalUsd: costoInputUsd + costoOutputUsd,
  };
};

const estimarCostoConsulta = () => {
  const estimatedTokens = parseInt(process.env.IA_ESTIMATED_TOKENS_PER_CHAT || "2500", 10) || 2500;
  return calcularCostoDesdeTokens(estimatedTokens).costoTotalUsd;
};

module.exports = {
  getPricingConfig,
  calcularCostoDesdeTokens,
  calcularCostoReal,
  estimarCostoConsulta,
  PRICING_POR_MODELO,
};
