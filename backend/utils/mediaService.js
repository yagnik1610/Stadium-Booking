const stream = require('stream');
const path = require('path');
const { getCloudinaryClient, getCloudinaryFolder, isCloudinaryConfigured } = require('../config/cloudinary');
const { logAdminAction } = require('./auditLogger');
const UPLOAD_LIMITS = require('../config/uploadLimits');

/**
 * Pipes an in-memory Buffer to Cloudinary using an upload_stream.
 * @param {Buffer} buffer
 * @param {object} options
 * @returns {Promise<object>} Cloudinary upload response object
 */
const uploadBufferToCloudinary = (buffer, options = {}) => {
  const cloudinary = getCloudinaryClient();
  if (!cloudinary) {
    const err = new Error('Cloudinary media upload service is not configured on this server.');
    err.code = 'CLOUDINARY_UNCONFIGURED';
    err.statusCode = 503;
    return Promise.reject(err);
  }

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'image',
        ...options
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }
        resolve(result);
      }
    );

    const bufferStream = new stream.PassThrough();
    bufferStream.end(buffer);
    bufferStream.pipe(uploadStream);
  });
};

/**
 * Destroys an asset in Cloudinary by its publicId safely.
 * @param {string} publicId
 * @returns {Promise<object>}
 */
const deleteCloudinaryAsset = async (publicId) => {
  if (!publicId || typeof publicId !== 'string') {
    return { result: 'skipped' };
  }

  const cloudinary = getCloudinaryClient();
  if (!cloudinary) {
    console.warn(`[MEDIA_CLEANUP_SKIPPED] Cloudinary unconfigured. Skipping deletion of ${publicId}`);
    return { result: 'skipped' };
  }

  try {
    const result = await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
    return result;
  } catch (err) {
    console.error(`[MEDIA_CLEANUP_FAILED] Could not delete Cloudinary asset ${publicId}:`, err.message);
    return { result: 'error', error: err.message };
  }
};

/**
 * Uploads or replaces a stadium's cover image.
 */
const uploadStadiumCover = async (stadium, file, adminUser, req = null) => {
  const folder = `${getCloudinaryFolder()}/stadiums/${stadium._id}/cover`;
  const oldPublicId = stadium.media?.cover?.publicId || null;

  // 1. Upload new image buffer to Cloudinary
  const result = await uploadBufferToCloudinary(file.buffer, {
    folder,
    transformation: [
      { width: 1600, crop: 'limit', quality: 'auto', fetch_format: 'auto' }
    ]
  });

  const newMedia = {
    url: result.secure_url || result.url,
    secureUrl: result.secure_url,
    publicId: result.public_id,
    resourceType: 'image',
    format: result.format || 'jpg',
    width: result.width || 0,
    height: result.height || 0,
    bytes: result.bytes || file.size || 0,
    originalName: file.originalname ? path.basename(file.originalname) : 'cover'
  };

  // 2. Persist to MongoDB with atomic-like cleanup if DB fails
  try {
    stadium.image = newMedia.secureUrl;
    if (!stadium.media) {
      stadium.media = {};
    }
    stadium.media.cover = newMedia;
    await stadium.save();
  } catch (dbErr) {
    console.error('❌ MongoDB save failed after cover upload. Cleaning up orphan Cloudinary asset:', result.public_id);
    await deleteCloudinaryAsset(result.public_id);
    throw dbErr;
  }

  // 3. Clean up old Cloudinary asset only AFTER new record is securely saved in DB
  if (oldPublicId && oldPublicId !== newMedia.publicId) {
    deleteCloudinaryAsset(oldPublicId).catch((cleanupErr) => {
      console.warn('⚠️ Non-fatal: Old cover cleanup failed in Cloudinary:', cleanupErr.message);
    });
  }

  // 4. Audit Log
  const action = oldPublicId ? 'STADIUM_COVER_REPLACED' : 'STADIUM_COVER_UPLOADED';
  await logAdminAction(
    adminUser._id,
    action,
    'Stadium',
    stadium._id,
    {
      publicId: newMedia.publicId,
      url: newMedia.secureUrl,
      oldPublicId
    },
    req
  );

  return {
    success: true,
    message: oldPublicId ? 'Stadium cover replaced successfully' : 'Stadium cover uploaded successfully',
    media: newMedia,
    image: stadium.image
  };
};

/**
 * Removes a stadium's cover image.
 */
const deleteStadiumCover = async (stadium, adminUser, req = null) => {
  const oldPublicId = stadium.media?.cover?.publicId || null;

  // 1. Remove from database
  stadium.image = undefined;
  if (stadium.media) {
    stadium.media.cover = undefined;
  }
  await stadium.save();

  // 2. If it was a managed Cloudinary asset, delete from provider
  if (oldPublicId) {
    await deleteCloudinaryAsset(oldPublicId);
  }

  // 3. Audit Log
  await logAdminAction(
    adminUser._id,
    'STADIUM_COVER_DELETED',
    'Stadium',
    stadium._id,
    { oldPublicId },
    req
  );

  return {
    success: true,
    message: 'Stadium cover removed successfully'
  };
};

/**
 * Uploads multiple gallery images for a stadium with ceiling enforcement and all-or-cleanup handling.
 */
