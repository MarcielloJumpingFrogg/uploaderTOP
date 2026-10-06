export function getFullPath(req: any) {
  const pathArray = req.body._location.split(",");
  let fullPath = "/";
  for (let i = 0; i < pathArray.length; i++) {
    if (i != 0) {
      fullPath += "@";
    }
    fullPath += pathArray[i];
  }
  return fullPath;
}
