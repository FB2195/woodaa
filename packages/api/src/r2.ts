import { randomUUID } from "node:crypto";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

type EnvVarName =
  | "R2_ACCOUNT_ID"
  | "R2_ACCESS_KEY_ID"
  | "R2_SECRET_ACCESS_KEY"
  | "R2_BUCKET_NAME"
  | "R2_PUBLIC_URL";

function requireEnv(name: EnvVarName): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var ${name}`);
  }
  return value;
}

// Lazy singleton, constructed on first use rather than at module load, so
// importing this file doesn't hard-crash a process that never actually
// touches photos (e.g. local dev without R2 configured yet).
let client: S3Client | undefined;

function r2Client(): S3Client {
  if (!client) {
    client = new S3Client({
      region: "auto",
      // The bucket is pinned to EU jurisdiction (data residency for DSGVO) -
      // jurisdiction-restricted R2 buckets are only reachable through the
      // matching jurisdictional endpoint, not the default global one. This
      // must stay in sync with the bucket's actual jurisdiction setting in
      // Cloudflare.
      endpoint: `https://${requireEnv("R2_ACCOUNT_ID")}.eu.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: requireEnv("R2_ACCESS_KEY_ID"),
        secretAccessKey: requireEnv("R2_SECRET_ACCESS_KEY"),
      },
    });
  }
  return client;
}

// Short - the browser is expected to PUT within seconds of requesting this;
// a stale unused URL just fails harmlessly if replayed later.
const PRESIGNED_PUT_TTL_SECONDS = 5 * 60;

// A presigned PUT URL (unlike a presigned POST policy) can't enforce a
// server-side max-content-length up front - the ContentType is pinned by
// the signature (R2 rejects a PUT whose Content-Type header doesn't match
// what was signed here), but the byte size isn't known until the object
// actually exists. The real enforcement point is headUploadedObject below,
// called from confirmPhotoUpload once the browser's PUT has landed - this
// URL merely scopes what *can* be uploaded (key + declared type).
export async function createPresignedUploadUrl(key: string, contentType: string): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: requireEnv("R2_BUCKET_NAME"),
    Key: key,
    ContentType: contentType,
  });
  return getSignedUrl(r2Client(), command, {
    expiresIn: PRESIGNED_PUT_TTL_SECONDS,
  });
}

// Server-side follow-up check for a presigned-PUT upload - returns the
// actually-stored object's size, or null if no object exists at that key
// (upload never happened / client is confirming a fabricated key). Callers
// use this to enforce a byte-size cap post-hoc (see confirmPhotoUpload)
// since the presigned PUT itself can't declare one upfront.
export async function headUploadedObjectSize(key: string): Promise<number | null> {
  try {
    const result = await r2Client().send(
      new HeadObjectCommand({ Bucket: requireEnv("R2_BUCKET_NAME"), Key: key }),
    );
    return result.ContentLength ?? null;
  } catch {
    return null;
  }
}

// Short-lived, generated fresh per view request - unlike facility photos,
// documents in this bucket path carry Sozialdaten and must never be
// resolvable through a stable public URL (see kostenuebernahmeDocumentKey
// in schema.prisma).
const PRESIGNED_GET_TTL_SECONDS = 5 * 60;

export async function createPresignedDownloadUrl(key: string): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: requireEnv("R2_BUCKET_NAME"),
    Key: key,
  });
  return getSignedUrl(r2Client(), command, {
    expiresIn: PRESIGNED_GET_TTL_SECONDS,
  });
}

export function newDocumentKey(bookingId: string, extension: string): string {
  return `booking-documents/${bookingId}/${randomUUID()}.${extension}`;
}

// Vollmacht PDFs are scoped to the uploading user, not a booking (see
// User.vollmachtDocumentKey) - same private, presigned-only access pattern
// as newDocumentKey above.
export function newUserDocumentKey(userId: string, extension: string): string {
  return `user-documents/${userId}/${randomUUID()}.${extension}`;
}

export async function deleteObject(key: string): Promise<void> {
  await r2Client().send(
    new DeleteObjectCommand({ Bucket: requireEnv("R2_BUCKET_NAME"), Key: key }),
  );
}

export function publicPhotoUrl(key: string): string {
  return `${requireEnv("R2_PUBLIC_URL").replace(/\/$/, "")}/${key}`;
}

// Every router that returns FacilityPhoto rows enriches them with a
// resolved `url` before returning (see FacilityWithCapacities/
// FacilityWithDetails in @woodaa/db) - centralized here so URL
// construction (and its one env var) exists in exactly one place.
//
// key has three possible shapes:
// - null: a designed placeholder tile (no real image, see PhotoCategory) -
//   url is null too, the frontend renders PlaceholderPhoto from `category`.
// - starts with "/": a demo/seed photo bundled as a static asset under
//   apps/web/public (see packages/db/prisma/seed.ts) - served as-is by
//   Next.js, no R2 round-trip needed for content that ships with the repo.
// - anything else: a real R2 object key from the operator upload flow -
//   resolved against R2_PUBLIC_URL as before.
export function withPhotoUrl<T extends { key: string | null }>(
  photo: T,
): T & { url: string | null } {
  if (!photo.key) return { ...photo, url: null };
  const url = photo.key.startsWith("/") ? photo.key : publicPhotoUrl(photo.key);
  return { ...photo, url };
}

export function newPhotoKey(facilityId: string, extension: string): string {
  return `facilities/${facilityId}/${randomUUID()}.${extension}`;
}
