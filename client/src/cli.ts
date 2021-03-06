#!/usr/bin/env node

import { Command } from 'commander';
import dotenv from 'dotenv';
import pkg from '../package.json';
import { baiduTranslate, googleTranslate, youdaoTranslate } from './main';

dotenv.config();

type Option = {
  command: string;
  description: string;
  action: (word: string) => void;
};

const program = new Command();
const optionMap = {
  baidu: {
    command: 'baidu <word>',
    description: 'use Baidu Translate',
    action: (word: string) => baiduTranslate(word)
  },
  youdao: {
    command: 'youdao <word>',
    description: 'use Youdao Translate',
    action: (word: string) => youdaoTranslate(word)
  },
  google: {
    command: 'google <word>',
    description: 'use Google Translate',
    action: (word: string) => googleTranslate(word)
  }
};

program
  .version(pkg.version)
  .name('translate')
  .usage('<tool> <word>') // * Usage: translate <tool> <word>
  .helpOption('-H, --help', 'read more information');

Object.values(optionMap).forEach((option: Option) => {
  program
    .command(option.command)
    .description(option.description)
    .action(option.action);
});

program.parse();
