// R2 connection test — verifies credentials + bucket access.
// Run: node scripts/test-r2.mjs
import { HeadBucketCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
import fs from "node:fs";

function loadEnv() {
  try {
    const env = fs.readFileSync(".env.local", "utf8");
    for (const line of env.split(/\r?\n/)) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      const idx = t.indexOf("=");
      if (idx === -1) continue;
      process.env[t.slice(0, idx).trim()] ??= t.slice(idx + 1).trim().replace(/^["']|["']$/g, "");
    }
  } catch {}
}

loadEnv();

const { S3Client } = await import("@aws-sdk/client-s3");

const accountId = process.env.R2_ACCOUNT_ID || process.env.CLOUDFLARE_ACCOUNT_ID;
const accessKey = process.env.R2_ACCESS_KEY_ID;
const secret = process.env.R2_SECRET_ACCESS_KEY;
const bucket = process.env.R2_PRIVATE_BUCKET_NAME || process.env.R2_BUCKET_NAME;

const missing = [];
if (!accountId) missing.push("R2_ACCOUNT_ID or CLOUDFLARE_ACCOUNT_ID");
if (!accessKey) missing.push("R2_ACCESS_KEY_ID");
if (!secret) missing.push("R2_SECRET_ACCESS_KEY");
if (!bucket) missing.push("R2_PRIVATE_BUCKET_NAME or R2_BUCKET_NAME");
if (missing.length) {
  console.error("❌ Missing env vars:", missing.join(", "));
  process.exit(1);
}

const client = new S3Client({
  region: "auto",
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: accessKey, secretAccessKey: secret },
});

const bucketExists = async () => {
  try {
    await client.send(new HeadBucketCommand({ Bucket: bucket }));
    return true;
  } catch (e) {
    return e?.name === "NotFound" ? "not_found" : `error: ${e?.name} — ${e?.message}`;
  }
};

// Scoped R2 tokens can't ListBuckets — test the target bucket directly.
const hasBucket = await bucketExists();
if (hasBucket === true) {
  console.log(`✅ R2 reachable. Bucket "${bucket}" exists and is accessible.`);
  try {
    const list = await client.send(new ListObjectsV2Command({ Bucket: bucket, MaxKeys: 5 }));
    console.log(`   Objects in bucket: ${list.KeyCount ?? 0}${list.Contents?.length ? " (sample: " + list.Contents.map((o) => o.Key).join(", ") + ")" : ""}`);
  } catch (e) {
    console.log(`   (can't list objects — ${e?.name ?? e?.message})`);
  }
} else {
  console.log(`❌ Bucket "${bucket}": ${hasBucket}`);
  process.exit(1);
}