const uploadStadiumGallery = async (stadium, files, adminUser, req = null) => {
  const currentImages = Array.isArray(stadium.images) ? stadium.images : [];
  const currentCount = currentImages.length;

  if (currentCount + files.length > UPLOAD_LIMITS.MAX_GALLERY_IMAGES) {
    const err = new Error(
      `Gallery limit exceeded. Maximum ${UPLOAD_LIMITS.MAX_GALLERY_IMAGES} images allowed per stadium. Currently has ${currentCount} images, attempted to add ${files.length}.`
    );
    err.statusCode = 400;
    throw err;
  }

  const folder = `${getCloudinaryFolder()}/stadiums/${stadium._id}/gallery`;
  const newlyUploadedAssets = [];

  // 1. All-or-cleanup upload loop
  try {
    for (const file of files) {
      const result = await uploadBufferToCloudinary(file.buffer, {
        folder,
        transformation: [
          { width: 1400, crop: 'limit', quality: 'auto', fetch_format: 'auto' }
        ]
      });

      newlyUploadedAssets.push({
        url: result.secure_url || result.url,
        secureUrl: result.secure_url,
        publicId: result.public_id,
        resourceType: 'image',
        format: result.format || 'jpg',
        width: result.width || 0,
        height: result.height || 0,
        bytes: result.bytes || file.size || 0,
        originalName: file.originalname ? path.basename(file.originalname) : 'gallery'
      });
    }
  } catch (uploadErr) {
    console.error('❌ Batch gallery upload failed midway. Cleaning up previously uploaded assets in this batch:', uploadErr.message);
    for (const asset of newlyUploadedAssets) {
      await deleteCloudinaryAsset(asset.publicId);
    }
    throw uploadErr;
  }

  // 2. Persist to MongoDB
  try {
    if (!stadium.images) {
      stadium.images = [];
    }
    if (!stadium.media) {
      stadium.media = {};
    }
    if (!Array.isArray(stadium.media.gallery)) {
      stadium.media.gallery = [];
    }

    newlyUploadedAssets.forEach((asset) => {
      stadium.images.push(asset.secureUrl);
      stadium.media.gallery.push(asset);
    });

    await stadium.save();
  } catch (dbErr) {
    console.error('❌ MongoDB save failed after gallery upload. Cleaning up all newly uploaded assets:', dbErr.message);
    for (const asset of newlyUploadedAssets) {
      await deleteCloudinaryAsset(asset.publicId);
    }
    throw dbErr;
  }

  // 3. Audit Log
  await logAdminAction(
    adminUser._id,
    'STADIUM_GALLERY_UPLOADED',
    'Stadium',
    stadium._id,
    {
      count: newlyUploadedAssets.length,
      publicIds: newlyUploadedAssets.map((a) => a.publicId)
    },
    req
  );

  return {
    success: true,
    message: `Uploaded ${newlyUploadedAssets.length} gallery images successfully`,
    media: newlyUploadedAssets,
    images: stadium.images
  };
};

/**
 * Removes a specific gallery image by media ObjectId, publicId, or URL.
 */
const deleteStadiumGalleryImage = async (stadium, mediaIdentifier, adminUser, req = null) => {
  if (!mediaIdentifier) {
    const err = new Error('Media identifier is required to delete gallery image');
    err.statusCode = 400;
    throw err;
  }

  let targetPublicId = null;
  let targetUrl = null;
  let found = false;

  // 1. Check managed media.gallery
  if (stadium.media && Array.isArray(stadium.media.gallery)) {
    const galleryIndex = stadium.media.gallery.findIndex((item) => {
      const matchId = item._id && item._id.toString() === mediaIdentifier;
      const matchPub = item.publicId && item.publicId === mediaIdentifier;
      const matchUrl = item.secureUrl === mediaIdentifier || item.url === mediaIdentifier;
      return matchId || matchPub || matchUrl;
    });

    if (galleryIndex !== -1) {
      const removedItem = stadium.media.gallery[galleryIndex];
      targetPublicId = removedItem.publicId || null;
      targetUrl = removedItem.secureUrl || removedItem.url;
      stadium.media.gallery.splice(galleryIndex, 1);
      found = true;
    }
  }

  // 2. Remove matching URL from stadium.images
  if (Array.isArray(stadium.images)) {
    let urlIndex = -1;
    if (targetUrl) {
      urlIndex = stadium.images.indexOf(targetUrl);
    }
    if (urlIndex === -1) {
      urlIndex = stadium.images.indexOf(mediaIdentifier);
    }
    if (urlIndex === -1 && !isNaN(Number(mediaIdentifier))) {
      const idx = Number(mediaIdentifier);
      if (idx >= 0 && idx < stadium.images.length) {
        urlIndex = idx;
      }
    }

    if (urlIndex !== -1) {
      targetUrl = stadium.images[urlIndex];
      stadium.images.splice(urlIndex, 1);
      found = true;
    }
  }

  if (!found) {
    const err = new Error(`Gallery image "${mediaIdentifier}" not found for this stadium`);
    err.statusCode = 404;
    throw err;
  }

  // 3. Save MongoDB state
  await stadium.save();

  // 4. Destroy in Cloudinary ONLY if it was a managed Cloudinary asset with a trusted publicId
  if (targetPublicId) {
    await deleteCloudinaryAsset(targetPublicId);
  }

  // 5. Audit Log
  await logAdminAction(
    adminUser._id,
    'STADIUM_GALLERY_IMAGE_DELETED',
    'Stadium',
    stadium._id,
    {
      mediaIdentifier,
      targetPublicId,
      targetUrl
    },
    req
  );

  return {
    success: true,
    message: 'Gallery image deleted successfully',
    images: stadium.images
  };
};

module.exports = {
  uploadBufferToCloudinary,
  deleteCloudinaryAsset,
  uploadStadiumCover,
  deleteStadiumCover,
  uploadStadiumGallery,
  deleteStadiumGalleryImage
};
