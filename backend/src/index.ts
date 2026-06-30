import './config/env';
import { app } from './app';
import { env } from './config/env';
import { prisma } from './db/prisma';

async function main() {
  await prisma.$connect();
  app.listen(env.PORT, () => {
    console.log(`🏋️  StrengthCoach backend listening on http://localhost:${env.PORT}`);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
