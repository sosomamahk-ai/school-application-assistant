-- Add School table
CREATE TABLE "School" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shortName" TEXT,
    "templateId" TEXT NOT NULL,
    "campusLocation" TEXT,
    "gradeRange" TEXT,
    "applicationStart" TIMESTAMP(3),
    "applicationEnd" TIMESTAMP(3),
    "interviewTime" TIMESTAMP(3),
    "examTime" TIMESTAMP(3),
    "resultTime" TIMESTAMP(3),
    "requiredDocuments" JSONB,
    "requirements" JSONB,
    "officialLink" TEXT,
    "notes" TEXT,
    "metadataSource" TEXT,
    "metadataLastFetchedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "School_pkey" PRIMARY KEY ("id")
);

-- Add UserApplication table
CREATE TABLE "UserApplication" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "applicationId" TEXT,
    "fillingProgress" INTEGER NOT NULL DEFAULT 0,
    "interviewTime" TIMESTAMP(3),
    "examTime" TIMESTAMP(3),
    "result" TEXT NOT NULL DEFAULT 'pending',
    "resultTime" TIMESTAMP(3),
    "reminderSettings" JSONB,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "UserApplication_pkey" PRIMARY KEY ("id")
);

-- Add FieldMapping table
CREATE TABLE "FieldMapping" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "selector" TEXT NOT NULL,
    "domId" TEXT,
    "domName" TEXT,
    "profileField" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FieldMapping_pkey" PRIMARY KEY ("id")
);

-- Extend Application
ALTER TABLE "Application"
    ADD COLUMN "targetSubmissionDate" TIMESTAMP(3),
    ADD COLUMN "interviewDate" TIMESTAMP(3),
    ADD COLUMN "writtenTestDate" TIMESTAMP(3),
    ADD COLUMN "resultDate" TIMESTAMP(3),
    ADD COLUMN "progressNotes" TEXT,
    ADD COLUMN "timelineOverrides" JSONB,
    ADD COLUMN "reminderSettings" JSONB;

-- Indexes for School
CREATE UNIQUE INDEX "School_templateId_key" ON "School"("templateId");
CREATE INDEX "School_applicationEnd_idx" ON "School"("applicationEnd");
CREATE INDEX "School_applicationStart_idx" ON "School"("applicationStart");

-- Indexes and constraints for UserApplication
CREATE UNIQUE INDEX "UserApplication_userId_schoolId_key" ON "UserApplication"("userId", "schoolId");
CREATE UNIQUE INDEX "UserApplication_applicationId_key" ON "UserApplication"("applicationId");
CREATE INDEX "UserApplication_schoolId_idx" ON "UserApplication"("schoolId");
CREATE INDEX "UserApplication_userId_idx" ON "UserApplication"("userId");

-- Constraints
ALTER TABLE "School"
    ADD CONSTRAINT "School_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "SchoolFormTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "UserApplication"
    ADD CONSTRAINT "UserApplication_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT "UserApplication_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT "UserApplication_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "FieldMapping"
    ADD CONSTRAINT "FieldMapping_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE UNIQUE INDEX "FieldMapping_userId_domain_selector_key" ON "FieldMapping"("userId", "domain", "selector");
