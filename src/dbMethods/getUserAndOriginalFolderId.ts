import { getFromCurrentFolderId } from './getFromCurrentFolderId';

export async function getUserAndOriginalFolderId(
  requestUser: string,
  bodyUserIsOwner: boolean | undefined,
  currentFolder: string | undefined,
): Promise<{
  userIsOwner: boolean;
  userId: string;
  originalFolderId: string;
}> {
  let user: string = '';
  let userIsOwner;

  if (
    bodyUserIsOwner == undefined ||
    bodyUserIsOwner == true ||
    currentFolder == 'Home' ||
    currentFolder == undefined
  ) {
    user = requestUser;
    userIsOwner = true;
  } else {
    userIsOwner = false;
    const data = await getFromCurrentFolderId(
      currentFolder,
      userIsOwner,
      requestUser,
    );
    user = data.ownerId;
    currentFolder = data.id;
  }
  return {
    userIsOwner: userIsOwner,
    userId: user,
    originalFolderId: currentFolder || 'Home',
  };
}
