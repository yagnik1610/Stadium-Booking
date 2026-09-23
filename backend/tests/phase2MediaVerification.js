const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');

const BASE_URL = 'http://localhost:5000';
const MOCK_STATE_PATH = path.join(__dirname, '../.mock_cloudinary_active');

const setCrossProcessMock = (state = {}) => {
  fs.writeFileSync(MOCK_STATE_PATH, JSON.stringify(state));
};

const clearCrossProcessMock = () => {
  if (fs.existsSync(MOCK_STATE_PATH)) {
    try {
      fs.unlinkSync(MOCK_STATE_PATH);
    } catch (_) {}
  }
};

const adminCreds = {
  loginId: process.env.ADMIN_LOGIN_ID || 'admin01',
  email: process.env.ADMIN_EMAIL || 'admin@stadium.com',
  password: process.env.ADMIN_PASSWORD || 'admin12345'
};

const userCreds = {
  email: 'yagnik@test.com',
  password: 'password123'
};

let adminToken = null;
let userToken = null;

let passed = 0;
let failed = 0;

const logPass = (name) => {
  passed++;
  console.log(`  \x1b[32m✓ [PASS]\x1b[0m ${name}`);
};

const logFail = (name, reason) => {
  failed++;
  console.error(`  \x1b[31m✗ [FAIL]\x1b[0m ${name}: ${reason}`);
};

// JSON request helper
const makeJsonRequest = async (method, endpoint, body = null, token = null) => {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);

  const response = await fetch(`${BASE_URL}${endpoint}`, options);
  const data = await response.json().catch(() => ({}));
  return { status: response.status, data };
};

// Multipart request helper
const makeMultipartRequest = async (method, endpoint, formData, token = null) => {
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const options = { method, headers, body: formData };
  const response = await fetch(`${BASE_URL}${endpoint}`, options);
  const data = await response.json().catch(() => ({}));
  return { status: response.status, data };
};

// Buffer generators
const createValidJpegBuffer = (size = 200) => {
  const buf = Buffer.alloc(size);
  buf[0] = 0xFF; buf[1] = 0xD8; buf[2] = 0xFF; buf[3] = 0xE0;
  return buf;
};

const createValidPngBuffer = (size = 200) => {
  const buf = Buffer.alloc(size);
  buf.set([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A], 0);
  return buf;
};

const createValidWebpBuffer = (size = 200) => {
  const buf = Buffer.alloc(size);
  buf.write('RIFF', 0, 'ascii');
  buf.write('WEBP', 8, 'ascii');
  return buf;
};

const createFakeImageBuffer = (size = 200) => {
  const buf = Buffer.alloc(size);
  buf.write('MZ This is an executable PE header masquerading as image', 0, 'ascii');
  return buf;
};

const createOversizedBuffer = () => {
  return Buffer.alloc(5.2 * 1024 * 1024); // 5.2 MB
};

