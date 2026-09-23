/**
 * Media Audit Script — Report-only utility
 * Inspects Stadium media in MongoDB for integrity, managed Cloudinary assets, and external URLs.
 * 
 * Usage:
 *   node scripts/auditMedia.js
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');

const auditMedia = async () => {
  console.log('\n======================================================');
  console.log('STADIUM MEDIA AUDIT UTILITY (REPORT-ONLY)');
  console.log('======================================================\n');

  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/stadium_booking');

    const Stadium = require('../models/Stadium');
    const stadiums = await Stadium.find().lean();

    console.log(`Inspecting ${stadiums.length} total stadiums...\n`);

    let totalCoverManaged = 0;
    let totalCoverExternal = 0;
    let totalCoverMissing = 0;
    let totalGalleryManaged = 0;
    let totalGalleryExternal = 0;
    let integrityIssues = 0;

    const publicIdMap = new Map();

    stadiums.forEach((s) => {
      // 1. Cover image analysis
      if (s.media?.cover?.publicId) {
        totalCoverManaged++;
        const pid = s.media.cover.publicId;
        if (publicIdMap.has(pid)) {
          console.warn(`⚠️ DUPLICATE PUBLIC_ID DETECTED: "${pid}" used in Stadium "${s.name}" (${s._id}) and Stadium "${publicIdMap.get(pid)}"`);
          integrityIssues++;
        } else {
          publicIdMap.set(pid, s.name);
        }

        // Verify URL consistency
        if (s.image && !s.image.includes('cloudinary') && !s.image.includes('mock')) {
          console.warn(`⚠️ Cover URL mismatch in Stadium "${s.name}": has managed publicId "${pid}" but image URL is "${s.image}"`);
          integrityIssues++;
        }
      } else if (s.image) {
        totalCoverExternal++;
      } else {
        totalCoverMissing++;
      }

      // 2. Gallery analysis
      if (Array.isArray(s.images) && s.images.length > 0) {
        const managedCount = (s.media?.gallery || []).filter((g) => g.publicId).length;
        totalGalleryManaged += managedCount;
        totalGalleryExternal += (s.images.length - managedCount);

        (s.media?.gallery || []).forEach((g) => {
          if (g.publicId) {
            if (publicIdMap.has(g.publicId)) {
              console.warn(`⚠️ DUPLICATE GALLERY PUBLIC_ID: "${g.publicId}" in Stadium "${s.name}"`);
              integrityIssues++;
            } else {
              publicIdMap.set(g.publicId, s.name);
            }
          }
        });
      }
    });

    console.log('--- AUDIT SUMMARY ---');
    console.log(`Total Stadiums:              ${stadiums.length}`);
    console.log(`Managed Cloudinary Covers:   ${totalCoverManaged}`);
    console.log(`External Image Covers:       ${totalCoverExternal}`);
    console.log(`Stadiums Without Cover:      ${totalCoverMissing}`);
    console.log(`Managed Gallery Assets:      ${totalGalleryManaged}`);
    console.log(`External Gallery URLs:       ${totalGalleryExternal}`);
    console.log(`Total Tracked Public IDs:    ${publicIdMap.size}`);
    console.log(`Integrity Discrepancies:     ${integrityIssues}`);
    console.log('---------------------\n');

    if (integrityIssues === 0) {
      console.log('✅ All stadium media records are clean and consistent.\n');
    } else {
      console.log(`⚠️ ${integrityIssues} potential issues detected above for review.\n`);
    }

  } catch (err) {
    console.error('Audit execution error:', err.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

auditMedia();
