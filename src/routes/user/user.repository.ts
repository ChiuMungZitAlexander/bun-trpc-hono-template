import { eq } from 'drizzle-orm';

import { db } from '@/lib/database';

import { usersTable } from '@/db/schema';

/**
 *
 */
export const getUserByEmail = async (email: string) => {
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email))
    .limit(1);

  return user;
};

/**
 *
 */
export const createUserByEmailAndPassword = async ({
  email,
  name,
  password,
}: Pick<typeof usersTable.$inferInsert, 'email' | 'name'> & {
  password: string;
}) => {
  const hashedPassword = await Bun.password.hash(password);

  const [user] = await db
    .insert(usersTable)
    .values({ email, hashedPassword, name })
    .returning();

  return user;
};
