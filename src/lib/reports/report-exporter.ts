/**
 * Roos Growth OS — Analytics & Reports Export Engine
 * Client-side high-resolution PNG, scalable vector SVG, and CSV data exporters.
 * Pure native HTML5 Canvas & Blob implementation — zero external library dependencies.
 */

export interface ExportDataRow {
  label: string;
  share: string;
  value: string;
  detail?: string;
}

export interface ChartExportConfig {
  questionNumber: number;
  questionCategory: string;
  questionTitle: string;
  takeaway: string;
  centerMetric: {
    primary: string;
    label: string;
    sublabel?: string;
  };
  rows: ExportDataRow[];
  colors: string[];
  percentages: number[];
}

/**
 * Trigger immediate client-side file download from a Blob
 */
function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Export high-resolution 2x Retina PNG card graphic
 */
export async function exportCardAsPng(
  config: ChartExportConfig,
  filename: string
): Promise<void> {
  if (typeof window === "undefined") return;

  const width = 1200;
  const height = 720;
  const scale = 2; // High-DPI 2x Retina

  const canvas = document.createElement("canvas");
  canvas.width = width * scale;
  canvas.height = height * scale;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.scale(scale, scale);

  // 1. Background Surface
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, width, height);

  // Soft Outer Border
  ctx.strokeStyle = "#EDE8E0";
  ctx.lineWidth = 1.5;
  ctx.strokeRect(1, 1, width - 2, height - 2);

  // 2. Brand & Header Tag
  ctx.fillStyle = "#FF5A1F";
  ctx.font = "600 13px 'Google Sans', sans-serif";
  ctx.fillText("ROOS GROWTH OS • ANALYTICS & REPORTS", 48, 52);

  // Category & Question Number
  ctx.fillStyle = "#666C78";
  ctx.font = "600 12px 'Google Sans', sans-serif";
  ctx.fillText(
    `QUESTION ${config.questionNumber} • ${config.questionCategory.toUpperCase()}`,
    48,
    84
  );

  // Question Title
  ctx.fillStyle = "#12141A";
  ctx.font = "600 24px 'Google Sans', sans-serif";
  ctx.fillText(config.questionTitle, 48, 118);

  // Takeaway banner box
  ctx.fillStyle = "#F7F5F0";
  ctx.beginPath();
  ctx.roundRect(48, 138, width - 96, 44, 8);
  ctx.fill();
  ctx.strokeStyle = "#EDE8E0";
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = "#454B57";
  ctx.font = "400 14px 'Google Sans', sans-serif";
  ctx.fillText(config.takeaway, 64, 165);

  // 3. Left Section: Circle Map Donut / Rings
  const centerX = 260;
  const centerY = 440;
  const radius = 130;
  const strokeW = 32;

  // Background Ring Track
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
  ctx.strokeStyle = "#F0ECE4";
  ctx.lineWidth = strokeW;
  ctx.stroke();

  // Draw Segmented Arcs
  let startAngle = -Math.PI / 2;
  const total = config.percentages.reduce((a, b) => a + b, 0);

  config.percentages.forEach((pct, i) => {
    const sweep = (pct / (total || 100)) * (2 * Math.PI);
    const endAngle = startAngle + sweep;

    ctx.beginPath();
    // Subtly gap arcs
    const gap = 0.035;
    ctx.arc(centerX, centerY, radius, startAngle + gap, endAngle - gap);
    ctx.strokeStyle = config.colors[i] || "#FF5A1F";
    ctx.lineWidth = strokeW;
    ctx.lineCap = "round";
    ctx.stroke();

    startAngle = endAngle;
  });

  // Center Readout Box
  ctx.fillStyle = "#12141A";
  ctx.textAlign = "center";
  ctx.font = "600 36px 'Google Sans', sans-serif";
  ctx.fillText(config.centerMetric.primary, centerX, centerY + 8);

  ctx.fillStyle = "#666C78";
  ctx.font = "500 13px 'Google Sans', sans-serif";
  ctx.fillText(config.centerMetric.label.toUpperCase(), centerX, centerY - 32);

  if (config.centerMetric.sublabel) {
    ctx.fillStyle = "#FF5A1F";
    ctx.font = "500 13px 'Google Sans', sans-serif";
    ctx.fillText(config.centerMetric.sublabel, centerX, centerY + 36);
  }

  // 4. Right Section: Data Rows & Breakdown
  const listX = 540;
  let listY = 250;
  ctx.textAlign = "left";

  config.rows.forEach((row, i) => {
    const color = config.colors[i] || "#FF5A1F";

    // Row Container Card
    ctx.fillStyle = "#FAFAF9";
    ctx.beginPath();
    ctx.roundRect(listX, listY, 612, 64, 10);
    ctx.fill();
    ctx.strokeStyle = "#EDE8E0";
    ctx.lineWidth = 1;
    ctx.stroke();

    // Color Swatch Pill
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(listX + 16, listY + 22, 10, 20, 4);
    ctx.fill();

    // Label
    ctx.fillStyle = "#12141A";
    ctx.font = "600 15px 'Google Sans', sans-serif";
    ctx.fillText(row.label, listX + 38, listY + 37);

    // Detail / Sublabel
    if (row.detail) {
      ctx.fillStyle = "#8C93A3";
      ctx.font = "400 12px 'Google Sans', sans-serif";
      ctx.fillText(row.detail, listX + 38, listY + 53);
    }

    // Value and Share (Right aligned)
    ctx.textAlign = "right";
    ctx.fillStyle = "#12141A";
    ctx.font = "600 16px 'Google Sans', sans-serif";
    ctx.fillText(row.value, listX + 596, listY + 36);

    ctx.fillStyle = "#666C78";
    ctx.font = "500 13px 'Google Sans', sans-serif";
    ctx.fillText(row.share, listX + 596, listY + 53);

    ctx.textAlign = "left";
    listY += 76;
  });

  // 5. Footer Watermark & Timestamp
  const now = new Date().toLocaleDateString("en-IN", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  ctx.fillStyle = "#8C93A3";
  ctx.font = "400 12px 'Google Sans', sans-serif";
  ctx.fillText(
    `Verified live database export • Generated on ${now} • Roos Growth OS`,
    48,
    height - 24
  );

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (blob) {
        downloadBlob(blob, `${filename}.png`);
      }
      resolve();
    }, "image/png");
  });
}

