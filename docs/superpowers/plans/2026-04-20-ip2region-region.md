# ip2region 评论与留言板地区识别 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为文章评论与留言板在提交时写入基于 ip2region 的访客地区信息。

**Architecture:** 控制器复用现有安全请求上下文获取客户端 IP，业务服务调用统一的地区识别服务完成省级地区解析，再将结果写入 `authorRegion`。地区识别服务使用 `ip2region.js` 与本地 `xdb` 数据文件，优先通过全量内存缓存完成查询。

**Tech Stack:** Nuxt 4, Nitro, Vitest, Prisma, ip2region.js, Node.js 20

---

### Task 1: 补齐测试基线

**Files:**
Create: `tests/server/services/ip-region.service.test.ts`
Create: `tests/server/services/post-comment.logic.test.ts`
Create: `tests/server/services/guestbook.service.test.ts`
Create: `tests/server/controllers/post-comment.controller.test.ts`
Create: `tests/server/controllers/guestbook.controller.test.ts`

- [ ] **Step 1: 写出地区识别与服务接入失败测试**

```ts
import { describe, expect, it, vi } from 'vitest';
```

- [ ] **Step 2: 运行定向测试并确认失败**

Run: `pnpm test tests/server/services/ip-region.service.test.ts tests/server/services/post-comment.logic.test.ts tests/server/services/guestbook.service.test.ts tests/server/controllers/post-comment.controller.test.ts tests/server/controllers/guestbook.controller.test.ts`
Expected: FAIL，缺少新服务或签名尚未调整。

### Task 2: 实现地区识别服务

**Files:**
Create: `server/services/ip-region.service.ts`
Create: `server/utils/region-normalizer.ts`
Modify: `nuxt.config.ts`
Modify: `.env.example`

- [ ] **Step 1: 实现纯函数与服务工厂**

```ts
export function normalizeRegionName(rawRegion: string): string
export function createIpRegionService(...)
```

- [ ] **Step 2: 使用 `ip2region.js` 完成查询器初始化与缓存**

```ts
import { IPv4, IPv6, loadContentFromFile, newWithBuffer, verifyFromFile } from 'ip2region.js';
```

- [ ] **Step 3: 运行地区识别测试**

Run: `pnpm test tests/server/services/ip-region.service.test.ts`
Expected: PASS

### Task 3: 接入评论与留言板保存逻辑

**Files:**
Modify: `server/services/post-comment.service.ts`
Modify: `server/services/post-comment.logic.mjs`
Modify: `server/services/guestbook.service.ts`

- [ ] **Step 1: 扩展评论与留言板服务签名，接收 `clientIp`**

```ts
createPostComment(postId, input, { clientIp })
createGuestbookEntry(input, { clientIp })
```

- [ ] **Step 2: 调用地区识别服务并写入 `authorRegion`**

```ts
const authorRegion = await resolveAuthorRegionByIp(options?.clientIp);
```

- [ ] **Step 3: 运行服务层测试**

Run: `pnpm test tests/server/services/post-comment.logic.test.ts tests/server/services/guestbook.service.test.ts`
Expected: PASS

### Task 4: 调整控制器与部署资源

**Files:**
Modify: `server/controllers/post-comment.controller.ts`
Modify: `server/controllers/guestbook.controller.ts`
Create: `server/resources/ip2region/.gitkeep`
Modify: `Dockerfile`

- [ ] **Step 1: 控制器从 `consumeRateLimit` 结果中读取 `ip` 并传入业务服务**

```ts
const requestContext = await securityRequestService.consumeRateLimit(event, ...);
return await createPostComment(identifier, body, { clientIp: requestContext.ip });
```

- [ ] **Step 2: 运行控制器测试**

Run: `pnpm test tests/server/controllers/post-comment.controller.test.ts tests/server/controllers/guestbook.controller.test.ts`
Expected: PASS

- [ ] **Step 3: 补充 Docker 运行镜像的 xdb 资源目录**

```dockerfile
COPY --from=build /app/server/resources/ip2region ./server/resources/ip2region
```

### Task 5: 验证与收尾

**Files:**
Modify: `package.json`

- [ ] **Step 1: 安装 `ip2region.js`**

Run: `pnpm add ip2region.js`
Expected: `package.json` 与 `pnpm-lock.yaml` 更新。

- [ ] **Step 2: 下载官方 xdb 数据文件到资源目录**

Run: `mkdir -p server/resources/ip2region && curl -L -o server/resources/ip2region/ip2region_v4.xdb https://raw.githubusercontent.com/lionsoul2014/ip2region/master/data/ip2region_v4.xdb && curl -L -o server/resources/ip2region/ip2region_v6.xdb https://raw.githubusercontent.com/lionsoul2014/ip2region/master/data/ip2region_v6.xdb`
Expected: 资源文件写入完成。

- [ ] **Step 3: 运行本次相关测试**

Run: `pnpm test tests/server/services/ip-region.service.test.ts tests/server/services/post-comment.logic.test.ts tests/server/services/guestbook.service.test.ts tests/server/controllers/post-comment.controller.test.ts tests/server/controllers/guestbook.controller.test.ts`
Expected: PASS
