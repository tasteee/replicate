import { program } from "commander";
import { upCommand } from "./commands/up.js";
import { downCommand } from "./commands/down.js";

program
  .name("replicate")
  .description(
    "Concatenate files into a markdown snapshot, or reconstruct from one",
  )
  .version("1.0.0");

program.addCommand(upCommand);
program.addCommand(downCommand);

program.parse();
