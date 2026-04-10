/**
 * S3 Asset Service
 *
 * Handles file uploads to AWS S3 for workspace branding assets (logos, favicons).
 * Returns CloudFront CDN URLs for fast, edge-cached delivery.
 *
 * Key structure: workspaces/{workspaceId}/{type}-{timestamp}.{ext}
 *
 * Environment variables required:
 * - AWS_REGION
 * - AWS_ACCESS_KEY_ID
 * - AWS_SECRET_ACCESS_KEY
 * - S3_BUCKET_NAME
 * - CLOUDFRONT_DOMAIN
 */

import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import logger from "../lib/logger.js";

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME || "supporthub-assets";
const CLOUDFRONT_DOMAIN = process.env.CLOUDFRONT_DOMAIN || "";

/**
 * Upload a file buffer to S3 and return its CloudFront URL.
 *
 * @param buffer - The file contents as a Buffer
 * @param key - The S3 object key (path within the bucket)
 * @param contentType - MIME type of the file (e.g., "image/png")
 * @returns The public CloudFront URL for the uploaded file
 */
export async function uploadFile(
  buffer: Buffer,
  key: string,
  contentType: string,
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: contentType,
    CacheControl: "public, max-age=31536000, immutable",
  });

  await s3Client.send(command);

  const url = CLOUDFRONT_DOMAIN
    ? `https://${CLOUDFRONT_DOMAIN}/${key}`
    : `https://${BUCKET_NAME}.s3.amazonaws.com/${key}`;

  logger.info({ key, contentType }, "File uploaded to S3");
  return url;
}

/**
 * Delete a file from S3 by its key.
 *
 * @param key - The S3 object key to delete
 */
export async function deleteFile(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  await s3Client.send(command);
  logger.info({ key }, "File deleted from S3");
}

/**
 * Extract the S3 key from a CloudFront or S3 URL.
 * Used when replacing or deleting an existing asset.
 *
 * @param url - The full CloudFront/S3 URL
 * @returns The S3 object key, or null if the URL doesn't match
 */
export function extractKeyFromUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    // Remove leading slash from pathname
    return parsed.pathname.slice(1);
  } catch {
    return null;
  }
}

/**
 * Generate a unique S3 key for a workspace branding asset.
 *
 * @param workspaceId - The workspace UUID
 * @param type - Asset type ("logo" or "favicon")
 * @param extension - File extension (e.g., "png", "svg")
 * @returns The S3 object key
 */
export function generateAssetKey(
  workspaceId: string,
  type: "logo" | "favicon",
  extension: string,
): string {
  const timestamp = Date.now();
  return `workspaces/${workspaceId}/${type}-${timestamp}.${extension}`;
}
