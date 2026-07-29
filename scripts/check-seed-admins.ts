import mongoose from 'mongoose';

import { connectDatabase } from '../src/config/database';
import { AdminUser } from '../src/modules/auth/auth.model';
import { ensureSeedAdmin } from '../src/modules/auth/auth.service';

async function main() {
  await connectDatabase();
  await ensureSeedAdmin();

  const admins = await AdminUser.find({
    email: { $in: ['admin@closingengage.com', 'quantumerrors@gmail.com'] },
  })
    .select('email isActive')
    .lean();

  console.log(
    JSON.stringify(
      admins.map((admin) => ({
        email: admin.email,
        isActive: admin.isActive,
      })),
      null,
      2,
    ),
  );

  await mongoose.disconnect();
}

void main().catch((error) => {
  console.error(error);
  process.exit(1);
});
