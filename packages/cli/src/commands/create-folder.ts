import { apiRequest } from "../lib/api.js";

export async function createFolderCommand(name: string) {
  console.log(`\nCreating folder "${name}"...`);

  const result = await apiRequest("/api/folders", {
    method: "POST",
    body: { name },
  });

  console.log(`\n✓ Created folder "${name}"`);
  console.log(`  Slug: ${result.slug}\n`);
}
