#!/usr/bin/env node

import 'dotenv/config';
import process from 'node:process';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '@prisma/client';

const LEGACY_POST_ID_DATA_TYPE = 'varchar';
const TARGET_POST_ID_DATA_TYPE = 'int';

function parseArgs() {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    console.log('用法：pnpm posts:migrate-legacy-ids');
    console.log('说明：当 blog_posts.id 仍为旧字符串主键时，执行该命令完成文章、评论与媒体引用迁移。');
    process.exit(0);
  }
}

function createPrismaClient() {
  if (!process.env.DATABASE_URL?.trim()) {
    throw new Error('缺少 DATABASE_URL 环境变量，无法连接数据库');
  }

  const adapter = new PrismaMariaDb(process.env.DATABASE_URL);

  return new PrismaClient({
    adapter,
  });
}

function formatTimestamp(date = new Date()) {
  return date.toISOString().replace(/\D/g, '').slice(0, 14);
}

function normalizeCountValue(value) {
  if (typeof value === 'bigint') {
    return Number(value);
  }

  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    throw new Error(`无法解析数量值：${String(value)}`);
  }

  return numericValue;
}

async function readColumnInfo(prisma, tableName, columnName) {
  const rows = await prisma.$queryRawUnsafe(`
    SELECT
      DATA_TYPE AS dataType,
      IS_NULLABLE AS isNullable
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = '${tableName}'
      AND COLUMN_NAME = '${columnName}'
    LIMIT 1
  `);

  return rows[0] ?? null;
}

async function readTableCount(prisma, tableName) {
  const rows = await prisma.$queryRawUnsafe(`SELECT COUNT(*) AS total FROM ${tableName}`);
  return normalizeCountValue(rows[0]?.total ?? 0);
}

async function ensureLegacySchema(prisma) {
  const blogPostIdColumn = await readColumnInfo(prisma, 'blog_posts', 'id');
  const postCommentPostIdColumn = await readColumnInfo(prisma, 'post_comments', 'post_id');

  if (!blogPostIdColumn || !postCommentPostIdColumn) {
    throw new Error('未找到 blog_posts.id 或 post_comments.post_id，无法执行旧文章 ID 迁移');
  }

  if (blogPostIdColumn.dataType === TARGET_POST_ID_DATA_TYPE && postCommentPostIdColumn.dataType === TARGET_POST_ID_DATA_TYPE) {
    console.log('当前数据库已经完成旧文章 ID 迁移。');
    return false;
  }

  if (blogPostIdColumn.dataType !== LEGACY_POST_ID_DATA_TYPE || postCommentPostIdColumn.dataType !== LEGACY_POST_ID_DATA_TYPE) {
    throw new Error(`检测到混合结构状态：blog_posts.id=${blogPostIdColumn.dataType}，post_comments.post_id=${postCommentPostIdColumn.dataType}`);
  }

  return true;
}

async function dropTemporaryTables(prisma) {
  await prisma.$executeRawUnsafe('DROP TABLE IF EXISTS blog_post_id_migration_map');
  await prisma.$executeRawUnsafe('DROP TABLE IF EXISTS post_comments_migrating');
  await prisma.$executeRawUnsafe('DROP TABLE IF EXISTS blog_posts_migrating');
}

