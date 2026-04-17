# Docker 部署指南

仓库已经内置可执行的 Docker 部署资产，可直接用于构建镜像与启动容器。

支持两种部署方式：

1. MySQL 与应用一同运行在 Docker Compose 内。
2. 应用容器连接已经存在的外部 MySQL。

两种方式共用同一套应用镜像，差异只在数据库来源与 `DATABASE_URL`。

## 内置文件

仓库根目录已提供以下文件：

1. `Dockerfile`：构建 Nuxt 应用运行镜像。
2. `.dockerignore`：缩小镜像构建上下文。
3. `docker/entrypoint.sh`：容器启动时等待数据库、补齐媒体目录默认值、执行 `pnpm exec prisma db push`，再启动 Nitro。
4. `compose.with-db.yml`：内置 MySQL 的单机编排文件。
5. `compose.external-db.yml`：外部 MySQL 的应用编排文件。

## 路径约定

文档中的 `/app` 表示容器内项目根目录，不是仓库中的 `app/` 前端代码目录。

如果 `MEDIA_STORAGE_DIR` 缺失，应用容器会默认使用 `/app/storage/media`。两份 Compose 文件也都把媒体卷挂载到这个目录。

## 重点提示

⚠️ Compose 文件中的会话密钥、数据库账号、数据库口令、连接串与安全哈希盐全部是占位值，仅用于模板展示，正式部署前必须替换。

⚠️ 应用容器启动时会自动执行 `pnpm exec prisma db push`。如果目标数据库已有正式数据，启动前应先完成备份评估。

⚠️ 应用容器启动前会校验 `NUXT_SESSION_PASSWORD`。缺失该变量或长度少于 32 个字符时，容器会在数据库检查前退出。

⚠️ 空数据库首次启动后会自动创建默认管理员，首次登录后应立即修改密码。

⚠️ 如果启用了登录、评论、留言或友链申请的人机校验，容器环境必须提供 `TURNSTILE_SECRET_KEY`，后台同时需要填写 Turnstile Site Key。

## 构建镜像

默认构建命令仍使用官方源：

```bash
docker build -t nuxt-blog:latest .
```

镜像构建阶段只生成运行产物，`NUXT_SESSION_PASSWORD` 的强制校验发生在容器启动阶段，因此部署环境仍需在启动前提供合法值。

## 中国服务器构建加速

如果服务器访问 Debian 官方源或 npm 官方源较慢，可以在构建阶段传入以下参数：

1. `APT_MIRROR`：用于替换 Debian 软件源域名，例如 `http://mirrors.aliyun.com`。
2. `NPM_REGISTRY`：用于指定 npm registry，例如 `https://registry.npmmirror.com`。该参数会同时影响 Corepack 获取 pnpm 与后续依赖安装阶段使用的 registry。

这些参数只影响镜像构建阶段，留空时默认仍使用官方源。

```bash
docker build \
  --build-arg APT_MIRROR=http://mirrors.aliyun.com \
  --build-arg NPM_REGISTRY=https://registry.npmmirror.com \
  -t nuxt-blog:latest .
```

如果通过 Compose 构建，可以在 `compose.with-db.yml` 或 `compose.external-db.yml` 的 `build.args` 中填写对应值，再执行：

```bash
docker compose -f compose.with-db.yml build
docker compose -f compose.external-db.yml build
```

## 方案一：MySQL 运行在 Docker Compose 内

此方案适合单机部署或测试环境，应用与数据库由同一份 Compose 文件管理。

### 配置要点

1. 在 `compose.with-db.yml` 中替换以下占位值：
   `MYSQL_ROOT_PASSWORD`、`MYSQL_PASSWORD`、`NUXT_SESSION_PASSWORD`、`SECURITY_HASH_SALT`。
2. `DATABASE_URL` 已经指向 Compose 内部的 `db` 服务，并保留 `?allowPublicKeyRetrieval=true`，以适配 `mysql:8` 默认认证方式，无需改成宿主机地址。
3. `NUXT_SESSION_PASSWORD` 至少 32 个字符，`SECURITY_HASH_SALT` 建议使用高强度随机字符串。
4. 如果后台启用了人机校验，还需要填写 `TURNSTILE_SECRET_KEY`。
5. 媒体卷默认挂载到 `/app/storage/media`。

### 启动命令

```bash
docker compose -f compose.with-db.yml up --build -d
```

### 查看日志

```bash
docker compose -f compose.with-db.yml logs -f app
```

## 方案二：使用外部 MySQL

此方案适合已有数据库平台、云数据库或独立数据库主机。

### 配置要点

1. 在 `compose.external-db.yml` 中替换 `NUXT_SESSION_PASSWORD`、`DATABASE_URL` 与 `SECURITY_HASH_SALT`。
2. `NUXT_SESSION_PASSWORD` 至少 32 个字符，`SECURITY_HASH_SALT` 建议使用高强度随机字符串。
3. `DATABASE_URL` 需要填写实际的数据库主机、账号、口令与库名。
4. 如果后台启用了人机校验，还需要填写 `TURNSTILE_SECRET_KEY`。
5. 媒体卷默认挂载到 `/app/storage/media`。

### 启动命令

```bash
docker compose -f compose.external-db.yml up --build -d
```

### 查看日志

```bash
docker compose -f compose.external-db.yml logs -f app
```

## 首次登录与运维命令

系统首次启动后会自动创建默认管理员：

```text
用户名：admin
密码：admin123
```

首次登录后必须修改密码，登录入口为 `http://<host>:3000/admin/login`。

如果需要在容器内重置管理员密码，可以执行：

```bash
docker compose -f compose.with-db.yml exec app pnpm admin:reset-password -- --username admin
```

如果使用外部数据库方案，把文件名替换为 `compose.external-db.yml` 即可。

## 发布前检查

1. `NUXT_SESSION_PASSWORD` 已替换为至少 32 个字符的随机字符串，`SECURITY_HASH_SALT` 已替换为高强度随机字符串，数据库账号、数据库口令与连接串已经替换为正式值。
2. 如果后台启用了人机校验，`TURNSTILE_SECRET_KEY` 已配置，后台 Turnstile Site Key 已填写。
3. `docker compose -f <compose-file> up --build -d` 已执行成功。
4. 媒体卷已经挂载到 `/app/storage/media`，或已按实际目录同步调整卷挂载位置。
5. `http://<host>:3000/admin/login` 可以打开，默认管理员可以登录并完成首次改密。
