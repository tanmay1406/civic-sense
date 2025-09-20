const cloudinary = require("cloudinary").v2;
const path = require("path");
const fs = require("fs").promises;
const crypto = require("crypto");

/**
 * Upload Service for handling file uploads using Cloudinary
 * Supports image and video uploads with transformations
 */
class UploadService {
  constructor() {
    this.useCloudinary = false;
    this.initializeCloudinary();
    this.allowedImageTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
    ];
    this.allowedVideoTypes = [
      "video/mp4",
      "video/mov",
      "video/avi",
      "video/quicktime",
    ];
    this.allowedAudioTypes = [
      "audio/mp3",
      "audio/wav",
      "audio/aac",
      "audio/m4a",
    ];
    this.maxFileSize = parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024; // 10MB
  }

  /**
   * Initialize Cloudinary configuration
   */
  initializeCloudinary() {
    if (
      !process.env.CLOUDINARY_CLOUD_NAME ||
      !process.env.CLOUDINARY_API_KEY ||
      !process.env.CLOUDINARY_API_SECRET
    ) {
      console.log(
        "Cloudinary configuration missing. Using local storage only.",
      );
      this.useCloudinary = false;
      return;
    }

    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    this.useCloudinary = true;
    console.log("Cloudinary initialized successfully");
  }

  /**
   * Generate unique filename
   */
  generateFileName(originalName, prefix = "") {
    const ext = path.extname(originalName).toLowerCase();
    const timestamp = Date.now();
    const random = crypto.randomBytes(8).toString("hex");
    const baseName = path
      .parse(originalName)
      .name.replace(/[^a-zA-Z0-9]/g, "_");
    return `${prefix}${baseName}_${timestamp}_${random}`;
  }

  /**
   * Validate file type and size
   */
  validateFile(file) {
    const errors = [];

    // Check file size
    if (file.size > this.maxFileSize) {
      errors.push(
        `File size exceeds maximum limit of ${this.maxFileSize / (1024 * 1024)}MB`,
      );
    }

    // Check file type
    const allowedTypes = [
      ...this.allowedImageTypes,
      ...this.allowedVideoTypes,
      ...this.allowedAudioTypes,
    ];

    if (!allowedTypes.includes(file.mimetype)) {
      errors.push("File type not supported");
    }

    if (errors.length > 0) {
      throw new Error(`File validation failed: ${errors.join(", ")}`);
    }

    return true;
  }

  /**
   * Upload file to Cloudinary
   */
  async uploadToCloudinary(
    buffer,
    fileName,
    mimeType,
    folder = "general",
    options = {},
  ) {
    try {
      const resourceType = this.getResourceType(mimeType);

      const uploadOptions = {
        resource_type: resourceType,
        public_id: fileName,
        folder: folder,
        use_filename: false,
        unique_filename: false,
        overwrite: false,
        context: {
          service: "civic-issue-reporter",
          uploaded_at: new Date().toISOString(),
        },
        ...options,
      };

      // Add transformations for images
      if (resourceType === "image") {
        uploadOptions.transformation = [
          {
            quality: "auto:good",
            fetch_format: "auto",
            width: 1920,
            height: 1080,
            crop: "limit",
          },
        ];
      }

      // Upload buffer to Cloudinary
      const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          uploadOptions,
          (error, result) => {
            if (error) {
              reject(error);
            } else {
              resolve(result);
            }
          },
        );
        uploadStream.end(buffer);
      });

      return {
        url: result.secure_url,
        public_id: result.public_id,
        resource_type: result.resource_type,
        format: result.format,
        width: result.width,
        height: result.height,
        bytes: result.bytes,
        created_at: result.created_at,
        folder: folder,
      };
    } catch (error) {
      console.error("Cloudinary upload error:", error);
      throw new Error(`Failed to upload file to Cloudinary: ${error.message}`);
    }
  }

  /**
   * Determine resource type based on MIME type
   */
  getResourceType(mimeType) {
    if (this.allowedImageTypes.includes(mimeType)) {
      return "image";
    } else if (this.allowedVideoTypes.includes(mimeType)) {
      return "video";
    } else if (this.allowedAudioTypes.includes(mimeType)) {
      return "video"; // Cloudinary uses 'video' for audio files
    }
    return "raw";
  }

  /**
   * Main upload method
   */
  async uploadFile(file, folder = "general", options = {}) {
    try {
      // Validate file
      this.validateFile(file);

      const fileName = this.generateFileName(file.originalname, folder + "_");

      let result;

      if (this.useCloudinary) {
        // Upload to Cloudinary
        result = await this.uploadToCloudinary(
          file.buffer,
          fileName,
          file.mimetype,
          folder,
          options.cloudinary || {},
        );
      } else {
        // Upload to local storage
        result = await this.uploadToLocal(
          file.buffer,
          fileName,
          file.mimetype,
          folder,
        );
      }

      return {
        ...result,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        uploadedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error("Upload error:", error);
      throw error;
    }
  }

  /**
   * Upload file to local storage
   */
  async uploadToLocal(buffer, fileName, mimeType, folder = "general") {
    const fs = require("fs").promises;
    const path = require("path");

    try {
      // Create uploads directory if it doesn't exist
      const uploadDir = process.env.UPLOAD_DEST || "./uploads";
      const folderPath = path.join(uploadDir, folder);

      await fs.mkdir(folderPath, { recursive: true });

      // Write file to local storage
      const filePath = path.join(folderPath, fileName);
      await fs.writeFile(filePath, buffer);

      const fileUrl = `/uploads/${folder}/${fileName}`;

      return {
        public_id: fileName,
        secure_url: fileUrl,
        url: fileUrl,
        resource_type: mimeType.startsWith("image/") ? "image" : "raw",
        format: path.extname(fileName).substring(1),
        bytes: buffer.length,
        created_at: new Date().toISOString(),
        folder: folder,
        storage_type: "local",
      };
    } catch (error) {
      console.error("Local upload error:", error);
      throw new Error(
        `Failed to upload file to local storage: ${error.message}`,
      );
    }
  }

  /**
   * Upload multiple files
   */
  async uploadMultipleFiles(files, folder = "general", options = {}) {
    try {
      const uploadPromises = files.map((file) =>
        this.uploadFile(file, folder, options),
      );
      const results = await Promise.allSettled(uploadPromises);

      const successful = [];
      const failed = [];

      results.forEach((result, index) => {
        if (result.status === "fulfilled") {
          successful.push(result.value);
        } else {
          failed.push({
            file: files[index].originalname,
            error: result.reason.message,
          });
        }
      });

      return {
        successful,
        failed,
        totalUploaded: successful.length,
        totalFailed: failed.length,
      };
    } catch (error) {
      console.error("Multiple upload error:", error);
      throw error;
    }
  }

  /**
   * Delete file from Cloudinary
   */
  async deleteFile(publicId, resourceType = "image") {
    try {
      const result = await cloudinary.uploader.destroy(publicId, {
        resource_type: resourceType,
      });

      if (result.result === "ok") {
        return { success: true, result };
      } else {
        throw new Error(`Delete failed: ${result.result}`);
      }
    } catch (error) {
      console.error("Cloudinary delete error:", error);
      throw new Error(
        `Failed to delete file from Cloudinary: ${error.message}`,
      );
    }
  }

  /**
   * Generate transformed image URL
   */
  generateTransformedUrl(publicId, transformations = {}) {
    try {
      return cloudinary.url(publicId, {
        resource_type: "image",
        secure: true,
        transformation: transformations,
      });
    } catch (error) {
      console.error("URL generation error:", error);
      throw new Error("Failed to generate transformed URL");
    }
  }

  /**
   * Create image thumbnail
   */
  createThumbnailUrl(publicId, options = {}) {
    const {
      width = 200,
      height = 200,
      crop = "fill",
      quality = "auto:good",
      format = "auto",
    } = options;

    return this.generateTransformedUrl(publicId, {
      width,
      height,
      crop,
      quality,
      fetch_format: format,
      gravity: "auto",
    });
  }

  /**
   * Generate image variants (thumbnail, medium, large)
   */
  async generateImageVariants(publicId) {
    try {
      const variants = {
        original: cloudinary.url(publicId, { secure: true }),
        large: this.generateTransformedUrl(publicId, {
          width: 1200,
          height: 800,
          crop: "limit",
          quality: "auto:good",
          fetch_format: "auto",
        }),
        medium: this.generateTransformedUrl(publicId, {
          width: 600,
          height: 400,
          crop: "limit",
          quality: "auto:good",
          fetch_format: "auto",
        }),
        small: this.generateTransformedUrl(publicId, {
          width: 300,
          height: 200,
          crop: "limit",
          quality: "auto:good",
          fetch_format: "auto",
        }),
        thumbnail: this.createThumbnailUrl(publicId, {
          width: 150,
          height: 150,
          crop: "fill",
        }),
      };

      return variants;
    } catch (error) {
      console.error("Generate variants error:", error);
      throw new Error("Failed to generate image variants");
    }
  }

  /**
   * Get file information from Cloudinary
   */
  async getFileInfo(publicId, resourceType = "image") {
    try {
      const result = await cloudinary.api.resource(publicId, {
        resource_type: resourceType,
      });

      return {
        public_id: result.public_id,
        format: result.format,
        width: result.width,
        height: result.height,
        bytes: result.bytes,
        url: result.secure_url,
        created_at: result.created_at,
        resource_type: result.resource_type,
        tags: result.tags || [],
        context: result.context || {},
      };
    } catch (error) {
      console.error("Get file info error:", error);
      throw new Error("Failed to retrieve file information from Cloudinary");
    }
  }

  /**
   * Search files in Cloudinary
   */
  async searchFiles(query, options = {}) {
    try {
      const searchOptions = {
        expression: query,
        max_results: options.limit || 50,
        next_cursor: options.cursor || undefined,
        sort_by: options.sort_by || [{ created_at: "desc" }],
        ...options,
      };

      const result = await cloudinary.search
        .expression(query)
        .execute(searchOptions);

      return {
        resources: result.resources,
        total_count: result.total_count,
        next_cursor: result.next_cursor,
        rate_limit_allowed: result.rate_limit_allowed,
        rate_limit_remaining: result.rate_limit_remaining,
      };
    } catch (error) {
      console.error("Search files error:", error);
      throw new Error("Failed to search files in Cloudinary");
    }
  }

  /**
   * Get folder contents
   */
  async getFolderContents(folder, options = {}) {
    try {
      const query = `folder:${folder}/*`;
      return await this.searchFiles(query, options);
    } catch (error) {
      console.error("Get folder contents error:", error);
      throw new Error("Failed to get folder contents");
    }
  }

  /**
   * Create video thumbnail
   */
  createVideoThumbnail(publicId, options = {}) {
    const {
      width = 300,
      height = 200,
      crop = "fill",
      quality = "auto:good",
      format = "jpg",
    } = options;

    return cloudinary.url(publicId, {
      resource_type: "video",
      secure: true,
      transformation: {
        width,
        height,
        crop,
        quality,
        format,
        flags: "attachment",
      },
    });
  }

  /**
   * Get optimized video URL
   */
  getOptimizedVideoUrl(publicId, options = {}) {
    const { quality = "auto:good", format = "auto", width, height } = options;

    const transformation = {
      quality,
      fetch_format: format,
    };

    if (width || height) {
      transformation.width = width;
      transformation.height = height;
      transformation.crop = "limit";
    }

    return cloudinary.url(publicId, {
      resource_type: "video",
      secure: true,
      transformation,
    });
  }

  /**
   * Get storage usage statistics
   */
  async getStorageStats() {
    try {
      const usage = await cloudinary.api.usage();

      return {
        type: "cloudinary",
        plan: usage.plan,
        credits: {
          used: usage.credits.used,
          limit: usage.credits.limit,
          remaining: usage.credits.limit - usage.credits.used,
        },
        bandwidth: {
          used: usage.bandwidth.used,
          limit: usage.bandwidth.limit,
          remaining: usage.bandwidth.limit - usage.bandwidth.used,
          used_mb:
            Math.round((usage.bandwidth.used / (1024 * 1024)) * 100) / 100,
        },
        storage: {
          used: usage.storage.used,
          limit: usage.storage.limit,
          remaining: usage.storage.limit - usage.storage.used,
          used_mb: Math.round((usage.storage.used / (1024 * 1024)) * 100) / 100,
        },
        requests: usage.requests || 0,
        resources: usage.resources || 0,
        derived_resources: usage.derived_resources || 0,
      };
    } catch (error) {
      console.error("Get storage stats error:", error);
      throw new Error("Failed to get Cloudinary usage statistics");
    }
  }

  /**
   * Add tags to file
   */
  async addTags(publicId, tags, resourceType = "image") {
    try {
      const result = await cloudinary.uploader.add_tag(
        Array.isArray(tags) ? tags.join(",") : tags,
        [publicId],
        { resource_type: resourceType },
      );

      return result;
    } catch (error) {
      console.error("Add tags error:", error);
      throw new Error("Failed to add tags to file");
    }
  }

  /**
   * Remove tags from file
   */
  async removeTags(publicId, tags, resourceType = "image") {
    try {
      const result = await cloudinary.uploader.remove_tag(
        Array.isArray(tags) ? tags.join(",") : tags,
        [publicId],
        { resource_type: resourceType },
      );

      return result;
    } catch (error) {
      console.error("Remove tags error:", error);
      throw new Error("Failed to remove tags from file");
    }
  }

  /**
   * Update file context/metadata
   */
  async updateContext(publicId, context, resourceType = "image") {
    try {
      const result = await cloudinary.uploader.update_metadata(
        context,
        [publicId],
        { resource_type: resourceType },
      );

      return result;
    } catch (error) {
      console.error("Update context error:", error);
      throw new Error("Failed to update file context");
    }
  }

  /**
   * Generate signed upload URL for direct uploads
   */
  generateSignedUploadUrl(options = {}) {
    try {
      const timestamp = Math.round(new Date().getTime() / 1000);

      const params = {
        timestamp,
        folder: options.folder || "direct_uploads",
        resource_type: options.resource_type || "auto",
        ...options.params,
      };

      const signature = cloudinary.utils.api_sign_request(
        params,
        process.env.CLOUDINARY_API_SECRET,
      );

      return {
        url: `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/${params.resource_type}/upload`,
        timestamp,
        signature,
        api_key: process.env.CLOUDINARY_API_KEY,
        params,
      };
    } catch (error) {
      console.error("Generate signed URL error:", error);
      throw new Error("Failed to generate signed upload URL");
    }
  }
}

module.exports = new UploadService();
