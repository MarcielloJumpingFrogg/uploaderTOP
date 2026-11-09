import { deleteFile } from './deleteFile';
import { readFolder } from './readFolder';

export async function recursiveDelete(
  path: string,
  bucket: string,
): Promise<void | Error> {
  const fileList = await readFolder(path, bucket, 'server');
  fileList.forEach(async (file: any) => {
    if (file.type == 'folder') {
      const newPath = path + '/' + file.item.name;
      await recursiveDelete(newPath, bucket);
    } else {
      const newPath = path + '/' + file.item.name;
      const deleteResult = await deleteFile(newPath, bucket);
      if (deleteResult.error)
        throw new Error('could not delete file: ', deleteResult.error);
    }
  });
}
