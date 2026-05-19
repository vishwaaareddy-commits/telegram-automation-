/**
 * build_docx.js
 * Reads a JSON research report and writes a styled DOCX file.
 * Usage: node build_docx.js input.json output.docx
 */

const fs   = require("fs");
const path = require("path");
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, HeadingLevel, LevelFormat, BorderStyle,
  WidthType, ShadingType, VerticalAlign, PageBreak, PageNumberElement,
  TabStopType, TabStopPosition
} = require("docx");

// ─── CLI args ───────────────────────────────────────────────────────────────
const [,, jsonPath, outputPath] = process.argv;
if (!jsonPath || !outputPath) {
  console.error("Usage: node build_docx.js <input.json> <output.docx>");
  process.exit(1);
}

const report = JSON.parse(fs.readFileSync(jsonPath, "utf8"));

// ─── Colour palette ─────────────────────────────────────────────────────────
const C = {
  primary   : "1B3A6B",   // Deep navy
  accent    : "2E75B6",   // Professional blue
  light     : "D5E8F0",   // Light blue fill
  header_bg : "1B3A6B",   // Title page bg
  white     : "FFFFFF",
  dark      : "1A1A2E",
  grey      : "666666",
  lightGrey : "F5F5F5",
  border    : "CCCCCC",
};

// ─── Border helpers ──────────────────────────────────────────────────────────
const thinBorder  = { style: BorderStyle.SINGLE, size: 1, color: C.border };
const cellBorders = { top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder };

// ─── Spacing helper ──────────────────────────────────────────────────────────
const sp = (before = 0, after = 0, line = 276) => ({
  spacing: { before, after, line }
});

// ════════════════════════════════════════════════════════════════════════════
// PARAGRAPH BUILDERS
// ════════════════════════════════════════════════════════════════════════════

function coverTitle(text) {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    ...sp(480, 120),
    children: [new TextRun({ text, font: "Arial", size: 56, bold: true, color: C.white })]
  });
}

function coverSubtitle(text) {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    ...sp(120, 120),
    children: [new TextRun({ text, font: "Arial", size: 30, color: "BDD7EE", italics: true })]
  });
}

function coverMeta(text) {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    ...sp(80, 80),
    children: [new TextRun({ text, font: "Arial", size: 22, color: "9DC3E6" })]
  });
}

function sectionDivider(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    children: [new TextRun({ text, font: "Arial", size: 32, bold: true, color: C.primary })]
  });
}

function subHeading(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    children: [new TextRun({ text, font: "Arial", size: 26, bold: true, color: C.accent })]
  });
}

function bodyPara(text) {
  return new Paragraph({
    ...sp(80, 80, 288),
    children: [new TextRun({ text, font: "Arial", size: 22, color: C.dark })]
  });
}

function bulletPara(text) {
  return new Paragraph({
    numbering: { reference: "bullets", level: 0 },
    children: [new TextRun({ text, font: "Arial", size: 22, color: C.dark })]
  });
}

function accentBox(text) {
  // A highlighted paragraph as a visual callout
  return new Paragraph({
    ...sp(160, 160),
    border: {
      left: { style: BorderStyle.SINGLE, size: 12, color: C.accent, space: 10 }
    },
    indent: { left: 360 },
    children: [new TextRun({ text, font: "Arial", size: 22, color: C.dark, italics: true })]
  });
}

function pageBreakPara() {
  return new Paragraph({ children: [new PageBreak()] });
}

function hrPara() {
  return new Paragraph({
    ...sp(120, 120),
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: C.accent, space: 1 } },
    children: [new TextRun("")]
  });
}

