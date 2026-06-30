-- CreateEnum
CREATE TYPE "WeightUnit" AS ENUM ('KG', 'LB');

-- CreateEnum
CREATE TYPE "WorkoutType" AS ENUM ('A', 'B');

-- CreateEnum
CREATE TYPE "AlternateExercise" AS ENUM ('POWER_CLEAN', 'BARBELL_ROW', 'CHINUPS');

-- CreateEnum
CREATE TYPE "WorkoutDayPattern" AS ENUM ('MWF', 'TThSa', 'CUSTOM');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSettings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "units" "WeightUnit" NOT NULL DEFAULT 'KG',
    "workoutDayPattern" "WorkoutDayPattern" NOT NULL DEFAULT 'MWF',
    "customWorkoutDays" INTEGER[],
    "darkMode" BOOLEAN NOT NULL DEFAULT false,
    "alternateExercise" "AlternateExercise" NOT NULL DEFAULT 'POWER_CLEAN',
    "autoReduceDeadliftIncrement" BOOLEAN NOT NULL DEFAULT false,
    "restTimerSeconds" INTEGER NOT NULL DEFAULT 180,
    "squatIncrement" DOUBLE PRECISION NOT NULL DEFAULT 2.5,
    "benchIncrement" DOUBLE PRECISION NOT NULL DEFAULT 2.5,
    "ohpIncrement" DOUBLE PRECISION NOT NULL DEFAULT 2.5,
    "deadliftIncrement" DOUBLE PRECISION NOT NULL DEFAULT 5.0,
    "powerCleanIncrement" DOUBLE PRECISION NOT NULL DEFAULT 2.5,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Exercise" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "defaultSets" INTEGER NOT NULL,
    "defaultReps" INTEGER NOT NULL,
    "defaultIncrement" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,

    CONSTRAINT "Exercise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkoutSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "workoutType" "WorkoutType" NOT NULL,
    "scheduledDate" DATE NOT NULL,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "notes" TEXT,
    "bodyweight" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkoutSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkoutExercise" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "targetSets" INTEGER NOT NULL,
    "targetReps" INTEGER NOT NULL,
    "targetWeight" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "WorkoutExercise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkoutSet" (
    "id" TEXT NOT NULL,
    "workoutExerciseId" TEXT NOT NULL,
    "setNumber" INTEGER NOT NULL,
    "reps" INTEGER,
    "weight" DOUBLE PRECISION NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "rpe" DOUBLE PRECISION,
    "durationSeconds" INTEGER,
    "recordedAt" TIMESTAMP(3),

    CONSTRAINT "WorkoutSet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProgressionState" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "currentWeight" DOUBLE PRECISION NOT NULL,
    "consecutiveFailures" INTEGER NOT NULL DEFAULT 0,
    "lastWorkoutDate" TIMESTAMP(3),
    "totalWorkouts" INTEGER NOT NULL DEFAULT 0,
    "lastResetDate" TIMESTAMP(3),
    "lastResetFromWeight" DOUBLE PRECISION,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProgressionState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BodyWeight" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BodyWeight_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PersonalRecord" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "reps" INTEGER NOT NULL,
    "date" DATE NOT NULL,
    "estimatedOneRepMax" DOUBLE PRECISION NOT NULL,
    "sessionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PersonalRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "UserSettings_userId_key" ON "UserSettings"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Exercise_name_key" ON "Exercise"("name");

-- CreateIndex
CREATE INDEX "WorkoutSession_userId_scheduledDate_idx" ON "WorkoutSession"("userId", "scheduledDate");

-- CreateIndex
CREATE INDEX "WorkoutExercise_sessionId_idx" ON "WorkoutExercise"("sessionId");

-- CreateIndex
CREATE INDEX "WorkoutSet_workoutExerciseId_idx" ON "WorkoutSet"("workoutExerciseId");

-- CreateIndex
CREATE UNIQUE INDEX "ProgressionState_userId_exerciseId_key" ON "ProgressionState"("userId", "exerciseId");

-- CreateIndex
CREATE INDEX "BodyWeight_userId_date_idx" ON "BodyWeight"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "BodyWeight_userId_date_key" ON "BodyWeight"("userId", "date");

-- CreateIndex
CREATE INDEX "PersonalRecord_userId_exerciseId_idx" ON "PersonalRecord"("userId", "exerciseId");

-- AddForeignKey
ALTER TABLE "UserSettings" ADD CONSTRAINT "UserSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkoutSession" ADD CONSTRAINT "WorkoutSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkoutExercise" ADD CONSTRAINT "WorkoutExercise_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "WorkoutSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkoutExercise" ADD CONSTRAINT "WorkoutExercise_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkoutSet" ADD CONSTRAINT "WorkoutSet_workoutExerciseId_fkey" FOREIGN KEY ("workoutExerciseId") REFERENCES "WorkoutExercise"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgressionState" ADD CONSTRAINT "ProgressionState_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgressionState" ADD CONSTRAINT "ProgressionState_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BodyWeight" ADD CONSTRAINT "BodyWeight_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonalRecord" ADD CONSTRAINT "PersonalRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonalRecord" ADD CONSTRAINT "PersonalRecord_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
