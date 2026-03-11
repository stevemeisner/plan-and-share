import { apiRequest } from "../lib/api";

export async function plansCommand(folderSlug: string) {
  const folders = await apiRequest("/api/folders");
  const folder = folders.find((f: any) => f.slug === folderSlug);

  if (!folder) {
    console.error(`Folder not found: ${folderSlug}`);
    process.exit(1);
  }

  const plans = await apiRequest("/api/plans", {
    params: { folderId: folder._id },
  });

  if (plans.length === 0) {
    console.log(`No plans in "${folder.name}".`);
    return;
  }

  console.log(`\nPlans in "${folder.name}":\n`);
  for (const plan of plans) {
    console.log(`  ${plan.title} (${plan.slug}) — ${plan.status}`);
  }
  console.log("");
}
