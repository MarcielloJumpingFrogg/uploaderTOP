import { admin_supabase } from "../config/supabase";

const mb = 1024 * 1024;

async function createBucket(
  name: string,
  mimetype: Array<string>,
  fileSizeLimit: number,
) {
  const result = await admin_supabase.storage.createBucket(name, {
    public: false,
    allowedMimeTypes: mimetype,
    fileSizeLimit: fileSizeLimit,
  });

  console.log(result);
}

createBucket("avatar", ["image/*"], mb * 5);

export { createBucket };
