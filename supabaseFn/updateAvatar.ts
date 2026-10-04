import { admin_supabase } from "../config/supabase";
import { prisma } from "../lib/prisma";
import { getAvatarVersion } from "../src/prismaDb/getAvatarVersion";
import { updateAvatarVersion } from "../src/prismaDb/updateAvatarVersion";
import { deleteFile } from "./deleteFile";
import { uploadFile } from "./uploadFile";

export async function updateAvatar(
  name: string,
  newBase64File: any,
  newFile: any,
  userId: string,
) {
  try {
    const deleteData = deleteFile(name, "avatar");
    console.log("deleteData", deleteData);
    // const { data, error } = await admin_supabase.storage
    //   .from("avatar")
    //   .update(name, newBase64File, {
    //     cacheControl: "3600",
    //     contentType: newFile.mimetype,
    //   });

    const result = await uploadFile(
      newBase64File,
      newFile,
      "avatar",
      name,
      userId,
    );
    updateAvatarVersion(userId);
    // console.error(error);
    return result;
  } catch (e) {
    console.error(e);
  }
}
