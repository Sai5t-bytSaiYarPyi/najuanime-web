// src/app/api/process-pdf/route.ts
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
import { Canvas, createCanvas, Image } from 'canvas';
import path from 'path';

// This is required for pdfjs-dist to work in a Node.js environment
GlobalWorkerOptions.workerSrc = path.join(
  process.cwd(),
  'node_modules',
  'pdfjs-dist',
  'build',
  'pdf.worker.mjs'
);

// Custom Canvas factory to integrate with pdfjs-dist
class NodeCanvasFactory {
  create(width: number, height: number) {
    const canvas = createCanvas(width, height);
    const context = canvas.getContext('2d');
    return {
      canvas,
      context,
    };
  }

  reset(canvasAndContext: any, width: number, height: number) {
    canvasAndContext.canvas.width = width;
    canvasAndContext.canvas.height = height;
  }

  destroy(canvasAndContext: any) {
    canvasAndContext.canvas.width = 0;
    canvasAndContext.canvas.height = 0;
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
      return NextResponse.json({ message: 'Not an insert event or no PDF URL.' });
    }

    // 1. Download PDF to a buffer
    const response = await fetch(newChapter.pdf_url);
    if (!response.ok) throw new Error('Failed to fetch PDF from URL');
    const pdfBuffer = await response.arrayBuffer();

    // 2. Process PDF with pdfjs-dist
    const pdfDocument = await getDocument({ data: pdfBuffer }).promise;
    const canvasFactory = new NodeCanvasFactory();
    const imageUrls: string[] = [];

    // 3. Loop through each page, render to canvas, and upload
    for (let i = 1; i <= pdfDocument.numPages; i++) {
      const page = await pdfDocument.getPage(i);
      const viewport = page.getViewport({ scale: 1.5 }); // Adjust scale for resolution
      const canvasAndContext = canvasFactory.create(viewport.width, viewport.height);
      
      await page.render({
        canvasContext: canvasAndContext.context,
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

      // Clean up canvas to free memory
      canvasFactory.destroy(canvasAndContext);
    }

    // 4. Update the database record
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

// Add this config to prevent Next.js from parsing the request body
export const config = {
  api: {
    bodyParser: false,
  },
};