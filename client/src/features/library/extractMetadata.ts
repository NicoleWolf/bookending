export interface ExtractedMetadata {
  title?:          string;
  description?:    string;
  keywords?:       string;
  estimatedPages?: number;
}

export async function extractFromFile(file: File): Promise<ExtractedMetadata> {
  const ext = file.name.split('.').pop()?.toLowerCase();
  try {
    switch (ext) {
      case 'txt':  return extractTxt(file);
      case 'docx': return extractDocx(file);
      case 'pdf':  return extractPdf(file);
      default:     return {};
    }
  } catch {
    return {};
  }
}

// ── TXT ──────────────────────────────────────────────────────────────────────

async function extractTxt(file: File): Promise<ExtractedMetadata> {
  const text  = await file.text();
  const words = text.trim().split(/\s+/).filter(w => w.length > 0);
  const result: ExtractedMetadata = {
    estimatedPages: Math.max(1, Math.ceil(words.length / 250)),
  };
  const firstLine = text.split('\n').find(l => l.trim().length > 0)?.trim();
  if (firstLine && firstLine.length < 120) result.title = firstLine;
  return result;
}

// ── DOCX ─────────────────────────────────────────────────────────────────────

async function extractDocx(file: File): Promise<ExtractedMetadata> {
  const JSZip = (await import('jszip')).default;
  const zip   = await JSZip.loadAsync(await file.arrayBuffer());
  const result: ExtractedMetadata = {};

  // Document properties: title, description, keywords
  const coreText = await zip.file('docProps/core.xml')?.async('text');
  if (coreText) {
    result.title       = tag(coreText, 'dc:title')       || undefined;
    result.description = tag(coreText, 'dc:description') || tag(coreText, 'dc:subject') || undefined;
    result.keywords    = tag(coreText, 'cp:keywords')    || undefined;
  }

  // Word count from document body
  const docText = await zip.file('word/document.xml')?.async('text');
  if (docText) {
    const plain = docText.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    const words = plain.split(' ').filter(w => w.length > 1).length;
    result.estimatedPages = Math.max(1, Math.ceil(words / 250));
  }

  return result;
}

function tag(xml: string, name: string): string {
  const m = xml.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`));
  return m?.[1]?.trim() ?? '';
}

// ── PDF ───────────────────────────────────────────────────────────────────────

async function extractPdf(file: File): Promise<ExtractedMetadata> {
  const pdfjs = await import('pdfjs-dist');
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url,
  ).href;

  const pdf    = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
  const meta   = await pdf.getMetadata();
  const info   = (meta.info ?? {}) as Record<string, unknown>;
  const result: ExtractedMetadata = { estimatedPages: pdf.numPages };

  if (typeof info.Title    === 'string' && info.Title.trim())    result.title       = info.Title.trim();
  if (typeof info.Subject  === 'string' && info.Subject.trim())  result.description = info.Subject.trim();
  if (typeof info.Keywords === 'string' && info.Keywords.trim()) result.keywords    = info.Keywords.trim();

  // Estimate word count from a sample of pages (max 20)
  const sample    = Math.min(pdf.numPages, 20);
  let   sampleTxt = '';
  for (let i = 1; i <= sample; i++) {
    const page    = await pdf.getPage(i);
    const content = await page.getTextContent();
    sampleTxt += content.items
      .map((it: Record<string, unknown>) => typeof it.str === 'string' ? it.str : '')
      .join(' ');
  }
  if (sampleTxt.trim()) {
    const sampleWords = sampleTxt.split(/\s+/).filter(w => w.length > 0).length;
    const estWords    = Math.round(sampleWords * (pdf.numPages / sample));
    const pagesFromWords = Math.max(1, Math.ceil(estWords / 250));
    // Only override numPages with word-count estimate when it's clearly a text-heavy doc
    if (pagesFromWords > 5) result.estimatedPages = pagesFromWords;
  }

  return result;
}
