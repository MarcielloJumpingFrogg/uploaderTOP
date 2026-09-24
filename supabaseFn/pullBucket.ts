import { admin_supabase } from "../config/supabase";

const result = await admin_supabase.storage.from("test").info("ca/arcane.jpg");

console.log(result);
