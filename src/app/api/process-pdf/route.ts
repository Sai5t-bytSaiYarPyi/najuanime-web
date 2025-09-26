// src/app/api/process-pdf/route.ts
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { Poppler } from 'pdf-poppler';
import path from 'path';
import os from 'os';
import fs from 'fs/promises';

// Initialize Supabase Admin Client
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

    // 1. Download the PDF from storage
    const response = await fetch(newChapter.pdf_url);
    if (!response.ok) throw new Error('Failed to fetch PDF');
    const pdfBuffer = Buffer.from(await response.arrayBuffer());

    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'pdf-images-'));
    const pdfPath = path.join(tempDir, 'source.pdf');
    await fs.writeFile(pdfPath, pdfBuffer);

    // 2. Convert PDF to images
    const poppler = new Poppler();
    const options = {
      pngFile: true,
      out_dir: tempDir,
      out_prefix: 'page',
      scale_to: 1200, // Image width
    };
    await poppler.pdfToImg(pdfPath, options);

    const files = await fs.readdir(tempDir);
    const imageFiles = files.filter(f => f.endsWith('.png')).sort((a, b) => {
        const numA = parseInt(a.match(/\d+/)?.[0] || '0');
        const numB = parseInt(b.match(/\d+/)?.[0] || '0');
        return numA - numB;
    });

    // 3. Upload images to a new storage bucket
    const imageUrls: string[] = [];
    for (const imageFile of imageFiles) {
        const imagePath = path.join(tempDir, imageFile);
        const imageBuffer = await fs.readFile(imagePath);
        const storagePath = `chapters/${newChapter.id}/${imageFile}`;

        const { error: uploadError } = await supabaseAdmin.storage
            .from('manhwa-images')
            .upload(storagePath, imageBuffer, { contentType: 'image/png', upsert: true });

        if (uploadError) throw new Error(`Failed to upload image: ${uploadError.message}`);

        const { data: urlData } = supabaseAdmin.storage.from('manhwa-images').getPublicUrl(storagePath);
        imageUrls.push(urlData.publicUrl);
    }
    
    // 4. Update the database with the new image URLs
    const { error: updateError } = await supabaseAdmin
      .from('manhwa_chapters')
      .update({ image_urls: imageUrls })
      .eq('id', newChapter.id);

    if (updateError) throw new Error(`Failed to update chapter with image URLs: ${updateError.message}`);

    // Clean up temporary files
    await fs.rm(tempDir, { recursive: true, force: true });
    
    return NextResponse.json({ message: 'Processing complete', imageUrls });

  } catch (error: any) {
    console.error('Error processing PDF:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}