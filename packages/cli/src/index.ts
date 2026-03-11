import { Command } from "commander";

const program = new Command();

program
  .name("plan-push")
  .description("Push markdown plans to PlanShare")
  .version("0.0.0");

program
  .command("push <file>")
  .description("Push a markdown file to PlanShare")
  .action((file: string) => {
    console.log(`Would push: ${file}`);
  });

program.parse();