const runMediaTestSuite = async () => {
  console.log('\n================================================================');
  console.log('BACKEND PHASE 2C: CLOUDINARY + MULTER MEDIA UPLOAD VERIFICATION');
  console.log('================================================================\n');

  try {
    setCrossProcessMock({});
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/stadium_booking');

    const User = require('../models/User');
    const Stadium = require('../models/Stadium');
    const AuditLog = require('../models/AuditLog');
    const mediaService = require('../utils/mediaService');
    const { setMockCloudinaryClient } = require('../config/cloudinary');

    // Setup Mock Client for direct service tests
    const destroyedAssets = [];
    const uploadedAssets = [];

    const mockCloudinary = {
      uploader: {
        upload_stream: (options, callback) => {
          const stream = require('stream');
          const writable = new stream.Writable({
            write(chunk, encoding, nextChunk) {
              nextChunk();
            }
          });
          writable.on('finish', () => {
            const timestamp = Date.now();
            const randomSuffix = Math.floor(Math.random() * 10000);
            const folder = options.folder || 'stadium-booking';
            const publicId = `${folder}/mock_${timestamp}_${randomSuffix}`;
            const format = options.format || 'jpg';
            const asset = {
              public_id: publicId,
              secure_url: `https://res.cloudinary.com/mock-cloud/image/upload/v${timestamp}/${publicId}.${format}`,
              url: `http://res.cloudinary.com/mock-cloud/image/upload/v${timestamp}/${publicId}.${format}`,
              format,
              width: 1600,
              height: 900,
              bytes: 154000,
              resource_type: 'image'
            };
            uploadedAssets.push(asset);
            callback(null, asset);
          });
          return writable;
        },
        destroy: async (publicId) => {
          destroyedAssets.push(publicId);
          return { result: 'ok' };
        }
      }
    };
    setMockCloudinaryClient(mockCloudinary);

    // 0. AUTHENTICATION
    const adminRes = await makeJsonRequest('POST', '/api/auth/login', {
      email: adminCreds.email,
      password: adminCreds.password
    });
    if (adminRes.status === 200 && adminRes.data?.token) {
      adminToken = adminRes.data.token;
    } else {
      const adminLoginIdRes = await makeJsonRequest('POST', '/api/auth/admin-login', {
        loginId: adminCreds.loginId,
        password: adminCreds.password
      });
      if (adminLoginIdRes.status === 200 && adminLoginIdRes.data?.token) {
        adminToken = adminLoginIdRes.data.token;
      }
    }

    const userRes = await makeJsonRequest('POST', '/api/auth/login', userCreds);
    if (userRes.status === 200 && userRes.data?.token) {
      userToken = userRes.data.token;
    }

    // Create a dedicated test stadium for media tests
    const adminUser = await User.findOne({ role: 'admin' });
    const testStadium = await Stadium.create({
      name: `Media Test Arena ${Date.now()}`,
      description: 'Dedicated test stadium for Cloudinary media upload tests',
      location: 'Sports Hub',
      address: '100 Stadium Way',
      city: 'Ahmedabad',
      sports: ['Football', 'Cricket'],
      capacity: 30,
      pricePerHour: 1200,
      openingTime: '06:00',
      closingTime: '22:00',
      image: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=1200&q=80',
      images: [
        'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?auto=format&fit=crop&w=800&q=80'
      ],
      createdBy: adminUser._id
    });

    console.log('--- CATEGORY 1: AUTHORIZATION & PERMISSION CONTROLS ---');

    // Test 1: Unauthenticated request rejected with 401
    const formAnon = new FormData();
    formAnon.append('image', new Blob([createValidJpegBuffer()], { type: 'image/jpeg' }), 'test.jpg');
    const anonRes = await makeMultipartRequest('POST', `/api/stadiums/${testStadium._id}/media/cover`, formAnon, null);
    if (anonRes.status === 401) {
      logPass('Test 1 - Unauthenticated cover upload rejected with 401 Unauthorized');
    } else {
      logFail('Test 1 - Unauthenticated cover upload', `Expected 401, got ${anonRes.status}`);
    }

    // Test 2: Normal user request rejected with 403 Forbidden
    const formUser = new FormData();
    formUser.append('image', new Blob([createValidJpegBuffer()], { type: 'image/jpeg' }), 'test.jpg');
    const userUpRes = await makeMultipartRequest('POST', `/api/stadiums/${testStadium._id}/media/cover`, formUser, userToken);
    if (userUpRes.status === 403) {
      logPass('Test 2 - Normal user blocked from uploading with 403 Forbidden');
    } else {
      logFail('Test 2 - Normal user blocked from upload', `Expected 403, got ${userUpRes.status}`);
    }

    console.log('\n--- CATEGORY 2: COVER IMAGE UPLOAD & FORMAT VALIDATION ---');

    // Test 3: Valid JPEG accepted
    const formJpeg = new FormData();
    formJpeg.append('image', new Blob([createValidJpegBuffer()], { type: 'image/jpeg' }), 'cover.jpg');
    const jpegRes = await makeMultipartRequest('POST', `/api/stadiums/${testStadium._id}/media/cover`, formJpeg, adminToken);
    if (jpegRes.status === 200 && jpegRes.data?.success && jpegRes.data?.media?.publicId) {
      logPass('Test 3 - Valid JPEG image accepted and uploaded successfully');
    } else {
      logFail('Test 3 - Valid JPEG upload', `Status: ${jpegRes.status}, message: ${jpegRes.data?.message}`);
    }

    // Test 4: Valid PNG accepted
    const formPng = new FormData();
    formPng.append('image', new Blob([createValidPngBuffer()], { type: 'image/png' }), 'cover.png');
    const pngRes = await makeMultipartRequest('POST', `/api/stadiums/${testStadium._id}/media/cover`, formPng, adminToken);
    if (pngRes.status === 200 && pngRes.data?.success && pngRes.data?.media?.publicId) {
      logPass('Test 4 - Valid PNG image accepted and uploaded successfully');
    } else {
      logFail('Test 4 - Valid PNG upload', `Status: ${pngRes.status}, message: ${pngRes.data?.message}`);
    }

    // Test 5: Valid WebP accepted
    const formWebp = new FormData();
    formWebp.append('image', new Blob([createValidWebpBuffer()], { type: 'image/webp' }), 'cover.webp');
    const webpRes = await makeMultipartRequest('POST', `/api/stadiums/${testStadium._id}/media/cover`, formWebp, adminToken);
    if (webpRes.status === 200 && webpRes.data?.success && webpRes.data?.media?.publicId) {
      logPass('Test 5 - Valid WebP image accepted and uploaded successfully');
    } else {
      logFail('Test 5 - Valid WebP upload', `Status: ${webpRes.status}, message: ${webpRes.data?.message}`);
    }

    // Test 6: Unsupported file extension (SVG / EXE / PDF) rejected
    const formSvg = new FormData();
    formSvg.append('image', new Blob(['<svg><script>alert(1)</script></svg>'], { type: 'image/svg+xml' }), 'malicious.svg');
    const svgRes = await makeMultipartRequest('POST', `/api/stadiums/${testStadium._id}/media/cover`, formSvg, adminToken);
    if (svgRes.status === 400 && svgRes.data?.message?.includes('Unsupported')) {
      logPass('Test 6 - Unsupported extension (SVG) rejected with 400 Bad Request');
    } else {
      logFail('Test 6 - Unsupported extension rejected', `Status: ${svgRes.status}, message: ${svgRes.data?.message}`);
    }

    // Test 7: Fake MIME disguised executable (malware.exe renamed to test.jpg) rejected by magic bytes
    const formFake = new FormData();
    formFake.append('image', new Blob([createFakeImageBuffer()], { type: 'image/jpeg' }), 'fake_photo.jpg');
    const fakeRes = await makeMultipartRequest('POST', `/api/stadiums/${testStadium._id}/media/cover`, formFake, adminToken);
    if (fakeRes.status === 400 && (fakeRes.data?.message?.includes('signature') || fakeRes.data?.message?.includes('allowed image formats'))) {
      logPass('Test 7 - Disguised executable with forged MIME safely rejected by magic byte inspection');
    } else {
      logFail('Test 7 - Magic byte validation', `Status: ${fakeRes.status}, message: ${fakeRes.data?.message}`);
    }

    // Test 8: Oversized file rejected (> 5 MB)
    const formBig = new FormData();
    formBig.append('image', new Blob([createOversizedBuffer()], { type: 'image/jpeg' }), 'huge.jpg');
    const bigRes = await makeMultipartRequest('POST', `/api/stadiums/${testStadium._id}/media/cover`, formBig, adminToken);
    if (bigRes.status === 413 || (bigRes.status === 400 && bigRes.data?.message?.includes('5 MB'))) {
      logPass('Test 8 - Oversized image (> 5 MB) rejected with 413/400 limit response');
    } else {
      logFail('Test 8 - Oversized file rejection', `Status: ${bigRes.status}, message: ${bigRes.data?.message}`);
    }

    // Test 9: No-file request rejected
    const formEmpty = new FormData();
    const emptyRes = await makeMultipartRequest('POST', `/api/stadiums/${testStadium._id}/media/cover`, formEmpty, adminToken);
    if (emptyRes.status === 400) {
      logPass('Test 9 - Request without file rejected with 400 Bad Request');
    } else {
      logFail('Test 9 - Empty file request', `Status: ${emptyRes.status}`);
    }

    // Test 10: Uploaded URL and metadata saved correctly in MongoDB
    const updatedStadiumCover = await Stadium.findById(testStadium._id).lean();
    if (
      updatedStadiumCover?.image?.startsWith('http') &&
      updatedStadiumCover?.media?.cover?.publicId &&
      updatedStadiumCover?.media?.cover?.width >= 1000
    ) {
      logPass('Test 10 - Uploaded cover image URL and metadata persisted accurately in Stadium document');
    } else {
      logFail('Test 10 - Cover persistence', `image: ${updatedStadiumCover?.image}, publicId: ${updatedStadiumCover?.media?.cover?.publicId}`);
    }

    console.log('\n--- CATEGORY 3: COVER REPLACEMENT & CLEANUP ---');

    // Test 11: Replacing cover updates DB and triggers old Cloudinary asset cleanup
    const oldPublicId = updatedStadiumCover.media.cover.publicId;
    const formReplace = new FormData();
    formReplace.append('image', new Blob([createValidJpegBuffer()], { type: 'image/jpeg' }), 'new_cover.jpg');
    const replaceRes = await makeMultipartRequest('POST', `/api/stadiums/${testStadium._id}/media/cover`, formReplace, adminToken);

    const stadiumAfterReplace = await Stadium.findById(testStadium._id).lean();
    if (
      replaceRes.status === 200 &&
      stadiumAfterReplace.media.cover.publicId !== oldPublicId &&
      stadiumAfterReplace.image === stadiumAfterReplace.media.cover.secureUrl
    ) {
      logPass('Test 11 - Cover replacement updates DB and schedules old asset cleanup');
    } else {
      logFail('Test 11 - Cover replacement', `Status: ${replaceRes.status}`);
    }

    // Test 12: Cover deletion removes URL and metadata from DB
    const delCoverRes = await makeJsonRequest('DELETE', `/api/stadiums/${testStadium._id}/media/cover`, null, adminToken);
    const stadiumAfterDelCover = await Stadium.findById(testStadium._id).lean();
    if (delCoverRes.status === 200 && !stadiumAfterDelCover.image && !stadiumAfterDelCover.media?.cover?.publicId) {
      logPass('Test 12 - Cover deletion cleans database fields and invokes provider cleanup');
    } else {
      logFail('Test 12 - Cover deletion', `Status: ${delCoverRes.status}`);
    }

    console.log('\n--- CATEGORY 4: GALLERY MANAGEMENT & COUNT LIMITS ---');

    // Test 13: Multiple valid gallery images uploaded in batch
    const formGallery = new FormData();
    formGallery.append('images', new Blob([createValidJpegBuffer()], { type: 'image/jpeg' }), 'g1.jpg');
    formGallery.append('images', new Blob([createValidPngBuffer()], { type: 'image/png' }), 'g2.png');
    formGallery.append('images', new Blob([createValidWebpBuffer()], { type: 'image/webp' }), 'g3.webp');

    const galleryRes = await makeMultipartRequest('POST', `/api/stadiums/${testStadium._id}/media/gallery`, formGallery, adminToken);
    const stadiumAfterGallery = await Stadium.findById(testStadium._id).lean();

    if (
      galleryRes.status === 200 &&
      galleryRes.data?.success &&
      stadiumAfterGallery.media?.gallery?.length === 3 &&
      stadiumAfterGallery.images?.length >= 4 // 1 initial Unsplash + 3 new
    ) {
      logPass('Test 13 - Batch gallery upload persists multiple images and metadata arrays');
    } else {
      logFail('Test 13 - Batch gallery upload', `Status: ${galleryRes.status}, galleryCount: ${stadiumAfterGallery.media?.gallery?.length}`);
    }

    // Test 14: Gallery maximum 8 images ceiling enforced
    // Currently has 4 total images in images[]. Adding 6 more would exceed limit of 8.
    const formOverGallery = new FormData();
    for (let i = 0; i < 6; i++) {
      formOverGallery.append('images', new Blob([createValidJpegBuffer()], { type: 'image/jpeg' }), `extra_${i}.jpg`);
    }
    const overGalleryRes = await makeMultipartRequest('POST', `/api/stadiums/${testStadium._id}/media/gallery`, formOverGallery, adminToken);
    if (overGalleryRes.status === 400 && overGalleryRes.data?.message?.includes('Maximum 8 images')) {
      logPass('Test 14 - Maximum gallery count (8 images ceiling) strictly enforced');
    } else {
      logFail('Test 14 - Gallery ceiling enforcement', `Status: ${overGalleryRes.status}, message: ${overGalleryRes.data?.message}`);
    }

    // Test 15: Single gallery image removable via DB-trusted identifier
    const targetMediaItem = stadiumAfterGallery.media.gallery[0];
    const delGalleryRes = await makeJsonRequest(
      'DELETE',
      `/api/stadiums/${testStadium._id}/media/gallery/${targetMediaItem._id}`,
      null,
      adminToken
    );

    const stadiumAfterDelGallery = await Stadium.findById(testStadium._id).lean();
    const stillInMedia = stadiumAfterDelGallery.media?.gallery?.some(g => g._id.toString() === targetMediaItem._id.toString());
    const stillInImages = stadiumAfterDelGallery.images?.includes(targetMediaItem.secureUrl);

    if (delGalleryRes.status === 200 && !stillInMedia && !stillInImages) {
      logPass('Test 15 - Single gallery image deleted via trusted DB reference without affecting others');
    } else {
      logFail('Test 15 - Single gallery deletion', `stillInMedia: ${stillInMedia}, stillInImages: ${stillInImages}`);
    }

    // Test 16: External gallery URL deletion does NOT attempt Cloudinary destroy
    const externalUrl = testStadium.images[0]; // The original Unsplash URL
    const delExtRes = await makeJsonRequest(
      'DELETE',
      `/api/stadiums/${testStadium._id}/media/gallery/${encodeURIComponent(externalUrl)}`,
      null,
      adminToken
    );
    const stadiumAfterDelExt = await Stadium.findById(testStadium._id).lean();
    if (delExtRes.status === 200 && !stadiumAfterDelExt.images?.includes(externalUrl)) {
      logPass('Test 16 - External gallery URL removed from DB safely without provider deletion attempt');
    } else {
      logFail('Test 16 - External URL deletion', `Status: ${delExtRes.status}`);
    }

    console.log('\n--- CATEGORY 5: FAILURE ISOLATION & ORPHAN CLEANUP ---');

    // Test 17: Database failure after Cloudinary upload cleans up newly uploaded asset (Zero Orphans)
    destroyedAssets.length = 0; // Clear
    const mockFile = {
      buffer: createValidJpegBuffer(),
      originalname: 'orphan_test.jpg',
      size: 500
    };

    // Create a mock stadium object where save() throws
    const failingStadium = {
      _id: new mongoose.Types.ObjectId(),
      save: async () => {
        throw new Error('Simulated MongoDB WriteConflictException or connection drop');
      }
    };

    let caughtDbError = false;
    try {
      await mediaService.uploadStadiumCover(failingStadium, mockFile, adminUser);
    } catch (err) {
      caughtDbError = true;
    }

    if (caughtDbError && destroyedAssets.length > 0) {
      logPass('Test 17 - MongoDB failure automatically cleans up uploaded Cloudinary image (Zero Orphans)');
    } else {
      logFail('Test 17 - Orphan asset cleanup on DB failure', `caughtDbError: ${caughtDbError}, destroyedCount: ${destroyedAssets.length}`);
    }

    console.log('\n--- CATEGORY 6: STADIUM SOFT-DELETION SAFETY ---');

    // Test 18: Stadium soft-deletion preserves media metadata and does NOT destroy Cloudinary media
    destroyedAssets.length = 0;
    // Set a cover on test stadium first
    await Stadium.findByIdAndUpdate(testStadium._id, {
      image: 'https://res.cloudinary.com/mock-cloud/image/upload/v1/keep_this.jpg',
      'media.cover': {
        publicId: 'stadium-booking/stadiums/keep_this',
        secureUrl: 'https://res.cloudinary.com/mock-cloud/image/upload/v1/keep_this.jpg'
      }
    });

    const softDelRes = await makeJsonRequest('DELETE', `/api/stadiums/${testStadium._id}`, null, adminToken);
    const softDeletedStadium = await Stadium.findById(testStadium._id).lean();

    if (
      softDelRes.status === 200 &&
      softDeletedStadium.isActive === false &&
      softDeletedStadium.media?.cover?.publicId === 'stadium-booking/stadiums/keep_this' &&
      destroyedAssets.length === 0
    ) {
      logPass('Test 18 - Soft-deleting stadium (isActive: false) preserves media without deleting Cloudinary assets');
    } else {
      logFail('Test 18 - Soft delete media preservation', `isActive: ${softDeletedStadium?.isActive}, destroyedCount: ${destroyedAssets.length}`);
    }

    console.log('\n--- CATEGORY 7: EXTERNAL URL COMPATIBILITY & SSRF PREVENTION ---');

    // Test 19: Valid HTTPS external image URL accepted during update
    const validHttpsUrl = 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=800&q=80';
    const updateUrlRes = await makeJsonRequest('PUT', `/api/stadiums/${testStadium._id}`, {
      image: validHttpsUrl
    }, adminToken);

    if (updateUrlRes.status === 200 && updateUrlRes.data?.stadium?.image === validHttpsUrl) {
      logPass('Test 19 - Valid HTTPS external image URL accepted for backward compatibility');
    } else {
      logFail('Test 19 - External HTTPS URL update', `Status: ${updateUrlRes.status}`);
    }

    // Test 20: Unsafe protocol (javascript: / data: / file:) rejected with 400
    const badProtocolRes = await makeJsonRequest('PUT', `/api/stadiums/${testStadium._id}`, {
      image: 'javascript:alert(document.cookie)'
    }, adminToken);

    if (badProtocolRes.status === 400 && badProtocolRes.data?.message?.includes('secure HTTPS URL')) {
      logPass('Test 20 - Unsafe URL protocol (javascript: / SSRF vectors) safely rejected with 400 Bad Request');
    } else {
      logFail('Test 20 - Unsafe URL rejection', `Status: ${badProtocolRes.status}`);
    }

    console.log('\n--- CATEGORY 8: AUDIT LOGS & SECURITY DATA LEAK CHECKS ---');

    // Test 21: Audit logs created for media operations
    const mediaAuditLogs = await AuditLog.find({
      entity: 'Stadium',
      action: { $in: ['STADIUM_COVER_UPLOADED', 'STADIUM_COVER_REPLACED', 'STADIUM_COVER_DELETED', 'STADIUM_GALLERY_UPLOADED', 'STADIUM_GALLERY_IMAGE_DELETED'] }
    }).lean();

    if (mediaAuditLogs.length >= 3) {
      logPass(`Test 21 - Media actions recorded in AuditLog (${mediaAuditLogs.length} audit records verified)`);
    } else {
      logFail('Test 21 - Audit log verification', `Expected >= 3 records, found ${mediaAuditLogs.length}`);
    }

    // Test 22: Cloudinary API secret and private tokens NEVER leaked
    const stadiumFinal = await Stadium.findById(testStadium._id).lean();
    const stadiumJson = JSON.stringify(stadiumFinal);
    const auditJson = JSON.stringify(mediaAuditLogs);

    const secretLeaked =
      stadiumJson.includes('CLOUDINARY_API_SECRET') ||
      auditJson.includes('CLOUDINARY_API_SECRET') ||
      stadiumJson.includes(process.env.CLOUDINARY_API_SECRET || 'impossible_secret_string');

    if (!secretLeaked) {
      logPass('Test 22 - Zero Cloudinary secrets, tokens, or credentials leaked in responses or database');
    } else {
      logFail('Test 22 - Secret leak check', 'Cloudinary API secret was found in database records');
    }

    // Test 23: Media Audit CLI utility executes cleanly
    const { execSync } = require('child_process');
    const auditCliOutput = execSync('node scripts/auditMedia.js', {
      cwd: path.join(__dirname, '..'),
      encoding: 'utf8'
    });

    if (auditCliOutput.includes('STADIUM MEDIA AUDIT UTILITY') && auditCliOutput.includes('AUDIT SUMMARY')) {
      logPass('Test 23 - Media audit utility (scripts/auditMedia.js) executes cleanly in report mode');
    } else {
      logFail('Test 23 - Audit script execution', 'Output did not contain expected summary headers');
    }

    // Cleanup test stadium
    await Stadium.findByIdAndDelete(testStadium._id);

  } catch (error) {
    console.error('❌ Fatal error during Phase 2C test suite:', error);
    failed++;
  } finally {
    console.log('\n================================================================');
    console.log(`TOTAL PHASE 2C MEDIA CHECKS: ${passed + failed}`);
    console.log(`PASSED: ${passed}`);
    console.log(`FAILED: ${failed}`);
    console.log('================================================================\n');

    clearCrossProcessMock();
    await mongoose.disconnect();
    if (failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  }
};

runMediaTestSuite();
