import fs from "fs";
import { apiRequest } from "../lib/api";
import { renderMarkdown } from "@planshare/renderer";

export async function pushCommand(
  filePath: string,
  options: {
    folder?: string;
    plan?: string;
    title?: string;
    note?: string;
  }
) {
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    process.exit(1);
  }

  const markdown = fs.readFileSync(filePath, "utf-8");

  const h1Match = markdown.match(/^#\s+(.+)$/m);
  if (!h1Match) {
    console.warn("Warning: No H1 heading found in markdown. Title will need to be provided.");
  }

  const { html } = await renderMarkdown(markdown);

  const folders = await apiRequest("/api/folders");

  let folderId: string;
  let planId: string | null = null;
  let title: string;

  if (options.folder && options.title && !options.plan) {
    const folder = folders.find((f: any) => f.slug === options.folder);
    if (!folder) {
      console.error(`Folder not found: ${options.folder}`);
      process.exit(1);
    }
    folderId = folder._id;
    title = options.title;
  } else if (options.plan) {
    planId = options.plan;
    folderId = "";
    title = "";
  } else {
    const inquirer = await import("inquirer");

    const { action } = await inquirer.default.prompt([
      {
        type: "list",
        name: "action",
        message: "New plan or update existing?",
        choices: ["New plan", "Update existing"],
      },
    ]);

    if (action === "New plan") {
      const { selectedFolder } = await inquirer.default.prompt([
        {
          type: "list",
          name: "selectedFolder",
          message: "Which folder?",
          choices: folders.map((f: any) => ({
            name: f.name,
            value: f._id,
          })),
        },
      ]);
      folderId = selectedFolder;

      const { inputTitle } = await inquirer.default.prompt([
        {
          type: "input",
          name: "inputTitle",
          message: "Plan title:",
          default: h1Match?.[1] ?? "",
        },
      ]);
      title = inputTitle;
    } else {
      const { selectedFolder } = await inquirer.default.prompt([
        {
          type: "list",
          name: "selectedFolder",
          message: "Which folder?",
          choices: folders.map((f: any) => ({
            name: f.name,
            value: f._id,
          })),
        },
      ]);

      const plans = await apiRequest("/api/plans", {
        params: { folderId: selectedFolder },
      });

      const { selectedPlan } = await inquirer.default.prompt([
        {
          type: "list",
          name: "selectedPlan",
          message: "Which plan?",
          choices: plans.map((p: any) => ({
            name: `${p.title} (${p.status})`,
            value: p._id,
          })),
        },
      ]);

      planId = selectedPlan;
      folderId = selectedFolder;
      title = "";
    }
  }

  let changeNote = options.note;
  if (planId && !changeNote) {
    const inquirer = await import("inquirer");
    const { note } = await inquirer.default.prompt([
      {
        type: "input",
        name: "note",
        message: "Change note (optional):",
      },
    ]);
    changeNote = note || undefined;
  }

  console.log("\nPushing...");
  const result = await apiRequest("/api/push", {
    method: "POST",
    body: {
      folderId: folderId || undefined,
      planId: planId || undefined,
      title: title || undefined,
      markdownContent: markdown,
      htmlContent: html,
      changeNote,
    },
  });

  console.log(`\n✓ Published → ${result.planId}`);
  console.log(`  Version: ${result.versionId}\n`);
}
