import { updateAvatarVersion } from '@/prismaDb/updateAvatarVersion';
import { checkExists } from './checkExists';
import { updateAvatar } from './updateAvatar';
import { uploadFile } from './uploadFile';

export async function uploadAvatar(file: any, userId: string) {
  const name = 'avatars/' + userId;

  if (await checkExists(name, 'avatar')) {
    await updateAvatar(name, file, userId);
  } else {
    await updateAvatarVersion(userId);
    await uploadFile(file, 'avatar', name);
  }
}
