export function scoreFindings(expected, actual) {
  const expectedTypes = new Set(expected.map((finding) => finding.type));
  const actualTypes = new Set(actual.map((finding) => finding.type));
  const truePositives = [...actualTypes].filter((type) => expectedTypes.has(type)).length;
  const falsePositives = [...actualTypes].filter((type) => !expectedTypes.has(type)).length;
  const missed = [...expectedTypes].filter((type) => !actualTypes.has(type)).length;
  const precision = actualTypes.size === 0 ? 0 : truePositives / actualTypes.size;
  const recall = expectedTypes.size === 0 ? 1 : truePositives / expectedTypes.size;
  const f1 = precision + recall === 0 ? 0 : (2 * precision * recall) / (precision + recall);
  return {
    score: Math.round(f1 * 100),
    precision: round(precision),
    recall: round(recall),
    truePositives,
    falsePositives,
    missed,
    matchedTypes: [...actualTypes].filter((type) => expectedTypes.has(type)),
    missedTypes: [...expectedTypes].filter((type) => !actualTypes.has(type)),
    extraTypes: [...actualTypes].filter((type) => !expectedTypes.has(type))
  };
}

function round(value) {
  return Math.round(value * 1000) / 1000;
}
