import { admin_supabase } from "../config/supabase";

async function createBucket(
  name: string,
  mimetype: Array<string>,
  fileSizeLimit: number,
) {
  const result = admin_supabase.storage.createBucket(name, {
    public: false,
    allowedMimeTypes: mimetype,
    fileSizeLimit: fileSizeLimit,
  });
}

export { createBucket };
