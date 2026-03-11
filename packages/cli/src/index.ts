#!/usr/bin/env node
import { Command } from "commander";
import { loginCommand } from "./commands/login";
import { foldersCommand } from "./commands/folders";
import { plansCommand } from "./commands/plans";
import { pushCommand } from "./commands/push";

const program = new Command();

program
  .name("plan-push")
  .description("Publish plans to PlanShare")
  .version("0.1.0");

program
  .command("login")
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
  .command("push <file>")
  .description("Push a plan (interactive by default)")
  .option("--folder <slug>", "Target folder slug (for new plans)")
  .option("--plan <id>", "Plan ID to update")
  .option("--title <title>", "Plan title (for new plans)")
  .option("--note <note>", "Change note (for updates)")
  .action(pushCommand);

program.parse();
