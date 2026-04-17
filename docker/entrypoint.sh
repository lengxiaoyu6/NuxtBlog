#!/bin/sh
set -eu

require_env() {
  variable_name="$1"
  variable_value="$(printenv "$variable_name" 2>/dev/null || true)"

  if [ -z "$variable_value" ]; then
    echo "缺少 ${variable_name} 环境变量" >&2
    exit 1
  fi
}

require_session_password() {
  session_password="$(printenv NUXT_SESSION_PASSWORD 2>/dev/null || true)"
  trimmed_session_password="$(printf '%s' "$session_password" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')"

  if [ -z "$trimmed_session_password" ]; then
    echo "缺少 NUXT_SESSION_PASSWORD 环境变量" >&2
    exit 1
  fi

  if [ "${#trimmed_session_password}" -lt 32 ]; then
    echo "NUXT_SESSION_PASSWORD 至少需要 32 个字符" >&2
    exit 1
  fi

  export NUXT_SESSION_PASSWORD="$trimmed_session_password"
}

wait_for_database() {
  attempts=0
  max_attempts="${DATABASE_WAIT_MAX_ATTEMPTS:-30}"
  sleep_seconds="${DATABASE_WAIT_SLEEP_SECONDS:-3}"

  while [ "$attempts" -lt "$max_attempts" ]; do
    if node --input-type=module <<'EOF_NODE'
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '@prisma/client';

const adapter = new PrismaMariaDb(process.env.DATABASE_URL);
const prisma = new PrismaClient({ adapter });

try {
  await prisma.$queryRawUnsafe('SELECT 1');
}
finally {
  await prisma.$disconnect();
}
EOF_NODE
    then
      return 0
    fi

    attempts=$((attempts + 1))
    echo "数据库尚未就绪，${sleep_seconds} 秒后重试 ${attempts}/${max_attempts}" >&2
    sleep "$sleep_seconds"
  done

  echo "数据库在等待窗口内仍未就绪" >&2
  exit 1
}

require_session_password
require_env DATABASE_URL

export MEDIA_STORAGE_DIR="${MEDIA_STORAGE_DIR:-/app/storage/media}"
mkdir -p "$MEDIA_STORAGE_DIR"

wait_for_database
pnpm exec prisma db push

exec "$@"
