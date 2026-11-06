import { redirect } from "next/navigation";

// Old French address, kept so bookmarks still work.
export default function Page() {
  redirect("/admin/products");
}
