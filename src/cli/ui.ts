import chalk from 'chalk';
import ora, { Ora } from 'ora';

export function printBanner(): void {
    console.log('\n' + chalk.bold.cyan('========================================'));
    console.log(chalk.bold.cyan('          corys-dev Maintenance          '));
    console.log(chalk.bold.cyan('========================================') + '\n');
}

export function createSpinner(text: string): Ora {
    return ora({
        text: chalk.blue(text),
        spinner: 'dots'
    });
}

export function logError(msg: string): void {
    console.error(chalk.red(`\n❌ ${msg}`));
}

export function logSuccess(msg: string): void {
    console.log(chalk.green(`\n✔ ${msg}`));
}

export function logInfo(label: string, value: string): void {
    console.log(`${chalk.dim(label)} ${chalk.bold(value)}`);
}