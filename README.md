# Nuxt Blog

Nuxt Blog 是一个基于 Nuxt 4、Nitro、Prisma 与 MySQL 的个人博客系统，包含公开站点与管理员后台两部分能力。

公开站点提供首页、归档、文章详情、关于页、友情链接、项目展示、留言板与 RSS；管理员后台提供文章管理、分类管理、评论审核、媒体库、页面配置与站点设置，并内置管理员会话鉴权与首次改密约束。

## 技术栈

| 类别 | 说明 |
| --- | --- |
| 前端框架 | Nuxt 4、Vue 3 |
| 服务端 | Nitro |
| UI | `@nuxt/ui`、Tailwind CSS |
| 数据层 | Prisma、MySQL |
| 鉴权 | `nuxt-auth-utils` 会话鉴权 |
| 内容编辑 | TipTap 富文本编辑器 |

## 运行环境

1. Node.js 20 及以上版本。
2. `pnpm` 9 及以上版本。
3. 可访问的 MySQL 实例。
4. 可持久化的媒体存储目录。

## 环境变量

复制 `.env.example` 为 `.env`，再按部署环境填写对应值：

```dotenv
NUXT_SESSION_PASSWORD=replace-with-at-least-32-characters-random-string
DATABASE_URL=mysql://root:password@127.0.0.1:3306/nuxt-blog
MEDIA_STORAGE_DIR=storage/media
SECURITY_HASH_SALT=replace-with-random-security-hash-salt
TURNSTILE_SECRET_KEY=
```

| 变量 | 用途 |
| --- | --- |
| `NUXT_SESSION_PASSWORD` | 用于加密管理员会话 Cookie，必须设置为至少 32 个字符的随机字符串。 |
| `DATABASE_URL` | Prisma 连接 MySQL 的连接串。 |
| `MEDIA_STORAGE_DIR` | 媒体文件存放目录；相对路径会解析到当前项目根目录。 |
| `SECURITY_HASH_SALT` | 用于对限流、登录失败计数等安全标识进行服务端哈希，生产环境应填写高强度随机字符串。 |
| `TURNSTILE_SECRET_KEY` | 用于服务端校验 Cloudflare Turnstile 令牌。启用登录、评论、留言或友链申请的人机校验时必须填写。 |

## 安装与初始化

安装依赖：

```bash
pnpm install
```

首次连接新的数据库时，先写入当前 Prisma 结构：

```bash
pnpm exec prisma db push
```

应用启动阶段会自动完成以下初始化动作：

1. 创建默认管理员账号。
2. 初始化站点配置。
3. 初始化文章分类基础数据。
4. 初始化媒体库目录。

## 默认管理员

系统首次启动且数据库中还没有管理员记录时，会自动创建默认管理员：

```text
用户名：admin
密码：admin123
```

首次登录后必须修改密码。改密完成前，后台只开放首次改密页面，其余管理页面会统一拦截。

登录入口：`/admin/login`

## 安全策略

后台“站点设置”中的“安全策略”页已经提供以下能力：

1. 登录、评论、留言、友链申请、点赞接口的按 IP 与会话双维度限流。
2. 登录失败计数、冷却时间与告警记录。
3. 登录、评论、留言、友链申请的人机校验开关与 Turnstile Site Key 配置。

如果启用了任一人机校验开关，除了后台填写 `turnstileSiteKey`，部署环境还需要提供 `TURNSTILE_SECRET_KEY`。

## 管理员密码重置

如果管理员遗忘密码，可以在服务器终端执行：

```bash
pnpm admin:reset-password -- --username admin
```

命令会要求输入新的密码，并把账号重新标记为“下次登录后必须修改密码”。

## 本地开发

```bash
pnpm dev
```

默认访问地址为 `http://localhost:3000`。

常用访问入口：

1. 公开首页：`http://localhost:3000/`
2. 后台登录：`http://localhost:3000/admin/login`
3. RSS：`http://localhost:3000/rss`

## 模块开发

后台模块体系当前以内置“邮件通知”模块为基准实现，相关代码位置如下：

1. 模块注册信息位于 `server/services/module-center.service.ts`，统一维护模块键名、标题、版本、简介、配置页地址，以及默认安装和启用状态。
2. 模块状态持久化位于 `server/repositories/module-center.repository.ts`，本地开发环境会写入 `.data/module-center/state.json`。需要重置安装状态时，可删除该文件后重新启动服务。
3. 后台模块接口位于 `server/api/admin/modules/**`，列表、详情、安装、启用、停用、卸载、配置读取、配置保存与测试动作都从这里进入。
4. 模块页面位于 `app/pages/admin/modules/index.vue` 与 `app/pages/admin/modules/[moduleKey].vue`，模块名称、版本、状态标签和模块专属配置区都在这里呈现。
5. 运行期模块目录位于 `modules/notification-center`。`module.ts` 负责注册 Nuxt 模块，`runtime/plugin.ts` 负责挂接 Nitro hook 并将事件交给通知投递服务。
6. 通知事件名称集中定义在 `server/services/notification-event.service.ts`，当前内置评论提交、评论审核、留言提交、留言审核，以及投递排队、投递成功、投递失败事件。

