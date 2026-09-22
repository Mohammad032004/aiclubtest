import { parse as parseCsv } from "csv-parse/sync";
import * as XLSX from "xlsx";
import { ApiError } from "./apiError.js";

// Reads the "file" field from a multipart/form-data Next.js Request and
// returns { buffer, originalname }. Replaces multer's memoryStorage, since
// Next.js Route Handlers use the standard Web Request/FormData API instead
// of Express's req/res + middleware pipeline.
export async function getUploadedFile(request, field = "file") {
  const formData = await request.formData();
  const file = formData.get(field);
  if (!file || typeof file === "string") {
    throw new ApiError(400, "No file uploaded");
  }
  const arrayBuffer = await file.arrayBuffer();
  return { buffer: Buffer.from(arrayBuffer), originalname: file.name, formData };
}

// Parses a CSV or XLSX/XLS buffer (by filename extension) into an array of
// row objects keyed by header column name.
export function parseTabularFile(buffer, originalname) {
  const name = (originalname || "").toLowerCase();
  try {
    if (name.endsWith(".csv")) {
      return parseCsv(buffer.toString("utf-8"), { columns: true, skip_empty_lines: true, trim: true });
    }
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    return XLSX.utils.sheet_to_json(sheet, { defval: "" });
  } catch (err) {
    throw new ApiError(400, "Could not parse the uploaded file. Please use the provided template.");
  }
}

export function csvResponseHeaders(filename) {
  return {
    "Content-Type": "text/csv",
    "Content-Disposition": `attachment; filename=${filename}`,
  };
}
