import { LedgerpetError } from "./errors.js";

export function parseCsv(text, source = "csv") {
  const lines = splitCsvRecords(text.replace(/^\uFEFF/, "").trim()).filter(Boolean);
  if (lines.length === 0) return [];
  const headers = splitCsvLine(lines[0]);
  return lines.slice(1).map((line, index) => {
    const cells = splitCsvLine(line);
    if (cells.length !== headers.length) {
      throw new LedgerpetError(`${source}:${index + 2} has ${cells.length} cells, expected ${headers.length}`, "CSV_SHAPE");
    }
    return Object.fromEntries(headers.map((header, i) => [header, cells[i]]));
  });
}

function splitCsvRecords(text) {
  const records = [];
  let record = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];
    if (char === '"' && inQuotes && next === '"') {
      record += '""';
      i += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
      record += char;
    } else if ((char === "\n" || (char === "\r" && next === "\n")) && !inQuotes) {
      records.push(record);
      record = "";
      if (char === "\r") i += 1;
    } else {
      record += char;
    }
  }
  if (record) records.push(record);
  return records;
}

export function toCsv(rows) {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  return [headers.join(","), ...rows.map((row) => headers.map((h) => quoteCsv(row[h])).join(","))].join("\n") + "\n";
}

function splitCsvLine(line) {
  const cells = [];
  let cell = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];
    if (char === '"' && inQuotes && next === '"') {
      cell += '"';
      i += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      cells.push(cell);
      cell = "";
    } else {
      cell += char;
    }
  }
  if (inQuotes) throw new LedgerpetError(`Unclosed quote in CSV line: ${line}`, "CSV_QUOTE");
  cells.push(cell);
  return cells;
}

function quoteCsv(value) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}
