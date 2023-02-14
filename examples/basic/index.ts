import {
  text,
  select,
  confirm,
  intro,
  outro,
  cancel,
  spinner,
  isCancel,
  multiselect,
  note,
} from "@clack/prompts";
import color from "picocolors";
import { setTimeout } from "node:timers/promises";

async function main() {
  console.clear();

  await setTimeout(1000);

  intro(`${color.bgCyan(color.black(" create-app "))}`);

  const dir = await text({
    message: "Where should we create your project?",
    placeholder: "./sparkling-solid",
  });

  if (isCancel(dir)) {
    cancel("Operation cancelled.");
    process.exit(0);
  }

  const projectType = await select({
    message: "Pick a project type.",
    options: [
      { value: "ts", label: "TypeScript" },
      { value: "js", label: "JavaScript" },
      { value: "coffee", label: "CoffeeScript", hint: "oh no" },
    ],
  });

  if (isCancel(projectType)) {
    cancel("Operation cancelled.");
    process.exit(0);
  }

  const tools = await multiselect({
    message: "Select additional tools.",
    options: [
      { value: "prettier", label: "Prettier", hint: "recommended" },
      { value: "eslint", label: "ESLint" },
      { value: "stylelint", label: "Stylelint" },
      { value: "gh-action", label: "GitHub Action" },
    ],
  });

  if (isCancel(tools)) {
    cancel("Operation cancelled.");
    process.exit(0);
  }

  const install = await confirm({
    message: "Install dependencies?",
    initialValue: false
  });

  if (isCancel(install)) {
    cancel("Operation cancelled.");
    process.exit(0);
  }

  if (install) {
    const s = spinner();
    s.start("Installing via pnpm");
    await setTimeout(5000);
    s.stop("Installed via pnpm");  
  }

  let nextSteps = `cd ${dir}        \n${install ? '' : 'npm install\n'}npm run dev`;

  note(nextSteps, 'Next steps.');
  
  await setTimeout(1000);

  outro(`Problems? ${color.underline(color.cyan('https://example.com/issues'))}`);
}

main().catch(console.error);
