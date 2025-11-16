import * as fs from 'node:fs';
import * as path from 'node:path';
import inquirer from 'inquirer';
import chalk from 'chalk';
import {
  PRIMARY_CATEGORIES,
  SECONDARY_CATEGORIES,
  formatCategories,
} from '../shared/categories.js';
import { generateFilename } from '../shared/filename.js';
import { renderChangelogEntry } from '../template.js';

interface PromptAnswers {
  title: string;
  primaryCategory: string;
  secondaryCategories: Array<string>;
  summary: string;
  addDetailedContent: boolean;
  detailedContent?: string;
}

async function promptUser(): Promise<PromptAnswers> {
  console.log(chalk.cyan('✨ Creating a new changelog entry...\n'));

  const answers = await inquirer.prompt<Omit<PromptAnswers, 'detailedContent'>>(
    [
      {
        type: 'input',
        name: 'title',
        message: 'Entry title:',
        validate: (input: string) => {
          if (!input.trim()) {
            return 'Title is required';
          }
          if (input.length > 100) {
            return 'Title should be less than 100 characters';
          }
          return true;
        },
      },
      {
        type: 'list',
        name: 'primaryCategory',
        message: 'Select primary category:',
        choices: PRIMARY_CATEGORIES,
      },
      {
        type: 'checkbox',
        name: 'secondaryCategories',
        message: 'Select change types (space to select, enter to continue):',
        choices: SECONDARY_CATEGORIES,
      },
      {
        type: 'editor',
        name: 'summary',
        message: 'Brief summary (appears on main changelog page):',
        validate: (input: string) => {
          if (!input.trim()) {
            return 'Summary is required';
          }
          return true;
        },
      },
      {
        type: 'confirm',
        name: 'addDetailedContent',
        message: 'Add detailed content?',
        default: false,
      },
    ],
  );

  let detailedContent: string;
  if (answers.addDetailedContent) {
    const detailedAnswer = await inquirer.prompt<{ detailedContent: string }>([
      {
        type: 'editor',
        name: 'detailedContent',
        message: 'Detailed content (appears after "Read more"):',
        default: `## Additional Details

Add more detailed information here, such as:
- Code examples
- Migration guides  
- Links to documentation
- Breaking change details`,
      },
    ]);
    detailedContent = detailedAnswer.detailedContent;
  } else {
    detailedContent = `## Additional Details

Add more detailed information here, such as:
- Code examples
- Migration guides
- Links to documentation
- Breaking change details`;
  }

  return { ...answers, detailedContent };
}

/**
 * Creates a new changelog entry interactively.
 * Prompts the user for title, categories, summary, and detailed content,
 * then generates a markdown file in changelog/entries/.
 */
export async function createCommand(repoRoot: string): Promise<void> {
  try {
    const changelogDir = path.join(repoRoot, 'changelog', 'entries');
    fs.mkdirSync(changelogDir, { recursive: true });

    const answers = await promptUser();

    const filename = generateFilename(answers.title, changelogDir);
    const filepath = path.join(changelogDir, filename);

    const allCategories = [
      answers.primaryCategory,
      ...answers.secondaryCategories,
    ];

    const content = renderChangelogEntry({
      repoRoot,
      title: answers.title,
      categories: allCategories,
      summary: answers.summary.trim(),
      detailedContent: answers.detailedContent!.trim(),
    });

    fs.writeFileSync(filepath, content);

    console.log(
      chalk.green(`\n✅ Created: ${path.relative(process.cwd(), filepath)}`),
    );
    console.log(chalk.yellow('📝 Next steps:'));
    console.log(chalk.yellow('  • Run: pnpm start (to see changes locally)'));
  } catch (error: any) {
    console.error(
      chalk.red('❌ Error creating changelog entry:'),
      error.message,
    );
    process.exit(1);
  }
}
