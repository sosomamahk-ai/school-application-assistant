#!/usr/bin/env node

/**
 * Custom build script that handles Prisma generation
 * even when database is not accessible during build time
 */

const { execSync } = require('child_process');

console.log('🔨 Starting build process...');

// Step 1: Generate Prisma Client (without database validation)
console.log('📦 Generating Prisma Client...');
try {
  // Set a dummy DATABASE_URL if not present, to avoid connection during generation
  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db';
  }
  execSync('npx prisma generate', { stdio: 'inherit' });
  console.log('✅ Prisma Client generated successfully');
} catch (error) {
  console.warn('⚠️ Prisma generation had issues, but continuing...');
  // Continue anyway - the client might already exist
}

// Step 2: Build Next.js app
console.log('🏗️ Building Next.js application...');
try {
  execSync('next build', { stdio: 'inherit' });
  console.log('✅ Next.js build completed successfully');
} catch (error) {
  console.error('❌ Next.js build failed');
  process.exit(1);
}

console.log('🎉 Build completed!');

