import { randomUUID } from "node:crypto";
import {
  DeleteObjectCommand,
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
// server-side max-content-length without pre-declaring an exact
// ContentLength, which we don't know client-side ahead of compression.
// The size cap (MAX_PHOTO_BYTES in @woodaa/validators) is therefore
// enforced client-side only - acceptable for v1 (only reachable by an
// authenticated facility owner, self-inflicted at worst).
export async function createPresignedUploadUrl(
  key: string,
  contentType: string,
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: requireEnv("R2_BUCKET_NAME"),
    Key: key,
    ContentType: contentType,
  });
  return getSignedUrl(r2Client(), command, {
    expiresIn: PRESIGNED_PUT_TTL_SECONDS,
  });
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
// key = null means the row is a designed placeholder tile (no real upload,
// see PhotoCategory on FacilityPhoto) - url is null too, and the frontend
// renders PlaceholderPhoto from `category` instead of an <img>.
export function withPhotoUrl<T extends { key: string | null }>(
  photo: T,
): T & { url: string | null } {
  return { ...photo, url: photo.key ? publicPhotoUrl(photo.key) : null };
}

export function newPhotoKey(facilityId: string, extension: string): string {
  return `facilities/${facilityId}/${randomUUID()}.${extension}`;
}
