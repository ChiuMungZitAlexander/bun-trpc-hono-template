import { eq } from "drizzle-orm";

import { db } from "@/lib/database";
import { usersTable } from "@/db/schema";

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
