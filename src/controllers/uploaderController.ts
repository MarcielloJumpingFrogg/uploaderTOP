import { body } from 'express-validator';
import { uploadFiles } from '../multer/multer';
import type { Response, Request } from 'express';
import customErrorContainer from '../customErrors/customErrorContainer';
import logger from '../../config/logger';
import { getSize } from '../fileMethods/getSize';
import { getFileType } from '../fileMethods/getFileType';
import { tryCatch } from '../customErrors/tryCatch';
import { getUserAndOriginalFolderId } from '@/dbMethods/getUserAndOriginalFolderId';
import { ProjectError } from '@/customErrors/ErrorBase';
import { errorBehaviour } from '@/customErrors/errorBehaviour';
import { uploadFileInBoth } from '@/fileMethods/uploadFileInBoth';

function setNewName(req: Request, file: any): string {
  if (req.body.newName) {
    return req.body.newName;
  } else {
    return file.originalname;
  }
}

async function fileUploaderFunction(req: Request, res: Response) {
  try {
    const file = req.file;
    if (!file || file.size == 0) {
      customErrorContainer.fileError('Insert a non empty file');
      return 'empty or null file';
    }

    if (!req.user || !req.user.id) {
      throw new ProjectError({
        name: 'MISSING_USER',
        message: 'Missing user in getUserAdnOriginalFolderId',
      });
    }
    const size = getSize(file.size);

    const newName = setNewName(req, file);
    const currentFolderId = req.body._currentFolderId || 'Home';

    //Get file type {{{
    const { data: fileType, error: fileTypeError } = await tryCatch(
      getFileType(file),
    ); //does not return type folder
    if (fileTypeError) {
      throw new ProjectError({
        name: 'SERVER_ERROR',
        message: 'fileTypeError in fileUploaderFunction',
        cause: fileTypeError,
      });
    }
    //}}}

    //Getting the user and original folder id, both if user is or is not the owner {{{
    const objectData = await getUserAndOriginalFolderId(
      req.user.id,
      req.userIsOwner,
      currentFolderId,
    );

    if (!objectData) {
      throw new ProjectError({
        name: 'VARIABLE_IS_EMPTY',
        message: 'Object data is missing',
      });
    }
    const { userId, userIsOwner, originalFolderId } = objectData;
    //}}}

    const ownerRedirect = userIsOwner ? '0' : '1';

    //Creating for prisma the file and handling error
    let parentFolder: string | null = '';
    if (currentFolderId == 'Home') {
      parentFolder = null;
    } else {
      parentFolder = currentFolderId;
    }
    const itemsParams = {
      ownerId: userId,
      fileName: newName,
      fileType: fileType,
      size: size,
      parentFolderId: parentFolder,
    };
    await uploadFileInBoth(itemsParams, file);

    res.redirect(`/account/${ownerRedirect}/${originalFolderId}`);
  } catch (error: unknown) {
    errorBehaviour(error, res);
    res.redirect('/');
    return;
  }
}

const fileUploader = [
  uploadFiles.single('usrFile'),
  body('name').escape(),
  async (req: Request, res: Response) => {
    const error = await fileUploaderFunction(req, res);
    if (error) {
      logger.error('Caught an error before redirecting: ', error);
      customErrorContainer.genericError();
      res.redirect('/account');
    }
  },
];
export { fileUploader };
