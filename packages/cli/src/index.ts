import { createRequire } from "module";
import { Command } from "commander";
import { loginCommand } from "./commands/login.js";
import { foldersCommand } from "./commands/folders.js";
import { plansCommand } from "./commands/plans.js";
import { pushCommand } from "./commands/push.js";
import { createFolderCommand } from "./commands/create-folder.js";

const require = createRequire(import.meta.url);
const pkg = require("../package.json");

const program = new Command();

program
  .name("plan-push")
  .description("Publish plans to PlanShare")
  .version(pkg.version);

program
  .command("login [url]")
  .description("Sign in to PlanShare")
  .action(loginCommand);

program
  .command("folders")
  .description("List folders")
  .action(foldersCommand);

program
  .command("plans <folder>")
  .description("List plans in a folder")
  .action(plansCommand);

program
  .command("create-folder <name>")
  .description("Create a new folder")
  .action(createFolderCommand);

program
  .command("push <file>")
  .description("Push a plan (interactive by default)")
  .option("--folder <slug>", "Target folder slug (for new plans)")
  .option("--plan <id>", "Plan ID to update")
  .option("--title <title>", "Plan title (for new plans)")
  .option("--note <note>", "Change note (for updates)")
  .action(pushCommand);

program.parse();