// ════════════════════════════════════════════════════════════════════════════
// TABLE BUILDER
// ════════════════════════════════════════════════════════════════════════════
function buildTable(tableData) {
  if (!tableData || !tableData.headers || !tableData.rows) return null;

  const colCount  = tableData.headers.length;
  const tableW    = 9360;
  const colW      = Math.floor(tableW / colCount);

  const headerRow = new TableRow({
    tableHeader: true,
    children: tableData.headers.map(h =>
      new TableCell({
        borders    : cellBorders,
        width      : { size: colW, type: WidthType.DXA },
        shading    : { fill: C.primary, type: ShadingType.CLEAR },
        margins    : { top: 100, bottom: 100, left: 140, right: 140 },
        verticalAlign: VerticalAlign.CENTER,
        children   : [new Paragraph({
          alignment: AlignmentType.CENTER,
          children : [new TextRun({ text: h, font: "Arial", size: 20, bold: true, color: C.white })]
        })]
      })
    )
  });

  const dataRows = tableData.rows.map((row, ri) =>
    new TableRow({
      children: row.map(cell =>
        new TableCell({
          borders : cellBorders,
          width   : { size: colW, type: WidthType.DXA },
          shading : { fill: ri % 2 === 0 ? C.lightGrey : C.white, type: ShadingType.CLEAR },
          margins : { top: 80, bottom: 80, left: 140, right: 140 },
          children: [new Paragraph({
            children: [new TextRun({ text: String(cell), font: "Arial", size: 20, color: C.dark })]
          })]
        })
      )
    })
  );

  return new Table({
    width       : { size: tableW, type: WidthType.DXA },
    columnWidths: Array(colCount).fill(colW),
    rows        : [headerRow, ...dataRows]
  });
}

// ════════════════════════════════════════════════════════════════════════════
// HEADER / FOOTER
// ════════════════════════════════════════════════════════════════════════════
function makeHeader(title) {
  return new Header({
    children: [
      new Paragraph({
        border  : { bottom: { style: BorderStyle.SINGLE, size: 4, color: C.accent, space: 1 } },
        tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
        children: [
          new TextRun({ text: title.slice(0, 60), font: "Arial", size: 18, color: C.grey }),
          new TextRun({ text: "\t", font: "Arial", size: 18 }),
          new TextRun({ text: "Research Report", font: "Arial", size: 18, color: C.accent, bold: true })
        ]
      })
    ]
  });
}

function makeFooter() {
  return new Footer({
    children: [
      new Paragraph({
        border  : { top: { style: BorderStyle.SINGLE, size: 4, color: C.accent, space: 1 } },
        tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
        ...sp(60, 0),
        children: [
          new TextRun({ text: "Powered by Claude AI", font: "Arial", size: 16, color: C.grey }),
          new TextRun({ text: "\t", font: "Arial", size: 16 }),
          new TextRun({ text: "Page ", font: "Arial", size: 16, color: C.grey }),
          new PageNumberElement()
        ]
      })
    ]
  });
}

// ════════════════════════════════════════════════════════════════════════════
// COVER PAGE SECTION
// ════════════════════════════════════════════════════════════════════════════
function buildCoverSection(report) {
  return {
    properties: {
      page: {
        size  : { width: 12240, height: 15840 },
        margin: { top: 0, right: 0, bottom: 0, left: 0 }
      }
    },
    children: [
      new Paragraph({
        alignment : AlignmentType.CENTER,
        shading   : { fill: C.primary, type: ShadingType.CLEAR },
        ...sp(1440, 0),
        children  : [new TextRun({ text: "", font: "Arial", size: 24 })]
      }),
      new Paragraph({
        alignment : AlignmentType.CENTER,
        shading   : { fill: C.primary, type: ShadingType.CLEAR },
        ...sp(0, 0),
        children  : [new TextRun({ text: "RESEARCH REPORT", font: "Arial", size: 22, bold: true, color: "9DC3E6" })]
      }),
      coverTitle(report.title || "Research Report"),
      ...(report.subtitle ? [coverSubtitle(report.subtitle)] : []),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        shading  : { fill: C.primary, type: ShadingType.CLEAR },
        ...sp(80, 80),
        children : [new TextRun({ text: "─".repeat(30), font: "Arial", size: 22, color: "2E75B6" })]
      }),
      coverMeta(`📅 ${report.date || new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}`),
      coverMeta("Powered by Claude AI Research Engine"),
      new Paragraph({
        shading : { fill: C.primary, type: ShadingType.CLEAR },
        ...sp(1440, 0),
        children: [new TextRun("")]
      }),
    ]
  };
}

