#!/usr/bin/env node

import { loadAndMapEnvironment } from './config/env.js';
loadAndMapEnvironment();

import { Command } from 'commander';
import { registerCheckCommand } from './cli/commands/check.js';

const program = new Command();

program
    .name('corys-dev')
    .description("Cory's personal developer CLI for multi-agent repository maintenance")
    .version('1.0.0');

registerCheckCommand(program);

program.parse(process.argv);