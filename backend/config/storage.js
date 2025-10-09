const { 
  S3Client, 
  PutObjectCommand, 
  GetObjectCommand, 
  DeleteObjectCommand, 
  CreateBucketCommand,
  PutBucketCorsCommand 
} = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

function normalizeEndpoint(value) {
  if (!value) return undefined;
  if (value.startsWith('http://') || value.startsWith('https://')) {
    return value;
  }
  return `https://${value}`;
}

const endpoint = normalizeEndpoint(process.env.S3_ENDPOINT);
const publicEndpoint = normalizeEndpoint(process.env.S3_PUBLIC_ENDPOINT) || endpoint;
const bucket = process.env.S3_BUCKET;
const region = process.env.S3_REGION || 'us-east-1';
const rootPrefix = process.env.ARTIFACT_ROOT_PREFIX || 'user';

const isLocalStorage = endpoint?.includes('minio');
const isLinodeStorage = endpoint?.includes('linodeobjects.com');
const forcePathStyle = process.env.S3_FORCE_PATH_STYLE === 'true' || isLocalStorage || isLinodeStorage;

const s3 = new S3Client({
  region,
  endpoint,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY,
    secretAccessKey: process.env.S3_SECRET_KEY
  },
  forcePathStyle
});

const publicS3 = new S3Client({
  region,
  endpoint: publicEndpoint,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY,
    secretAccessKey: process.env.S3_SECRET_KEY
  },
  forcePathStyle
});

let bucketVerified = false;

async function ensureBucketExists() {
  if (bucketVerified || !bucket) return;

  try {
    await s3.send(new CreateBucketCommand({ Bucket: bucket }));
    console.log(`Created object storage bucket: ${bucket}`);
  } catch (error) {
    if (
      error?.Code === 'BucketAlreadyOwnedByYou' ||
      error?.Code === 'BucketAlreadyExists' ||
      error?.$metadata?.httpStatusCode === 409
    ) {
      // Bucket already present
    } else if (error?.Code === 'NotImplemented') {
      console.warn(`Bucket creation not supported on endpoint ${endpoint}; assuming bucket ${bucket} exists.`);
    } else {
      console.warn(`Unable to verify bucket ${bucket}: ${error.message}`);
      throw error;
    }
  }

  try {
    const corsRules = [
      {
        AllowedOrigins: ['https://majicagent.com', 'https://www.majicagent.com', 'http://localhost:5173'],
        AllowedMethods: ['GET', 'PUT', 'HEAD', 'OPTIONS'],
        AllowedHeaders: ['*'],
        ExposeHeaders: ['ETag'],
        MaxAgeSeconds: 3000
      }
    ];
    await s3.send(new PutBucketCorsCommand({
      Bucket: bucket,
      CORSConfiguration: {
        CORSRules: corsRules
      }
    }));
  } catch (error) {
    if (error?.Code === 'NotImplemented') {
      console.warn(`Bucket CORS not supported for ${bucket}; continuing without custom CORS.`);
    } else {
      console.warn(`Unable to apply CORS policy for ${bucket}: ${error.message}`);
    }
  }

  bucketVerified = true;
}

function normalizeId(value) {
  if (!value) return null;
  if (typeof value === 'string') return value;
  if (typeof value === 'object') {
    if (value.toHexString) return value.toHexString();
    if (value._id) return normalizeId(value._id);
  }
  return String(value);
}

function getUserRoot(userId, organizationId = null) {
  const orgId = normalizeId(organizationId);
  const userIdString = normalizeId(userId);
  if (orgId) {
    return `${rootPrefix}/${orgId}/users/${userIdString}`;
  }
  return `${rootPrefix}/${userIdString}`;
}

async function ensureFolderExists(prefix) {
  await ensureBucketExists();
  const key = `${prefix}/`;
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: ''
  });
  try {
    await s3.send(command);
  } catch (error) {
    if (error?.Code === 'NoSuchBucket' || error?.$metadata?.httpStatusCode === 404) {
      console.warn(`Object storage bucket ${bucket} not found; skipping folder creation for ${prefix}`);
      return;
    }
    throw error;
  }
}

async function createUserFolder(userId, organizationId = null) {
  const root = getUserRoot(userId, organizationId);
  try {
    await ensureFolderExists(root);
    await ensureFolderExists(`${root}/artifacts`);
    await ensureFolderExists(`${root}/photos/originals`);
    await ensureFolderExists(`${root}/photos/enhanced`);
  } catch (error) {
    if (error?.Code === 'NoSuchBucket' || error?.$metadata?.httpStatusCode === 404) {
      console.warn(`Skipping user folder provisioning; bucket ${bucket} is unavailable.`);
      return root;
    }
    throw error;
  }
  return root;
}

async function uploadToS3(buffer, key, contentType) {
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: buffer,
    ContentType: contentType
  });
  await s3.send(command);
}

async function deleteFromS3(key) {
  const command = new DeleteObjectCommand({
    Bucket: bucket,
    Key: key
  });
  await s3.send(command);
}

async function generatePresignedUrl(key, expiresIn = 3600) {
  const command = new GetObjectCommand({ Bucket: bucket, Key: key });
  const url = await getSignedUrl(publicS3, command, { expiresIn });

  if (url.includes('minio:9000')) {
    const cleanEndpoint = (publicEndpoint || 'http://localhost:9000')
      .replace('http://', '')
      .replace('https://', '');
    return url.replace('minio:9000', cleanEndpoint);
  }

  return url;
}

async function generateUploadUrl({ key, contentType, expiresIn = 900, metadata = {} }) {
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
    Metadata: metadata
  });
  return getSignedUrl(s3, command, { expiresIn });
}

async function getFileFromS3(key) {
  const command = new GetObjectCommand({ Bucket: bucket, Key: key });
  const response = await s3.send(command);
  const chunks = [];
  for await (const chunk of response.Body) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

module.exports = {
  createUserFolder,
  getUserRoot,
  uploadToS3,
  deleteFromS3,
  generatePresignedUrl,
  generateUploadUrl,
  getFileFromS3
};