// ════════════════════════════════════════════════════════════════════════════
// MAIN BODY SECTION
// ════════════════════════════════════════════════════════════════════════════
function buildBodySection(report) {
  const children = [];
  const hdr      = makeHeader(report.title || "Research Report");
  const ftr      = makeFooter();

  // ── Executive Summary ──────────────────────────────────────────────────
  children.push(sectionDivider("Executive Summary"), hrPara());
  const execText = report.executive_summary || "";
  execText.split(/\n+/).filter(Boolean).forEach(p => children.push(accentBox(p)));
  children.push(pageBreakPara());

  // ── Sections ───────────────────────────────────────────────────────────
  (report.sections || []).forEach((sec, si) => {
    children.push(sectionDivider(sec.heading || `Section ${si + 1}`));
    children.push(hrPara());

    (sec.subsections || []).forEach(sub => {
      if (sub.subheading) children.push(subHeading(sub.subheading));

      (sub.paragraphs || []).forEach(p  => children.push(bodyPara(p)));
      (sub.bullets    || []).forEach(b  => children.push(bulletPara(b)));

      if (sub.table) {
        const tbl = buildTable(sub.table);
        if (tbl) {
          children.push(new Paragraph({ ...sp(160, 160), children: [] }));
          children.push(tbl);
          children.push(new Paragraph({ ...sp(160, 160), children: [] }));
        }
      }
    });

    if (si < (report.sections.length - 1)) children.push(pageBreakPara());
  });

  // ── Conclusion ─────────────────────────────────────────────────────────
  children.push(pageBreakPara());
  children.push(sectionDivider("Conclusion"), hrPara());
  const concText = report.conclusion || "";
  concText.split(/\n+/).filter(Boolean).forEach(p => children.push(bodyPara(p)));

  // ── References ─────────────────────────────────────────────────────────
  children.push(pageBreakPara());
  children.push(sectionDivider("References & Sources"), hrPara());
  (report.references || []).forEach((ref, i) => {
    children.push(new Paragraph({
      ...sp(60, 60),
      children: [
        new TextRun({ text: `[${i + 1}] `, font: "Arial", size: 20, bold: true, color: C.accent }),
        new TextRun({ text: ref, font: "Arial", size: 20, color: C.dark })
      ]
    }));
  });

  return {
    headers : { default: hdr },
    footers : { default: ftr },
    properties: {
      page: {
        size  : { width: 12240, height: 15840 },
        margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 }
      }
    },
    children
  };
}

// ════════════════════════════════════════════════════════════════════════════
// ASSEMBLE & WRITE
// ════════════════════════════════════════════════════════════════════════════
const doc = new Document({
  numbering: {
    config: [{
      reference: "bullets",
      levels   : [{
        level    : 0,
        format   : LevelFormat.BULLET,
        text     : "•",
        alignment: AlignmentType.LEFT,
        style    : { paragraph: { indent: { left: 720, hanging: 360 } } }
      }]
    }]
  },
  styles: {
    default: { document: { run: { font: "Arial", size: 22 } } },
    paragraphStyles: [
      {
        id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run      : { size: 32, bold: true, font: "Arial", color: C.primary },
        paragraph: { spacing: { before: 320, after: 160 }, outlineLevel: 0 }
      },
      {
        id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run      : { size: 26, bold: true, font: "Arial", color: C.accent },
        paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 1 }
      }
    ]
  },
  sections: [
    buildCoverSection(report),
    buildBodySection(report)
  ]
});

Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync(outputPath, buf);
  console.log(`✅ DOCX written: ${outputPath}`);
}).catch(err => {
  console.error("❌ DOCX build error:", err);
  process.exit(1);
});
