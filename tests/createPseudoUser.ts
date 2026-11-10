import { tryCatch } from '@/customErrors/tryCatch';
import type { pseudoUser } from './testTypes';
import { prisma } from '@prisma';
import { ProjectError } from '@/customErrors/ErrorBase';
import bcrypt from 'bcryptjs';
import { generalPassword } from './functions';

export async function createPseudoUser(credentials: pseudoUser) {
  const hashedPassword = await bcrypt.hash(generalPassword, 10);

  const { data, error } = await tryCatch(
    prisma.users.create({
      data: {
        id: credentials.id,
        username: credentials.username,
        password: hashedPassword,
      },
    }),
  );

  if (error) {
    throw new ProjectError({
      name: 'SERVER_ERROR',
      message: 'Error creating pseudoUser',
      cause: error,
    });
  }

  if (!data) {
    throw new ProjectError({
      name: 'VARIABLE_IS_EMPTY',
      message: 'Could Not Create a pseudoUser',
    });
  }
  return data;
}
