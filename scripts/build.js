#!/usr/bin/env node

/**
 * Custom build script that handles Prisma generation
 * even when database is not accessible during build time
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔨 Starting build process...');

// Step 1: Generate Prisma Client (without database validation)
console.log('📦 Generating Prisma Client...');

// Helper function to check if Prisma client exists
function prismaClientExists() {
  const prismaClientPath = path.join(
    process.cwd(),
    'node_modules',
    '.prisma',
    'client',
    'index.js'
  );
  return fs.existsSync(prismaClientPath);
}

// Helper function to generate Prisma client with retry
function generatePrismaClient(maxRetries = 3) {
  // Set a dummy DATABASE_URL if not present, to avoid connection during generation
  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db';
  }

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 1) {
        console.log(`🔄 Retrying Prisma generation (attempt ${attempt}/${maxRetries})...`);
        // Wait a bit before retrying (especially on Windows)
        if (process.platform === 'win32') {
          const start = Date.now();
          while (Date.now() - start < 1000) {
            // Wait 1 second
          }
        }
      }
      
      execSync('npx prisma generate', { 
        stdio: 'inherit',
        env: { ...process.env }
      });
      console.log('✅ Prisma Client generated successfully');
      return true;
    } catch (error) {
      // Check for permission errors in various error properties
      const errorString = JSON.stringify(error) + (error.message || '') + (error.stderr?.toString() || '') + (error.stdout?.toString() || '');
      const isPermissionError = (
        errorString.includes('EPERM') ||
        errorString.includes('operation not permitted') ||
        errorString.includes('EACCES') ||
        errorString.includes('permission denied')
      );
      
      if (isPermissionError && attempt < maxRetries) {
        console.warn(`⚠️ Permission error during Prisma generation (attempt ${attempt}/${maxRetries})`);
        continue;
      }
      
      // If Prisma client already exists, this might be okay
      if (prismaClientExists()) {
        console.warn('⚠️ Prisma generation had issues, but client already exists. Continuing...');
        return true;
      }
      
      if (attempt === maxRetries) {
        console.warn('⚠️ Prisma generation failed after retries, but continuing build...');
        console.warn('   This might be okay if Prisma client was already generated.');
        return false;
      }
    }
  }
  return false;
}

// Try to generate Prisma client
const prismaGenerated = generatePrismaClient();

// Verify Prisma client exists before building
if (!prismaGenerated && !prismaClientExists()) {
  console.error('❌ Prisma Client is missing and generation failed. Build cannot continue.');
  console.error('   Please run "npx prisma generate" manually and try again.');
  process.exit(1);
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

