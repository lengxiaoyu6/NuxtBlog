#!/usr/bin/env node

import 'dotenv/config';
import process from 'node:process';
import { createInterface } from 'node:readline/promises';
import { Writable } from 'node:stream';
import { Hash } from '@adonisjs/hash';
import { Scrypt } from '@adonisjs/hash/drivers/scrypt';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '@prisma/client';

const DEFAULT_ADMIN_USERNAME = 'admin';
const DEFAULT_ADMIN_PASSWORD = 'admin123';
const MINIMUM_PASSWORD_LENGTH = 8;

function parseUsername() {
  const args = process.argv.slice(2);
  const usernameIndex = args.indexOf('--username');

  if (args.includes('--help') || args.includes('-h')) {
    console.log('用法：pnpm admin:reset-password -- --username admin');
    process.exit(0);
  }

  if (usernameIndex === -1) {
    return DEFAULT_ADMIN_USERNAME;
  }

  const username = args[usernameIndex + 1]?.trim();

  if (!username) {
    throw new Error('请通过 --username 指定需要重置密码的管理员账号');
  }

  return username;
}

function createMutedWriter() {
  const mutedWriter = new Writable({
    write(chunk, encoding, callback) {
      if (!mutedWriter.muted) {
        process.stdout.write(chunk, encoding);
      }

      callback();
    },
  });

  mutedWriter.muted = false;

  return mutedWriter;
}

async function promptHidden(promptText) {
  const mutedWriter = createMutedWriter();
  const rl = createInterface({
    input: process.stdin,
    output: mutedWriter,
    terminal: true,
  });

  try {
    process.stdout.write(promptText);
    mutedWriter.muted = true;
    const value = await rl.question('');
    process.stdout.write('\n');

    return value.trim();
  } finally {
    rl.close();
    mutedWriter.end();
  }
}

function validatePassword(password, confirmPassword) {
  if (!password || !confirmPassword) {
    throw new Error('新密码和确认密码不能为空');
  }

  if (password.length < MINIMUM_PASSWORD_LENGTH) {
    throw new Error('新密码长度至少为 8 位');
  }

  if (password === DEFAULT_ADMIN_PASSWORD) {
    throw new Error('新密码不能与初始密码相同');
  }

  if (password !== confirmPassword) {
    throw new Error('两次输入的密码不一致');
  }
}

async function main() {
  const username = parseUsername();

  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    throw new Error('当前终端环境无法隐藏输入密码，请在交互式终端中执行该命令');
  }

  if (!process.env.DATABASE_URL?.trim()) {
    throw new Error('缺少 DATABASE_URL 环境变量，无法连接数据库');
  }

  const password = await promptHidden('请输入新的管理员密码：');
  const confirmPassword = await promptHidden('请再次输入新的管理员密码：');

  validatePassword(password, confirmPassword);

  const adapter = new PrismaMariaDb(process.env.DATABASE_URL);
  const prisma = new PrismaClient({ adapter });
  const hash = new Hash(new Scrypt({}));

  try {
    const adminUser = await prisma.adminUser.findUnique({
      where: {
        username,
      },
    });

    if (!adminUser) {
      throw new Error(`管理员账号不存在：${username}`);
    }

    const passwordHash = await hash.make(password);

    await prisma.adminUser.update({
      where: {
        id: adminUser.id,
      },
      data: {
        passwordHash,
        mustChangePassword: true,
        passwordUpdatedAt: new Date(),
      },
    });
  } finally {
    await prisma.$disconnect();
  }

  console.log('管理员密码已重置，下次登录后需要重新修改密码。');
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : '管理员密码重置失败');
  process.exitCode = 1;
});
