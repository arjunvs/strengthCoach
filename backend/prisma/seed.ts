import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const EXERCISES = [
  { name: 'Squat',          category: 'barbell', defaultSets: 3, defaultReps: 5, defaultIncrement: 2.5 },
  { name: 'Bench Press',    category: 'barbell', defaultSets: 3, defaultReps: 5, defaultIncrement: 2.5 },
  { name: 'Deadlift',       category: 'barbell', defaultSets: 1, defaultReps: 5, defaultIncrement: 5.0 },
  { name: 'Overhead Press', category: 'barbell', defaultSets: 3, defaultReps: 5, defaultIncrement: 2.5 },
  { name: 'Power Clean',    category: 'barbell', defaultSets: 5, defaultReps: 3, defaultIncrement: 2.5 },
  { name: 'Barbell Row',    category: 'barbell', defaultSets: 5, defaultReps: 5, defaultIncrement: 2.5 },
  { name: 'Chinups',        category: 'bodyweight', defaultSets: 3, defaultReps: 5, defaultIncrement: 0 },
];

async function main() {
  console.log('Seeding exercises...');
  for (const ex of EXERCISES) {
    await prisma.exercise.upsert({
      where: { name: ex.name },
      update: {},
      create: ex,
    });
  }
  console.log(`Seeded ${EXERCISES.length} exercises.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
