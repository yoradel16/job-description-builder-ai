import { NextResponse } from "next/server";
import {
  PDFDocument,
  PDFPage,
  PDFFont,
  StandardFonts,
  rgb,
  RGB,
} from "pdf-lib";

export async function POST(request: Request) {
  try {
    const data = await request.json();

    // Only get the preview section
    const preview = data.preview || {};

    // Title with recommended_role + timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const title = `${preview.recommended_role || "Analysis"}_${timestamp}.pdf`;

    // Create a PDF
    const pdfDoc = await PDFDocument.create();
    let page = pdfDoc.addPage();
    const { width, height } = page.getSize();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const margin = 50;
    let y = height - margin;

    // Utility to draw text and move y
    interface DrawLineOptions {
      size?: number;
      bold?: boolean;
      color?: RGB;
    }

    const drawLine = (text: string, opts: DrawLineOptions = {}) => {
      const { size = 12, bold = false, color = rgb(0, 0, 0) } = opts;
      const fontToUse = bold ? fontBold : font;
      const lines = splitTextIntoLines(
        text,
        width - margin * 2,
        size,
        fontToUse
      );
      for (const line of lines) {
        if (y < margin) {
          // new page if we run out of space
          const newPage = pdfDoc.addPage();
          y = height - margin;
          page = newPage;
        }
        page.drawText(line, { x: margin, y, size, font: fontToUse, color });
        y -= size + 4;
      }
    };

    // Draw the header
    drawLine(preview.recommended_role || "Job Role", {
      size: 18,
      bold: true,
      color: rgb(0.1, 0.1, 0.5),
    });
    y -= 10;
    drawLine("Job Description Analysis", { size: 12 });
    y -= 20;

    // Format the preview data
    for (const [key, value] of Object.entries(preview)) {
      drawLine(key.replace(/_/g, " ").toUpperCase(), { size: 12, bold: true });
      if (Array.isArray(value)) {
        for (const item of value) drawLine(`• ${item}`, { size: 10 });
      } else if (typeof value === "object" && value !== null) {
        drawLine(JSON.stringify(value, null, 2), { size: 10 });
      } else {
        drawLine(String(value), { size: 10 });
      }
      y -= 10;
    }

    // Save PDF
    const pdfBytes = await pdfDoc.save();
    const buffer = Buffer.from(pdfBytes);

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=${title}`,
      },
    });
  } catch (error) {
    console.error("PDF generation error:", error);
    return new NextResponse("Failed to generate PDF", { status: 500 });
  }
}

// Helper function to wrap long lines
function splitTextIntoLines(
  text: string,
  maxWidth: number,
  fontSize: number,
  font: PDFFont
): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const width = font.widthOfTextAtSize(line + word, fontSize);
    if (width > maxWidth && line !== "") {
      lines.push(line.trim());
      line = word + " ";
    } else {
      line += word + " ";
    }
  }
  if (line) lines.push(line.trim());
  return lines;
}
