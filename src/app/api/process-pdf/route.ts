// src/app/api/process-pdf/route.ts
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { getDocument, GlobalWorkerOptions, PDFPageProxy } from 'pdfjs-dist';
import { Canvas, createCanvas, CanvasRenderingContext2D } from 'canvas';
import path from 'path';

GlobalWorkerOptions.workerSrc = path.join(
  process.cwd(),
  'node_modules',
  'pdfjs-dist',
  'build',
  'pdf.worker.mjs'
);

interface CanvasAndContext {
  canvas: Canvas | null;
  context: CanvasRenderingContext2D | null;
}

class NodeCanvasFactory {
  create(width: number, height: number): CanvasAndContext {
    const canvas = createCanvas(width, height);
    // THIS IS THE FIX: Changed 'd' to '2d'
    const context = canvas.getContext('2d'); 
    return {
      canvas,
      context,
    };
  }

  reset(canvasAndContext: CanvasAndContext, width: number, height: number) {
    if (canvasAndContext.canvas) {
        canvasAndContext.canvas.width = width;
        canvasAndContext.canvas.height = height;
    }
  }

  destroy(canvasAndContext: CanvasAndContext) {
    if (canvasAndContext.canvas) {
        canvasAndContext.canvas.width = 0;
        canvasAndContext.canvas.height = 0;
    }
    canvasAndContext.canvas = null;
    canvasAndContext.context = null;
  }
}

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function POST(request: Request) {
  const secret = request.headers.get('x-webhook-secret');
  if (secret !== process.env.PROCESSING_SECRET_TOKEN) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const payload = await request.json();
    const newChapter = payload.record;

    if (payload.type !== 'INSERT' || !newChapter || !newChapter.pdf_url) {
      return NextResponse.json({ message: 'Request is not a new chapter insert.' });
    }

    const response = await fetch(newChapter.pdf_url);
    if (!response.ok) throw new Error('Failed to fetch PDF from URL');
    const pdfBuffer = await response.arrayBuffer();

    const pdfDocument = await getDocument({ data: pdfBuffer }).promise;
    const canvasFactory = new NodeCanvasFactory();
    const imageUrls: string[] = [];

    for (let i = 1; i <= pdfDocument.numPages; i++) {
      const page: PDFPageProxy = await pdfDocument.getPage(i);
      const viewport = page.getViewport({ scale: 1.5 });
      const canvasAndContext = canvasFactory.create(viewport.width, viewport.height);
      
      await page.render({
        canvasContext: canvasAndContext.context as any,
        viewport: viewport,
        canvasFactory: canvasFactory,
      }).promise;

      const imageBuffer = (canvasAndContext.canvas as Canvas).toBuffer('image/png');
      
      const storagePath = `chapters/${newChapter.id}/page_${String(i).padStart(3, '0')}.png`;

      const { error: uploadError } = await supabaseAdmin.storage
        .from('manhwa-images')
        .upload(storagePath, imageBuffer, { contentType: 'image/png', upsert: true });

      if (uploadError) throw new Error(`Failed to upload page ${i}: ${uploadError.message}`);

      const { data: urlData } = supabaseAdmin.storage.from('manhwa-images').getPublicUrl(storagePath);
      imageUrls.push(urlData.publicUrl);

      canvasFactory.destroy(canvasAndContext);
    }

    const { error: updateError } = await supabaseAdmin
      .from('manhwa_chapters')
      .update({ image_urls: imageUrls })
      .eq('id', newChapter.id);

    if (updateError) throw new Error(`Failed to update chapter DB record: ${updateError.message}`);

    return NextResponse.json({ message: `Successfully processed ${pdfDocument.numPages} pages.` });

  } catch (error: unknown) {
    console.error('Error processing PDF:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}