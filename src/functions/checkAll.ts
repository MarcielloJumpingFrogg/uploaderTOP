import { ProjectError } from '@/customErrors/ErrorBase';

export function checkAll(
  fileId: string,
  isOwner: string,
  parentFolder: string,
) {
  if (!fileId) {
    throw new ProjectError({
      name: 'VARIABLE_IS_EMPTY',
      message: 'File id is empty',
    });
  }
  if (!isOwner) {
    throw new ProjectError({
      name: 'VARIABLE_IS_EMPTY',
      message: 'isOwner is empty',
    });
  }

  if (isOwner != 'true' && isOwner != 'false') {
    throw new ProjectError({
      name: 'VARIABLE_IS_NOT_VALID_TYPE',
      message: 'IsOwner is only supposed to be true or false string',
    });
  }
  if (!parentFolder) {
    throw new ProjectError({
      name: 'VARIABLE_IS_EMPTY',
      message: 'parentFolder is empty',
    });
  }
}