async function createMigratingPostTable(prisma) {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE blog_posts_migrating (
      id INT NOT NULL AUTO_INCREMENT,
      legacy_id VARCHAR(191) NOT NULL,
      slug VARCHAR(191) DEFAULT NULL,
      title VARCHAR(191) NOT NULL,
      excerpt VARCHAR(191) NOT NULL,
      content_markdown LONGTEXT NOT NULL,
      cover_image_url VARCHAR(191) DEFAULT NULL,
      category VARCHAR(191) NOT NULL,
      tags_json JSON NOT NULL,
      status ENUM('draft', 'published') NOT NULL,
      read_time_text VARCHAR(191) NOT NULL,
      is_pinned TINYINT(1) NOT NULL DEFAULT 0,
      views_count INT NOT NULL DEFAULT 0,
      likes_count INT NOT NULL DEFAULT 0,
      comments_count INT NOT NULL DEFAULT 0,
      published_at DATETIME(3) DEFAULT NULL,
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at DATETIME(3) NOT NULL,
      PRIMARY KEY (id),
      UNIQUE KEY blog_posts_slug_key (slug),
      UNIQUE KEY blog_posts_legacy_id_key (legacy_id),
      KEY blog_posts_status_published_at_idx (status, published_at),
      KEY blog_posts_category_status_published_at_idx (category, status, published_at),
      KEY blog_posts_created_at_idx (created_at),
      KEY blog_posts_updated_at_idx (updated_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await prisma.$executeRawUnsafe(`
    INSERT INTO blog_posts_migrating (
      legacy_id,
      slug,
      title,
      excerpt,
      content_markdown,
      cover_image_url,
      category,
      tags_json,
      status,
      read_time_text,
      is_pinned,
      views_count,
      likes_count,
      comments_count,
      published_at,
      created_at,
      updated_at
    )
    SELECT
      id,
      NULLIF(TRIM(slug), ''),
      title,
      excerpt,
      content_markdown,
      cover_image_url,
      category,
      tags_json,
      status,
      read_time_text,
      is_pinned,
      views_count,
      likes_count,
      comments_count,
      published_at,
      created_at,
      updated_at
    FROM blog_posts
    ORDER BY created_at ASC, updated_at ASC, id ASC
  `);
}

async function createMigrationMap(prisma) {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE blog_post_id_migration_map (
      legacy_id VARCHAR(191) NOT NULL,
      new_id INT NOT NULL,
      PRIMARY KEY (legacy_id),
      UNIQUE KEY blog_post_id_migration_map_new_id_key (new_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await prisma.$executeRawUnsafe(`
    INSERT INTO blog_post_id_migration_map (legacy_id, new_id)
    SELECT legacy_id, id
    FROM blog_posts_migrating
  `);
}

async function createMigratingCommentTable(prisma) {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE post_comments_migrating (
      id VARCHAR(191) NOT NULL,
      post_id INT NOT NULL,
      parent_id VARCHAR(191) DEFAULT NULL,
      author_name VARCHAR(24) NOT NULL,
      author_email VARCHAR(320) NOT NULL,
      author_avatar_url VARCHAR(255) NOT NULL,
      author_region VARCHAR(64) NOT NULL,
      content TEXT NOT NULL,
      status ENUM('pending', 'approved', 'rejected', 'spam') NOT NULL DEFAULT 'pending',
      submitted_at DATETIME(3) NOT NULL,
      reviewed_at DATETIME(3) DEFAULT NULL,
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at DATETIME(3) NOT NULL,
      PRIMARY KEY (id),
      KEY post_comments_post_id_status_submitted_at_idx (post_id, status, submitted_at),
      KEY post_comments_status_submitted_at_idx (status, submitted_at),
      KEY post_comments_parent_id_idx (parent_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await prisma.$executeRawUnsafe(`
    INSERT INTO post_comments_migrating (
      id,
      post_id,
      parent_id,
      author_name,
      author_email,
      author_avatar_url,
      author_region,
      content,
      status,
      submitted_at,
      reviewed_at,
      created_at,
      updated_at
    )
    SELECT
      comments.id,
      mapping.new_id,
      comments.parent_id,
      comments.author_name,
      comments.author_email,
      comments.author_avatar_url,
      comments.author_region,
      comments.content,
      comments.status,
      comments.submitted_at,
      comments.reviewed_at,
      comments.created_at,
      comments.updated_at
    FROM post_comments comments
    JOIN blog_post_id_migration_map mapping
      ON mapping.legacy_id = comments.post_id
    ORDER BY comments.submitted_at ASC, comments.created_at ASC, comments.id ASC
  `);

  await prisma.$executeRawUnsafe(`
    ALTER TABLE post_comments_migrating
      ADD CONSTRAINT post_comments_migrating_post_id_fkey
        FOREIGN KEY (post_id) REFERENCES blog_posts_migrating(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
      ADD CONSTRAINT post_comments_migrating_parent_id_fkey
        FOREIGN KEY (parent_id) REFERENCES post_comments_migrating(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
  `);
}

async function migrateMediaUsageTargetIds(prisma) {
  await prisma.$executeRawUnsafe(`
    UPDATE media_asset_usage media_usage
    JOIN blog_post_id_migration_map mapping
      ON mapping.legacy_id = media_usage.target_id
    SET media_usage.target_id = CAST(mapping.new_id AS CHAR)
    WHERE media_usage.type IN ('post_cover', 'post_inline_image', 'post_attachment')
  `);
}

async function finalizeMigratingPostTable(prisma) {
  await prisma.$executeRawUnsafe(`
    ALTER TABLE blog_posts_migrating
      DROP INDEX blog_posts_legacy_id_key,
      DROP COLUMN legacy_id
  `);
}

async function assertMigratedCounts(prisma, expectedPostCount, expectedCommentCount) {
  const migratedPostCount = await readTableCount(prisma, 'blog_posts_migrating');
  const migratedCommentCount = await readTableCount(prisma, 'post_comments_migrating');

  if (migratedPostCount !== expectedPostCount) {
    throw new Error(`文章迁移数量不一致：期望 ${expectedPostCount}，实际 ${migratedPostCount}`);
  }

  if (migratedCommentCount !== expectedCommentCount) {
    throw new Error(`评论迁移数量不一致：期望 ${expectedCommentCount}，实际 ${migratedCommentCount}`);
  }
}

async function swapTables(prisma) {
  const timestamp = formatTimestamp();
  const blogPostBackupTable = `blog_posts_legacy_${timestamp}`;
  const postCommentBackupTable = `post_comments_legacy_${timestamp}`;

  await prisma.$executeRawUnsafe(`
    RENAME TABLE blog_posts TO ${blogPostBackupTable},
                 post_comments TO ${postCommentBackupTable},
                 blog_posts_migrating TO blog_posts,
                 post_comments_migrating TO post_comments
  `);

  return {
    blogPostBackupTable,
    postCommentBackupTable,
  };
}

async function verifyMigratedSchema(prisma) {
  const blogPostIdColumn = await readColumnInfo(prisma, 'blog_posts', 'id');
  const postCommentPostIdColumn = await readColumnInfo(prisma, 'post_comments', 'post_id');

  if (blogPostIdColumn?.dataType !== TARGET_POST_ID_DATA_TYPE) {
    throw new Error(`迁移后的 blog_posts.id 类型异常：${blogPostIdColumn?.dataType ?? 'unknown'}`);
  }

  if (postCommentPostIdColumn?.dataType !== TARGET_POST_ID_DATA_TYPE) {
    throw new Error(`迁移后的 post_comments.post_id 类型异常：${postCommentPostIdColumn?.dataType ?? 'unknown'}`);
  }
}

async function main() {
  parseArgs();

  const prisma = createPrismaClient();

  try {
    const shouldMigrate = await ensureLegacySchema(prisma);

    if (!shouldMigrate) {
      return;
    }

    const originalPostCount = await readTableCount(prisma, 'blog_posts');
    const originalCommentCount = await readTableCount(prisma, 'post_comments');

    await dropTemporaryTables(prisma);
    await createMigratingPostTable(prisma);
    await createMigrationMap(prisma);
    await createMigratingCommentTable(prisma);
    await assertMigratedCounts(prisma, originalPostCount, originalCommentCount);
    await migrateMediaUsageTargetIds(prisma);
    await finalizeMigratingPostTable(prisma);

    const backups = await swapTables(prisma);

    await prisma.$executeRawUnsafe('DROP TABLE IF EXISTS blog_post_id_migration_map');
    await verifyMigratedSchema(prisma);

    console.log(`旧文章 ID 迁移完成。备份表：${backups.blogPostBackupTable}、${backups.postCommentBackupTable}`);
    console.log('当前正式表已经切换到整数文章主键结构。保留备份表时，请避免直接执行 prisma db push。');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : '旧文章 ID 迁移失败');
  process.exitCode = 1;
});
