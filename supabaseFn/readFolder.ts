import { admin_supabase } from "../config/supabase";

const { data, error } = await admin_supabase.storage
  .from("avatar")
  .list("avatars", {
    limit: 100,
    offset: 0,
    sortBy: { column: "name", order: "asc" },
  });
// Handle files vs folders
data?.forEach((item) => {
  if (item.id !== null) {
    // It's a file
    console.log("File:", item);
  } else {
    // It's a folder
    console.log("Folder:", item.name);
  }
});
