import { getSupabaseBaseUrl, getServiceRoleKey } from '@/lib/supabase/rest';

interface UploadOptions {
  bucket: string;
  objectPath: string;
  body: ArrayBuffer | Uint8Array | Buffer;
  contentType?: string;
  upsert?: boolean;
}

export interface UploadResult {
  path: string;
  publicUrl: string;
}

function cloneToArrayBuffer(view: ArrayBufferView): ArrayBuffer {
  const buffer = new ArrayBuffer(view.byteLength);
  const array = new Uint8Array(buffer);
  array.set(new Uint8Array(view.buffer, view.byteOffset, view.byteLength));
  return buffer;
}

function toBlobBody(body: UploadOptions['body']): Blob {
  if (body instanceof ArrayBuffer) {
    return new Blob([body]);
  }
  if (ArrayBuffer.isView(body)) {
    return new Blob([cloneToArrayBuffer(body)]);
  }
  throw new TypeError('Unsupported storage upload body type');
}

function buildStorageUrl(bucket: string, encodedPath: string): string {
  const baseUrl = getSupabaseBaseUrl().replace(/\/+$/, '');
  const cleanBucket = bucket.replace(/^\/+/, '');
  return `${baseUrl}/storage/v1/object/${cleanBucket}/${encodedPath}`;
}

function encodePath(path: string): string {
  return path
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');
}

function buildPublicUrl(bucket: string, path: string): string {
  const baseUrl = getSupabaseBaseUrl().replace(/\/+$/, '');
  const cleanBucket = bucket.replace(/^\/+/, '');
  const cleanPath = path.replace(/^\/+/, '');
  return `${baseUrl}/storage/v1/object/public/${cleanBucket}/${cleanPath}`;
}

export async function uploadStorageObject(options: UploadOptions): Promise<UploadResult> {
  const { bucket, objectPath, body, contentType, upsert } = options;
  const data = toBlobBody(body);
  const encodedPath = encodePath(objectPath.replace(/^\/+/, ''));
  const url = buildStorageUrl(bucket, encodedPath);
  const serviceKey = getServiceRoleKey();

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': contentType ?? 'application/octet-stream',
      'x-upsert': upsert ? 'true' : 'false',
    },
    body: data,
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`Failed to upload storage object (${response.status}): ${text}`);
  }

  return {
    path: objectPath.replace(/^\/+/, ''),
    publicUrl: buildPublicUrl(bucket, objectPath),
  };
}
