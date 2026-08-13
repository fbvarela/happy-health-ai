import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getEnv } from "@/lib/env";

/**
 * R2 private storage (health data is sensitive — never public URLs, SPEC §9.5/D2).
 * Follows the Happy Factory `garden` pattern but uses the PRIVATE bucket + signed URLs.
 */
let _r2;
export function getR2() {
  if (!_r2) {
    _r2 = new S3Client({
      region: "auto",
      endpoint: `https://${getEnv("R2_ACCOUNT_ID")}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: getEnv("R2_ACCESS_KEY_ID"),
        secretAccessKey: getEnv("R2_SECRET_ACCESS_KEY"),
      },
    });
  }
  return _r2;
}

function getBucket() {
  return getEnv("R2_PRIVATE_BUCKET_NAME") ?? "happyfactory-private";
}

export function hasR2Creds() {
  return Boolean(
    getEnv("R2_ACCOUNT_ID") &&
    getEnv("R2_ACCESS_KEY_ID") &&
    getEnv("R2_SECRET_ACCESS_KEY")
  );
}

/** Keys must be namespaced: [app]/[userId]/[timestamp]-[uuid].[ext] */
export function buildKey(userId, filename) {
  const ts = Date.now();
  const id = crypto.randomUUID();
  const ext = filename?.includes(".") ? filename.split(".").pop().toLowerCase() : "bin";
  return `health/${userId}/${ts}-${id}.${ext}`;
}

/** Uploads bytes to the private bucket. Returns the key. */
export async function uploadToR2(key, body, contentType) {
  await getR2().send(
    new PutObjectCommand({ Bucket: getBucket(), Key: key, Body: body, ContentType: contentType })
  );
  return key;
}

/** Deletes an object. */
export async function deleteFromR2(key) {
  await getR2().send(new DeleteObjectCommand({ Bucket: getBucket(), Key: key }));
}

/** Returns a signed URL (1h) for a private object — the only way to read it. */
export async function getSignedFileUrl(key) {
  return getSignedUrl(getR2(), new GetObjectCommand({ Bucket: getBucket(), Key: key }), {
    expiresIn: 3600,
  });
}

/** Returns a presigned PUT URL for direct browser upload (Pattern B). */
export async function getSignedUploadUrl(key, contentType) {
  return getSignedUrl(
    getR2(),
    new PutObjectCommand({ Bucket: getBucket(), Key: key, ContentType: contentType }),
    { expiresIn: 600 }
  );
}