/**
 * Export standalone scalable SVG vector file
 */
export function exportCardAsSvg(
  svgElementId: string,
  filename: string,
  title: string
): void {
  if (typeof window === "undefined") return;

  const svgElem = document.getElementById(svgElementId);
  if (!svgElem) return;

  const clone = svgElem.cloneNode(true) as SVGElement;
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  clone.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink");

  const serializer = new XMLSerializer();
  let svgString = serializer.serializeToString(clone);

  // Prepend XML declaration and metadata comment
  svgString = `<?xml version="1.0" encoding="UTF-8"?>\n<!-- ${title} - Exported from Roos Growth OS -->\n${svgString}`;

  const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
  downloadBlob(blob, `${filename}.svg`);
}

/**
 * Export tabular dataset as CSV
 */
export function exportTableAsCsv(
  filename: string,
  headers: string[],
  rows: (string | number)[][]
): void {
  if (typeof window === "undefined") return;

  const formatCell = (val: string | number) => {
    const s = String(val).replace(/"/g, '""');
    return `"${s}"`;
  };

  const csvContent = [
    headers.map(formatCell).join(","),
    ...rows.map((row) => row.map(formatCell).join(",")),
  ].join("\r\n");

  const blob = new Blob(["\uFEFF" + csvContent], {
    type: "text/csv;charset=utf-8;",
  });
  downloadBlob(blob, `${filename}.csv`);
}
