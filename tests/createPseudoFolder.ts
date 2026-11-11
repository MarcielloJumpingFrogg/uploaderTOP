import { createPseudoFile } from './createPseudoFile';

export async function createPseudoFolder(
  ownerId: string,
  name: string,
  parentFolder?: string,
  desiredId?: string,
) {
  const result = await createPseudoFile(
    ownerId,
    name,
    'FOLDER',
    parentFolder,
    desiredId,
  );
  if (!result) {
    return;
  } else return result;
}
