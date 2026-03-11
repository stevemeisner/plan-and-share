import { apiRequest } from "../lib/api";

export async function foldersCommand() {
  const folders = await apiRequest("/api/folders");

  if (folders.length === 0) {
    console.log("No folders yet.");
    return;
  }

  console.log("\nFolders:\n");
  for (const folder of folders) {
    console.log(`  ${folder.name} (${folder.slug})`);
  }
  console.log("");
}
