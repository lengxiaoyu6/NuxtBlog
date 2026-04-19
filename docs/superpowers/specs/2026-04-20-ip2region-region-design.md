# ip2region 评论与留言板地区识别设计

## 目标

在文章评论与留言板提交时，根据访客 IP 识别地区，并将省级结果写入 `authorRegion`。地区展示以简短身份信息为主，例如 `广东`、`北京`、`香港`。

## 设计范围

本次设计覆盖以下位置：

1. `server/controllers/post-comment.controller.ts`
2. `server/controllers/guestbook.controller.ts`
3. `server/services/post-comment.service.ts`
4. `server/services/post-comment.logic.mjs`
5. `server/services/guestbook.service.ts`
6. `server/services/ip-region.service.ts`
7. `server/utils/region-normalizer.ts`
8. `nuxt.config.ts`
9. `.env.example`
10. Docker 运行时资源拷贝

数据库字段维持现状，`PostComment.authorRegion` 与 `GuestbookEntry.authorRegion` 继续复用。

## 核心方案

采用 `ip2region` 离线库与本地 `xdb` 数据文件完成地区识别。

请求进入评论或留言提交接口后，控制器先执行现有的限流与人机校验，再复用 `securityRequestService.consumeRateLimit(event, ...)` 返回的 `requestContext.ip` 取得客户端 IP。业务服务收到 `clientIp` 后，调用统一的 `ip-region.service.ts` 获取地区文本，并在创建记录时写入 `authorRegion`。

整个提交流程不依赖外部 HTTP 查询，因此评论与留言板保存不受第三方接口超时影响。

## 地区识别规则

### 中国大陆

从 `ip2region` 返回值中提取省级字段，并规整为短名称：

1. `广东省` 转为 `广东`
2. `北京市` 转为 `北京`
3. `广西壮族自治区` 转为 `广西`
4. `新疆维吾尔自治区` 转为 `新疆`
5. `内蒙古自治区` 转为 `内蒙古`

### 港澳台

1. `香港特别行政区` 转为 `香港`
2. `澳门特别行政区` 转为 `澳门`
3. `台湾省` 转为 `台湾`

### 海外地址

优先保存国家字段，例如 `United States`、`Japan`。

### 特殊地址

1. 局域网、回环、链路本地、保留地址保存为 `内网地址`
2. 查询失败、数据文件缺失、字段为空保存为 `地区未知`

## 服务结构

### 控制器层

控制器维持请求读取与安全校验职责，并将 `clientIp` 传入业务服务。

### 业务服务层

评论与留言板服务负责：

1. 输入校验
2. 父级回复校验
3. 调用地区识别服务
4. 将地区信息写入数据库

### 地区识别服务

`server/services/ip-region.service.ts` 负责：

1. 识别 IPv4 与 IPv6
2. 判断内网与保留地址
3. 懒加载并缓存 `ip2region` 搜索对象
4. 根据 `xdb` 查询结果返回统一地区文案

## 资源与配置

新增运行时配置：

1. `ipRegionProvider`
2. `ipRegionDbV4Path`
3. `ipRegionDbV6Path`

默认提供方固定为 `ip2region`，默认资源路径分别指向：

1. `server/resources/ip2region/ip2region_v4.xdb`
2. `server/resources/ip2region/ip2region_v6.xdb`

由于 Docker 运行镜像当前不会复制该目录，构建文件需要补充对应资源拷贝。

## 失败处理

地区识别属于增强信息，不能阻塞评论与留言主业务。发生异常时维持提交成功，并把 `authorRegion` 写成 `地区未知`。服务端保留简短日志，便于定位资源路径与查询异常。

## 测试范围

1. 地区规整规则测试
2. 内网与特殊地址识别测试
3. 评论服务写入地区测试
4. 留言板服务写入地区测试
5. 控制器传递 `clientIp` 测试