新增模块时，建议按以下顺序处理：

1. 在 `shared/types/module-center.ts` 与 `server/services/module-center.service.ts` 补充模块元数据，并为模块分配稳定的 `key`。
2. 在 `modules/<module-key>` 下建立模块入口与运行期插件，将业务副作用控制在模块目录或对应服务中。
3. 在 `server/api/admin/modules/<module-key>` 下补齐模块专属接口，在 `app/pages/admin/modules/[moduleKey].vue` 中增加对应配置区，保持模块中心列表页只负责模块总览。
4. 如果模块需要持久化配置或投递记录，优先沿用现有仓储与服务分层：接口层负责鉴权与参数接入，服务层负责规则编排，仓储层负责文件或数据库读写。
5. 如果模块依赖运行期事件，先在 `server/services/notification-event.service.ts` 中定义事件名与负载结构，再在模块运行期插件中订阅，避免事件名分散在业务代码中。

当前邮件通知模块还包含以下约束：

1. SMTP 口令通过 `ENCRYPTION_SECRET_KEY` 加密保存，旧变量 `NOTIFICATION_SECRET_KEY` 继续兼容读取。
2. 通知投递记录写入 Prisma 模型 `NotificationDelivery`，便于排查发信状态。
3. 评论待审核、二级评论回复一级评论、留言待审核均通过模块事件进入发信服务，访客审核状态变化继续通过站内页面呈现。

## 生产构建与启动

构建正式产物：

```bash
pnpm build
```

本地预览构建结果：

```bash
pnpm preview
```

构建完成后，也可以使用 Nitro 服务端入口启动产物：

```bash
node .output/server/index.mjs
```

服务启动时会校验 `NUXT_SESSION_PASSWORD`。`pnpm dev`、`pnpm preview` 与 `node .output/server/index.mjs` 在该变量缺失或长度少于 32 个字符时会终止启动，并输出对应错误信息。`pnpm build` 仅生成产物，会话密钥校验发生在服务真正启动时。

## Docker 部署

仓库已经内置 `Dockerfile`、`docker/entrypoint.sh`、`compose.with-db.yml` 与 `compose.external-db.yml`。独立部署说明见 `DOCKER_DEPLOYMENT.md`。

复制 `.env.example` 为 `.env` 后，Docker 部署只需要维护 `.env`。两份 Compose 文件都会通过 `env_file` 读取这份文件；`compose.with-db.yml` 使用 `MYSQL_ROOT_PASSWORD`、`MYSQL_DATABASE`、`MYSQL_USER` 与 `MYSQL_PASSWORD` 生成容器内数据库连接串，`compose.external-db.yml` 使用 `.env` 中填写的 `DATABASE_URL`。

两种 Docker 部署方式如下：

1. `compose.with-db.yml`：MySQL 与应用一起运行在 Docker Compose 内。
2. `compose.external-db.yml`：应用容器连接已经存在的外部 MySQL。

如果部署环境位于中国大陆，且服务器访问 Debian 或 npm 官方源较慢，可参考 `DOCKER_DEPLOYMENT.md` 中的中国服务器构建加速参数，在 `.env` 中设置 `APT_MIRROR` 与 `NPM_REGISTRY`。其中 `NPM_REGISTRY` 会同时作用于 Corepack 获取 pnpm 与依赖安装阶段的 registry。

应用容器启动时会自动执行 `pnpm exec prisma db push`。如果 `MEDIA_STORAGE_DIR` 缺失，容器会默认使用 `/app/storage/media`；如果希望为 Docker 单独指定媒体卷目录，可在 `.env` 中填写 `DOCKER_MEDIA_STORAGE_DIR`。

内置 MySQL 方案启动命令：

```bash
docker compose --env-file .env -f compose.with-db.yml up --build -d
```

外部 MySQL 方案启动命令：

```bash
docker compose --env-file .env -f compose.external-db.yml up --build -d
```

Docker 镜像构建阶段同样只生成产物。应用容器真正启动前会校验 `NUXT_SESSION_PASSWORD`，缺失或长度少于 32 个字符时会退出。

## 部署注意事项

1. `.env.example` 中的会话密钥、数据库账号、数据库口令、连接串与安全哈希盐均为示例值，复制为 `.env` 后应全部替换。
2. 生产数据库执行结构同步前，宜先完成备份。
3. 如果启用了登录、评论、留言或友链申请的人机校验，还应配置 `TURNSTILE_SECRET_KEY`，并在后台填写 Turnstile Site Key。
4. 首次上线后宜立即登录后台并修改默认管理员密码。
5. 如果部署环境通过反向代理提供站点服务，宜保证静态资源、上传文件与 `/api` 路由都能正确转发。

## 许可证

本项目采用 MIT License，完整文本见 `LICENSE`。
