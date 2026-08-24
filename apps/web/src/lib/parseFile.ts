import { parse } from "csv-parse/sync";
import ExcelJS from "exceljs";

export interface RawRecipientRow {
  row: number;
  email: string;
  name: string | null;
}

function findKey(keys: string[], target: string): string | undefined {
  return keys.find((k) => k.trim().toLowerCase() === target);
}

function parseCsv(buffer: Buffer): RawRecipientRow[] {
  const records: Record<string, string>[] = parse(buffer.toString("utf-8"), {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  return records.map((record, index) => {
    const keys = Object.keys(record);
    const emailKey = findKey(keys, "email");
    const nameKey = findKey(keys, "name");

    return {
      row: index + 2,
      email: (emailKey ? record[emailKey] : "").trim(),
      name: nameKey ? record[nameKey]?.trim() || null : null,
    };
  });
}

async function parseExcel(buffer: Buffer): Promise<RawRecipientRow[]> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as unknown as ArrayBuffer);
  const sheet = workbook.worksheets[0];
  if (!sheet) return [];

  const headerRow = sheet.getRow(1);
  const headers: string[] = [];
  headerRow.eachCell((cell, colNumber) => {
    headers[colNumber] = String(cell.value ?? "").trim().toLowerCase();
  });

  const emailCol = headers.findIndex((h) => h === "email");
  const nameCol = headers.findIndex((h) => h === "name");

  const rows: RawRecipientRow[] = [];
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const emailCell = emailCol >= 0 ? row.getCell(emailCol) : undefined;
    const nameCell = nameCol >= 0 ? row.getCell(nameCol) : undefined;
    const email = String(emailCell?.value ?? "").trim();
    const name = String(nameCell?.value ?? "").trim();
    if (!email) return;
    rows.push({ row: rowNumber, email, name: name || null });
  });

  return rows;
}

export async function parseRecipientFile(
  buffer: Buffer,
  filename: string,
): Promise<RawRecipientRow[]> {
  const ext = filename.split(".").pop()?.toLowerCase();

  if (ext === "csv") {
    return parseCsv(buffer);
  }

  if (ext === "xlsx" || ext === "xls") {
    return parseExcel(buffer);
  }

  throw new Error("Unsupported file type. Please upload a .csv or .xlsx file.");
}
