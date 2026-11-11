import { tryCatch } from '@/customErrors/tryCatch';
import { prisma } from '@prisma';
import logger from '../config/logger';

export async function createPseudoFile(
  ownerId: string,
  name: string,
  type: 'FOLDER' | 'txt',
  parentFolder?: string,
  desiredId?: string,
) {
  const pushedType: 'FOLDER' | 'FILE' = type == 'FOLDER' ? 'FOLDER' : 'FILE';
  const { data, error } = await tryCatch(
    prisma.items.create({
      data: {
        id: desiredId,
        ownerId: ownerId,
        fileName: name,
        parentFolderId: parentFolder || null,
        type: pushedType,
        fileType: type,
      },
    }),
  );
  if (error) {
    logger.error('Error creating the pseudoFile:', error);
    return;
  }
  return data;
}
