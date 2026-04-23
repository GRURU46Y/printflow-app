import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import cloudinary from '@/lib/cloudinary';

const MAX_FILE_SIZE_MB = 50;
const ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/png',
  'image/jpeg',
];

export async function POST(request: Request) {
  try {
    // 1. Authenticate the user via cookie
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    let userId: string | null = null;

    if (token) {
      try {
        const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret-for-dev-only');
        const { payload } = await jwtVerify(token, secret);
        userId = payload.userId as string;
      } catch (e) {
        console.warn('Invalid token, uploading anonymously');
      }
    }

    // 2. Get the file from form data
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // 3. Validate file size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > MAX_FILE_SIZE_MB) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${MAX_FILE_SIZE_MB}MB.` },
        { status: 413 }
      );
    }

    // 4. Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Unsupported file type. Allowed: PDF, DOC, DOCX, PNG, JPG.' },
        { status: 415 }
      );
    }

    // 5. Upload to Cloudinary
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    const cloudinaryResult = await new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'printflow/uploads',
          resource_type: 'auto',
          public_id: `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`,
        },
        (error, result) => {
          if (error || !result) return reject(error);
          resolve(result as { secure_url: string; public_id: string });
        }
      );
      uploadStream.end(buffer);
    });

    // 6. Save PrintJob record to database if user is logged in
    let printJob = null;
    if (userId) {
      printJob = await prisma.printJob.create({
        data: {
          filename: file.name,
          filesize: fileSizeMB,
          status: 'pending',
          fileUrl: cloudinaryResult.secure_url,
          userId: userId,
        },
      });
    }

    return NextResponse.json({
      message: 'File uploaded to cloud successfully!',
      status: 'ready_for_print',
      filename: file.name,
      fileUrl: cloudinaryResult.secure_url,
      printJobId: printJob?.id ?? null,
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
