// Minimal CSV utilities — handles quoted fields, embedded commas, escaped quotes ("").
// No external dep so we avoid bundling a full parser.

export function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') { cell += '"'; i++; }
        else { inQuotes = false; }
      } else {
        cell += ch;
      }
    } else {
      if (ch === '"') inQuotes = true;
      else if (ch === ",") { row.push(cell); cell = ""; }
      else if (ch === "\n") { row.push(cell); rows.push(row); row = []; cell = ""; }
      else if (ch === "\r") { /* ignore */ }
      else cell += ch;
    }
  }
  if (cell.length > 0 || row.length > 0) { row.push(cell); rows.push(row); }
  return rows.filter(r => r.length > 0 && r.some(c => c.trim() !== ""));
}

export function toCSV(rows: (string | number | null | undefined)[][]): string {
  return rows.map(r => r.map(escapeCell).join(",")).join("\n");
}

function escapeCell(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  const s = String(value);
  if (/[",\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function downloadCSV(filename: string, rows: (string | number | null | undefined)[][]) {
  const csv = toCSV(rows);
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Try to map a header row to known fields. Returns column index or -1.
export function findColumn(headers: string[], candidates: string[]): number {
  const norm = headers.map(h => h.trim().toLowerCase().replace(/[\s_-]+/g, ""));
  for (const c of candidates) {
    const target = c.toLowerCase().replace(/[\s_-]+/g, "");
    const idx = norm.indexOf(target);
    if (idx !== -1) return idx;
  }
  return -1;
}
