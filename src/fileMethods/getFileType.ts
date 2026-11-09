import logger from '../../config/logger';

export async function getFileType(file: Express.Multer.File) {
  try {
    let filetype: string = '';
    const extensions = new Set([
      'ae',
      'avi',
      'css',
      'csv',
      'excel',
      'file',
      'html',
      'illustrator',
      'jpeg',
      'mpeg',
      'ms-powerpoint',
      'other',
      'pdf',
      'photoshop',
      'png',
      'quicktime',
      'rar',
      'txt',
      'wave',
      'word',
      'x-eps',
      'zip',
    ]);
    const mimetype = file.mimetype.split('/') || ['other', 'other'];
    let first: any = mimetype[0];
    let second: any = mimetype[1];
    if (first == 'text') {
      filetype = 'txt';
    }
    if (second == 'octet-stream') {
      filetype = 'other';
    }
    const splitElement = second.split('.');
    for (let i = 0; i < splitElement.length; i++) {
      if (extensions.has(splitElement[i])) {
        filetype = splitElement[i];
      }
    }

    if (!filetype) {
      //catch situation
      filetype = 'other';
    }
    return filetype;
  } catch (e: any) {
    logger.error(e);
    throw new Error('getFileType Error: ', e);
  }
}
