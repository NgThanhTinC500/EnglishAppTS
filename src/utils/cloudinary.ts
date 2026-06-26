import { createHash } from "crypto";
import { NextFunction, Request, Response } from "express";
import { AppError } from "./appError";

type CloudinaryResourceType = "image" | "video" | "auto" | "raw";

interface CloudinaryConfig {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
}

interface CloudinaryUploadOptions {
  folder: string;
  resourceType: CloudinaryResourceType;
}

interface CloudinaryUploadResult {
  secure_url?: string;
  url?: string;
  public_id?: string;
  error?: {
    message?: string;
  };
}

interface FieldUploadOptions {
  [fieldName: string]: CloudinaryUploadOptions;
}

function parseCloudinaryUrl(value: string | undefined): Partial<CloudinaryConfig> {
  if (!value) return {};

  try {
    const url = new URL(value);
    if (url.protocol !== "cloudinary:") return {};

    return {
      cloudName: url.hostname,
      apiKey: decodeURIComponent(url.username),
      apiSecret: decodeURIComponent(url.password),
    };
  } catch {
    return {};
  }
}

function getCloudinaryConfig(): CloudinaryConfig {
  const fromUrl = parseCloudinaryUrl(process.env.CLOUDINARY_URL);
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME || fromUrl.cloudName;
  const apiKey = process.env.CLOUDINARY_API_KEY || fromUrl.apiKey;
  const apiSecret = process.env.CLOUDINARY_API_SECRET || fromUrl.apiSecret;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new AppError(
      "Missing Cloudinary config. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET or CLOUDINARY_URL.",
      500
    );
  }

  return { cloudName, apiKey, apiSecret };
}

function signUploadParams(params: Record<string, string>, apiSecret: string) {
  const signatureBase = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");

  return createHash("sha1")
    .update(`${signatureBase}${apiSecret}`)
    .digest("hex");
}

export async function uploadBufferToCloudinary(
  file: Express.Multer.File,
  options: CloudinaryUploadOptions
) {
  const config = getCloudinaryConfig();
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const uploadParams = {
    folder: options.folder,
    timestamp,
  };

  const formData = new FormData();
  formData.append(
    "file",
    new Blob([file.buffer], { type: file.mimetype }),
    file.originalname
  );
  formData.append("api_key", config.apiKey);
  formData.append("folder", uploadParams.folder);
  formData.append("timestamp", uploadParams.timestamp);
  formData.append("signature", signUploadParams(uploadParams, config.apiSecret));

  const endpoint = `https://api.cloudinary.com/v1_1/${config.cloudName}/${options.resourceType}/upload`;
  const response = await fetch(endpoint, {
    method: "POST",
    body: formData,
  });
  const result = (await response.json()) as CloudinaryUploadResult;

  if (!response.ok) {
    throw new AppError(
      result.error?.message || "Cloudinary upload failed",
      response.status >= 400 && response.status < 500 ? 400 : 502
    );
  }

  const publicUrl = result.secure_url || result.url;
  if (!publicUrl) {
    throw new AppError("Cloudinary upload did not return a public URL", 502);
  }

  return {
    publicId: result.public_id,
    url: publicUrl,
  };
}

function setCloudinaryFileUrl(file: Express.Multer.File, url: string) {
  file.path = url;
  file.filename = url;
}

export function uploadSingleFileToCloudinary(options: CloudinaryUploadOptions) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (req.file) {
        const uploaded = await uploadBufferToCloudinary(req.file, options);
        setCloudinaryFileUrl(req.file, uploaded.url);
      }
      next();
    } catch (error) {
      next(error);
    }
  };
}

export function uploadFieldsToCloudinary(fieldOptions: FieldUploadOptions) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const files = req.files as
        | { [fieldName: string]: Express.Multer.File[] }
        | undefined;

      if (!files) {
        next();
        return;
      }

      await Promise.all(
        Object.entries(files).flatMap(([fieldName, fieldFiles]) => {
          const options = fieldOptions[fieldName];
          if (!options) return [];

          return fieldFiles.map(async (file) => {
            const uploaded = await uploadBufferToCloudinary(file, options);
            setCloudinaryFileUrl(file, uploaded.url);
          });
        })
      );

      next();
    } catch (error) {
      next(error);
    }
  };
}
