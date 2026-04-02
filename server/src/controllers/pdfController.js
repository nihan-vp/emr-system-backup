import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';

let browserInstance = null;
let chromiumPath = null;
let launching = false;

// Shared browser instance
const getBrowser = async () => {
  if (browserInstance) return browserInstance;

  if (launching) {
    while (launching) {
      await new Promise((r) => setTimeout(r, 100));
    }
    return browserInstance;
  }

  launching = true;

  try {
    if (!chromiumPath) {
      chromiumPath = await chromium.executablePath();
      console.log('📍 Chromium path cached:', chromiumPath);
    }

    browserInstance = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: chromiumPath,
      headless: chromium.headless,
    });

    console.log('✅ Shared browser launched');

    return browserInstance;
  } finally {
    launching = false;
  }
};

// Sanitize HTML
function sanitizeHtml(html) {
  return String(html || '').replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '');
}

// Controller
export const generatePdfFromHtml = async (req, res) => {
  const { html, pdfOptions = {}, filename = 'document.pdf' } = req.body || {};

  if (!html) {
    return res.status(400).json({ ok: false, message: 'Missing HTML content.' });
  }

  const safeHtml = sanitizeHtml(html);

  const defaultOptions = {
    format: 'A4',
    printBackground: true,
    margin: { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' },
    ...pdfOptions,
  };

  let timeoutId;

  try {
    console.log('🚀 Starting PDF generation...');

    const browser = await getBrowser(); // ✅ ONLY THIS
    console.log('✅ Using shared browser');

    const page = await browser.newPage();
    console.log('✅ New page created');

    await page.setContent(safeHtml, {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });

    console.log('✅ HTML content set');

    await page.evaluateHandle('document.fonts.ready');
    console.log('✅ Fonts loaded');

    const pdfPromise = page.pdf(defaultOptions);
    console.log('⏳ Generating PDF...');

    const timeoutPromise = new Promise((_, reject) => {
      timeoutId = setTimeout(
        () => reject(new Error('PDF generation timed out')),
        60000
      );
    });

    const pdfBuffer = await Promise.race([pdfPromise, timeoutPromise]);
    clearTimeout(timeoutId);

    console.log('✅ PDF generated');

    await page.close(); // ✅ close page, NOT browser

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${filename}"`
    );

    return res.send(pdfBuffer);

  } catch (error) {
    console.error('❌ [pdf] Error generating PDF:', error);

    return res.status(500).json({
      ok: false,
      message: error.message || 'PDF generation failed.',
    });
  }
};