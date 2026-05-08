export class LedgerpetError extends Error {
  constructor(message, code = "LEDGERPET_ERROR") {
    super(message);
    this.name = "LedgerpetError";
    this.code = code;
  }
}

export function assertSyntheticWatermark(value, source) {
  if (!value || value !== "LEDGERPET_SYNTHETIC_SAMPLE_DO_NOT_USE_AS_REAL_FINANCIAL_DATA") {
    throw new LedgerpetError(
      `${source} is missing the ledgerpet synthetic watermark; refusing to treat it as safe sample data`,
      "MISSING_SYNTHETIC_WATERMARK"
    );
  }
}
