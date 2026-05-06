<template>
  <div class="space-y-8 pb-20">
    <UCard :ui="{ root: 'admin-theme-card rounded-[2rem] border-slate-200 dark:border-slate-800', body: 'p-5 sm:p-6' }">
      <div class="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div class="space-y-3">
          <NuxtLink
            to="/admin/modules"
            class="inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          >
            <UIcon name="i-lucide-arrow-left" class="size-4" />
            返回模块插件
          </NuxtLink>

          <div class="flex flex-wrap items-center gap-3">
            <UIcon name="i-lucide-package" class="size-7 text-brand-600 dark:text-brand-300" />
            <h1 class="font-serif text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              {{ moduleInfo?.name || fallbackModuleName || '模块详情' }}
            </h1>
            <span
              v-if="moduleInfo"
              class="inline-flex items-center rounded-full border border-slate-200 px-3 py-1 text-xs font-bold text-slate-500 dark:border-slate-700 dark:text-slate-300"
            >
              v{{ moduleInfo.version }}
            </span>
          </div>

          <p class="text-sm leading-6 text-slate-500 dark:text-slate-400">
            {{ moduleInfo?.description || '查看模块状态、配置项与测试能力。邮件通知模块负责评论与留言邮件通知。' }}
          </p>

          <div
            v-if="notificationFeedbackMessage && isNotificationModule"
            class="inline-flex max-w-full items-start gap-2 rounded-2xl border px-4 py-3 text-sm"
            :class="notificationFeedbackTone === 'error'
              ? 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-200'
              : 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-200'"
          >
            <AlertCircle v-if="notificationFeedbackTone === 'error'" :size="16" class="mt-0.5 shrink-0" />
            <ShieldCheck v-else :size="16" class="mt-0.5 shrink-0" />
            <span>{{ notificationFeedbackMessage }}</span>
          </div>
        </div>

        <div v-if="moduleInfo" class="flex flex-wrap gap-3 xl:justify-end">
          <UButton
            v-if="!moduleInfo.installed"
            :loading="pendingModuleAction === 'install'"
            :icon="pendingModuleAction === 'install' ? undefined : 'i-lucide-download'"
            class="justify-center"
            :disabled="Boolean(pendingModuleAction)"
            @click="submitModuleAction('install')"
          >
            安装模块
          </UButton>

          <UButton
            v-else-if="!moduleInfo.enabled"
            color="info"
            :loading="pendingModuleAction === 'enable'"
            :icon="pendingModuleAction === 'enable' ? undefined : 'i-lucide-power'"
            class="justify-center"
            :disabled="Boolean(pendingModuleAction)"
            @click="submitModuleAction('enable')"
          >
            启用模块
          </UButton>

          <UButton
            v-else
            color="warning"
            variant="soft"
            :loading="pendingModuleAction === 'disable'"
            :icon="pendingModuleAction === 'disable' ? undefined : 'i-lucide-circle-off'"
            class="justify-center"
            :disabled="Boolean(pendingModuleAction)"
            @click="submitModuleAction('disable')"
          >
            停用模块
          </UButton>

          <UButton
            v-if="moduleInfo.installed"
            color="error"
            variant="soft"
            :loading="pendingModuleAction === 'uninstall'"
            :icon="pendingModuleAction === 'uninstall' ? undefined : 'i-lucide-trash-2'"
            class="justify-center"
            :disabled="Boolean(pendingModuleAction)"
            @click="submitModuleAction('uninstall')"
          >
            卸载模块
          </UButton>
        </div>
      </div>
    </UCard>

    <section
      v-if="pageState === 'loading'"
      class="admin-theme-card flex min-h-[18rem] items-center justify-center rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
    >
      <div class="inline-flex items-center gap-3 text-sm font-bold text-slate-500 dark:text-slate-300">
        <LoaderCircle :size="18" class="animate-spin" />
        正在读取模块详情...
      </div>
    </section>

    <section
      v-else-if="pageState === 'error'"
      class="admin-theme-card rounded-[2rem] border border-rose-200 bg-rose-50 p-6 shadow-sm dark:border-rose-900/50 dark:bg-rose-950/20"
    >
      <div class="flex items-start gap-3 text-rose-700 dark:text-rose-200">
        <AlertCircle :size="18" class="mt-0.5 shrink-0" />
        <div class="space-y-2">
          <h2 class="text-lg font-black">模块详情读取失败</h2>
          <p class="text-sm leading-6">{{ pageErrorMessage }}</p>
        </div>
      </div>
    </section>

    <template v-else-if="moduleInfo">
      <section class="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <article class="admin-theme-card rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div class="mb-5 flex items-center gap-3">
            <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-900/20 dark:text-brand-300">
              <Package :size="22" />
            </div>
            <div>
              <h2 class="text-lg font-black text-slate-900 dark:text-white">模块状态</h2>
              <p class="text-sm text-slate-500 dark:text-slate-400">统一展示安装状态、启用状态与配置入口。</p>
            </div>
          </div>

          <dl class="grid gap-4 sm:grid-cols-2">
            <div class="rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-950/40">
              <dt class="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">模块键名</dt>
              <dd class="mt-2 text-sm font-bold text-slate-900 dark:text-white">{{ moduleInfo.key }}</dd>
            </div>
            <div class="rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-950/40">
              <dt class="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">模块版本</dt>
              <dd class="mt-2 text-sm font-bold text-slate-900 dark:text-white">v{{ moduleInfo.version }}</dd>
            </div>
            <div class="rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-950/40">
              <dt class="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">安装状态</dt>
              <dd class="mt-2 text-sm font-bold" :class="moduleInfo.installed ? 'text-emerald-600 dark:text-emerald-300' : 'text-slate-500 dark:text-slate-300'">
                {{ moduleInfo.installed ? '已安装' : '未安装' }}
              </dd>
            </div>
            <div class="rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-950/40">
              <dt class="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">启用状态</dt>
              <dd class="mt-2 text-sm font-bold" :class="moduleInfo.enabled ? 'text-sky-600 dark:text-sky-300' : 'text-amber-600 dark:text-amber-300'">
                {{ moduleInfo.enabled ? '已启用' : '已停用' }}
              </dd>
            </div>
          </dl>
        </article>

        <article class="admin-theme-card rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div class="mb-5 flex items-center gap-3">
            <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-600 dark:bg-sky-950/30 dark:text-sky-300">
              <BellRing :size="22" />
            </div>
            <div>
              <h2 class="text-lg font-black text-slate-900 dark:text-white">模块说明</h2>
              <p class="text-sm text-slate-500 dark:text-slate-400">当前模块插件页面独立维护配置与测试操作。</p>
            </div>
          </div>

          <div class="space-y-3 text-sm leading-6 text-slate-500 dark:text-slate-400">
            <p>
              <span class="font-bold text-slate-900 dark:text-white">{{ fallbackModuleName }}</span>
              已从系统设置页迁出，当前页面负责通知配置、事件开关与测试发信。
            </p>
            <p>安装状态决定模块是否注册到模块中心，启用状态决定运行时事件是否参与处理。</p>
            <p v-if="moduleInfo.settingsPath">当前配置入口：{{ moduleInfo.settingsPath }}</p>
          </div>
        </article>
      </section>

      <template v-if="isNotificationModule">
        <section class="admin-theme-card rounded-[2.5rem] border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
          <div class="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div class="flex items-start gap-3">
              <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-600 dark:bg-sky-950/30 dark:text-sky-300">
                <Mail :size="22" />
              </div>
              <div>
                <h2 class="text-lg font-black text-slate-900 dark:text-white">邮件通知</h2>
                <p class="text-sm text-slate-500 dark:text-slate-400">集中维护邮件通知的启用开关、管理员收件邮箱与通知范围。</p>
              </div>
            </div>

            <span class="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold" :class="notificationSaveBadge.badgeClass">
              <component :is="notificationSaveBadge.icon" :size="14" :class="notificationSaveState === 'saving' ? 'animate-spin' : ''" />
              {{ notificationSaveBadge.label }}
            </span>
          </div>

          <div class="space-y-6">
            <label class="inline-flex items-center gap-3 text-sm font-bold text-slate-900 dark:text-white">
              <input v-model="notificationForm.enabled" type="checkbox" class="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500 dark:border-slate-700">
              启用管理员邮件通知
            </label>

            <div class="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
              <div class="space-y-2">
                <label for="notification-subject-prefix" class="text-sm font-bold text-slate-900 dark:text-white">邮件主题前缀</label>
                <input
                  id="notification-subject-prefix"
                  v-model="notificationForm.subjectPrefix"
                  type="text"
                  maxlength="80"
                  placeholder="例如：[Blog 通知]"
                  class="h-11 w-full rounded-xl border bg-slate-50 px-4 text-sm text-slate-900 outline-none transition-all focus:border-brand-600 focus:ring-4 focus:ring-brand-500/5 dark:bg-slate-950 dark:text-slate-100"
                  :class="getNotificationInputClass('subjectPrefix')"
                >
                <div class="flex items-center justify-between gap-3 text-xs">
                  <span class="text-rose-500 dark:text-rose-300">{{ getNotificationFieldError('subjectPrefix') }}</span>
                  <span class="text-slate-400">{{ notificationForm.subjectPrefix.trim().length }}/80</span>
                </div>
              </div>

              <article class="admin-theme-card rounded-[1.75rem] border border-slate-200 bg-slate-50/80 p-5 dark:border-slate-800 dark:bg-slate-950/40">
                <h3 class="text-sm font-bold text-slate-900 dark:text-white">通知范围</h3>
                <p class="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                  当前页面维护管理员待审核提醒、评论收到回复通知与留言待审核提醒。
                </p>
              </article>
            </div>

            <div class="space-y-4">
              <div class="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 class="text-sm font-bold text-slate-900 dark:text-white">管理员收件邮箱</h3>
                  <p class="text-xs text-slate-500 dark:text-slate-400">支持配置多个邮箱地址，空白输入会在保存时忽略。</p>
                </div>
                <button
                  type="button"
                  class="inline-flex items-center gap-2 rounded-xl border border-dashed border-slate-300 px-4 py-2.5 text-sm font-bold text-slate-700 transition-colors hover:border-brand-400 hover:text-brand-600 dark:border-slate-700 dark:text-slate-200 dark:hover:border-brand-500 dark:hover:text-brand-300"
                  @click="addNotificationRecipient"
                >
                  <Plus :size="16" />
                  新增邮箱
                </button>
              </div>

              <p v-if="getNotificationFieldError('adminRecipients')" class="text-xs text-rose-500 dark:text-rose-300">
                {{ getNotificationFieldError('adminRecipients') }}
              </p>

              <div v-if="notificationForm.adminRecipients.length" class="space-y-3">
                <div
                  v-for="(recipient, index) in notificationForm.adminRecipients"
                  :key="`notification-recipient-${index}`"
                  class="admin-theme-card rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-950/40"
                >
                  <div class="flex flex-col gap-3 lg:flex-row lg:items-start">
                    <div class="min-w-0 flex-1 space-y-2">
                      <label :for="`notification-recipient-${index}`" class="text-xs font-bold uppercase tracking-widest text-slate-400">收件邮箱 {{ index + 1 }}</label>
                      <input
                        :id="`notification-recipient-${index}`"
                        v-model="notificationForm.adminRecipients[index]"
                        type="email"
                        placeholder="admin@example.com"
                        class="h-11 w-full rounded-xl border bg-white px-4 text-sm text-slate-900 outline-none transition-all focus:border-brand-600 focus:ring-4 focus:ring-brand-500/5 dark:bg-slate-900 dark:text-slate-100"
                        :class="getNotificationInputClass(`adminRecipients.${index}`)"
                      >
                      <p v-if="getNotificationFieldError(`adminRecipients.${index}`)" class="text-xs text-rose-500 dark:text-rose-300">
                        {{ getNotificationFieldError(`adminRecipients.${index}`) }}
                      </p>
                    </div>

                    <button
                      type="button"
                      class="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 text-sm font-bold text-rose-600 transition-colors hover:border-rose-300 hover:bg-rose-100 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300"
                      @click="removeNotificationRecipient(index)"
                    >
                      <Trash2 :size="16" />
                      移除
                    </button>
                  </div>
                </div>
              </div>

              <div v-else class="admin-theme-card rounded-[1.75rem] border border-dashed border-slate-300 bg-slate-50/80 px-4 py-5 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-950/40 dark:text-slate-400">
                当前尚未配置管理员收件邮箱。
              </div>
            </div>

            <article class="admin-theme-card rounded-[1.75rem] border border-slate-200 bg-slate-50/80 p-5 dark:border-slate-800 dark:bg-slate-950/40">
              <div class="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div class="space-y-2">
                  <h3 class="text-sm font-bold text-slate-900 dark:text-white">测试发信</h3>
                  <p class="text-sm leading-6 text-slate-500 dark:text-slate-400">
                    当前测试邮件使用最近一次保存的配置，当前编辑中的修改内容不会参与发送。
                  </p>
                  <p class="text-xs leading-6 text-slate-500 dark:text-slate-400">
                    最近一次保存的配置包含 {{ savedNotificationRecipients.length }} 个管理员邮箱。
                  </p>
                </div>

                <button
                  type="button"
                  class="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 text-sm font-bold text-white shadow-lg shadow-brand-500/25 transition-all hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none dark:disabled:bg-slate-700 dark:disabled:text-slate-300"
                  :disabled="isTestEmailActionDisabled"
                  @click="sendNotificationTestEmailRequest"
                >
                  <LoaderCircle v-if="testEmailState === 'sending'" :size="16" class="animate-spin" />
                  <Mail v-else :size="16" />
                  {{ testEmailState === 'sending' ? '发送中...' : '发送测试邮件' }}
                </button>
              </div>

              <div class="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
                <div class="space-y-2">
                  <label for="notification-test-email-recipient" class="text-sm font-bold text-slate-900 dark:text-white">测试收件邮箱</label>
                  <select
                    id="notification-test-email-recipient"
                    v-model="testEmailRecipient"
                    class="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition-all focus:border-brand-600 focus:ring-4 focus:ring-brand-500/5 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                    :disabled="testEmailState === 'sending'"
                  >
                    <option value="">请选择已保存管理员邮箱</option>
                    <option
                      v-for="recipient in savedNotificationRecipients"
                      :key="recipient"
                      :value="recipient"
                    >
                      {{ recipient }}
                    </option>
                  </select>
                  <p v-if="testEmailErrors.recipient" class="text-xs text-rose-500 dark:text-rose-300">
                    {{ testEmailErrors.recipient }}
                  </p>
                </div>

                <div class="admin-theme-card rounded-[1.5rem] border border-dashed border-slate-300 bg-white/80 px-4 py-4 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-400">
                  <p class="font-bold text-slate-900 dark:text-white">已保存管理员邮箱</p>
                  <p v-if="savedNotificationRecipients.length" class="mt-2 leading-6">
                    {{ savedNotificationRecipients.join('、') }}
                  </p>
                  <p v-else class="mt-2 leading-6">
                    当前没有可用于测试发信的已保存管理员邮箱。
                  </p>
                </div>
              </div>

              <div
                v-if="testEmailMessage"
                class="mt-4 rounded-[1.5rem] border px-4 py-3 text-sm"
                :class="testEmailMessageClass"
              >
                {{ testEmailMessage }}
              </div>
            </article>
          </div>
        </section>

        <section class="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
          <article class="admin-theme-card rounded-[2.5rem] border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
            <div class="mb-6 flex items-center gap-3">
              <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50 text-violet-600 dark:bg-violet-950/30 dark:text-violet-300">
                <Mail :size="22" />
              </div>
              <div>
                <h2 class="text-lg font-black text-slate-900 dark:text-white">SMTP 服务</h2>
                <p class="text-sm text-slate-500 dark:text-slate-400">填写发件主机、端口、身份信息与回复邮箱。</p>
              </div>
            </div>

            <div class="grid gap-6 md:grid-cols-2">
              <div class="space-y-2">
                <label for="notification-smtp-host" class="text-sm font-bold text-slate-900 dark:text-white">SMTP 主机</label>
                <input
                  id="notification-smtp-host"
                  v-model="notificationForm.smtp.host"
                  type="text"
                  placeholder="smtp.example.com"
                  class="h-11 w-full rounded-xl border bg-slate-50 px-4 text-sm text-slate-900 outline-none transition-all focus:border-brand-600 focus:ring-4 focus:ring-brand-500/5 dark:bg-slate-950 dark:text-slate-100"
                  :class="getNotificationInputClass('smtp.host')"
                >
                <p v-if="getNotificationFieldError('smtp.host')" class="text-xs text-rose-500 dark:text-rose-300">
                  {{ getNotificationFieldError('smtp.host') }}
                </p>
              </div>

              <div class="space-y-2">
                <label for="notification-smtp-port" class="text-sm font-bold text-slate-900 dark:text-white">SMTP 端口</label>
                <input
                  id="notification-smtp-port"
                  v-model.number="notificationForm.smtp.port"
                  type="number"
                  min="1"
                  max="65535"
                  class="h-11 w-full rounded-xl border bg-slate-50 px-4 text-sm text-slate-900 outline-none transition-all focus:border-brand-600 focus:ring-4 focus:ring-brand-500/5 dark:bg-slate-950 dark:text-slate-100"
                  :class="getNotificationInputClass('smtp.port')"
                >
                <p v-if="getNotificationFieldError('smtp.port')" class="text-xs text-rose-500 dark:text-rose-300">
                  {{ getNotificationFieldError('smtp.port') }}
                </p>
              </div>

              <div class="space-y-2">
                <label for="notification-smtp-username" class="text-sm font-bold text-slate-900 dark:text-white">SMTP 用户名</label>
                <input
                  id="notification-smtp-username"
                  v-model="notificationForm.smtp.username"
                  type="text"
                  placeholder="notify@example.com"
                  class="h-11 w-full rounded-xl border bg-slate-50 px-4 text-sm text-slate-900 outline-none transition-all focus:border-brand-600 focus:ring-4 focus:ring-brand-500/5 dark:bg-slate-950 dark:text-slate-100"
                  :class="getNotificationInputClass('smtp.username')"
                >
                <p v-if="getNotificationFieldError('smtp.username')" class="text-xs text-rose-500 dark:text-rose-300">
                  {{ getNotificationFieldError('smtp.username') }}
                </p>
              </div>

              <div class="space-y-2">
                <label for="notification-smtp-from-name" class="text-sm font-bold text-slate-900 dark:text-white">发件人名称</label>
                <input
                  id="notification-smtp-from-name"
                  v-model="notificationForm.smtp.fromName"
                  type="text"
                  maxlength="80"
                  placeholder="Blog Notify"
                  class="h-11 w-full rounded-xl border bg-slate-50 px-4 text-sm text-slate-900 outline-none transition-all focus:border-brand-600 focus:ring-4 focus:ring-brand-500/5 dark:bg-slate-950 dark:text-slate-100"
                  :class="getNotificationInputClass('smtp.fromName')"
                >
              </div>

              <div class="space-y-2">
                <label for="notification-smtp-from-email" class="text-sm font-bold text-slate-900 dark:text-white">发件邮箱</label>
                <input
                  id="notification-smtp-from-email"
                  v-model="notificationForm.smtp.fromEmail"
                  type="email"
                  placeholder="notify@example.com"
                  class="h-11 w-full rounded-xl border bg-slate-50 px-4 text-sm text-slate-900 outline-none transition-all focus:border-brand-600 focus:ring-4 focus:ring-brand-500/5 dark:bg-slate-950 dark:text-slate-100"
                  :class="getNotificationInputClass('smtp.fromEmail')"
                >
                <p v-if="getNotificationFieldError('smtp.fromEmail')" class="text-xs text-rose-500 dark:text-rose-300">
                  {{ getNotificationFieldError('smtp.fromEmail') }}
                </p>
              </div>

              <div class="space-y-2">
                <label for="notification-smtp-reply-to-email" class="text-sm font-bold text-slate-900 dark:text-white">回复邮箱</label>
                <input
                  id="notification-smtp-reply-to-email"
                  v-model="notificationForm.smtp.replyToEmail"
                  type="email"
                  placeholder="reply@example.com"
                  class="h-11 w-full rounded-xl border bg-slate-50 px-4 text-sm text-slate-900 outline-none transition-all focus:border-brand-600 focus:ring-4 focus:ring-brand-500/5 dark:bg-slate-950 dark:text-slate-100"
                  :class="getNotificationInputClass('smtp.replyToEmail')"
                >
                <p v-if="getNotificationFieldError('smtp.replyToEmail')" class="text-xs text-rose-500 dark:text-rose-300">
                  {{ getNotificationFieldError('smtp.replyToEmail') }}
                </p>
              </div>
            </div>

            <div class="mt-6 space-y-4">
              <label class="inline-flex items-center gap-3 text-sm font-bold text-slate-900 dark:text-white">
                <input v-model="notificationForm.smtp.secure" type="checkbox" class="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500 dark:border-slate-700">
                使用 SSL 或 TLS 连接
              </label>

              <div class="space-y-2">
                <label for="notification-smtp-password" class="text-sm font-bold text-slate-900 dark:text-white">SMTP 密码</label>
                <input
                  id="notification-smtp-password"
                  v-model="notificationForm.smtp.password"
                  type="password"
                  autocomplete="new-password"
                  placeholder="留空表示保持当前设置"
                  class="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition-all focus:border-brand-600 focus:ring-4 focus:ring-brand-500/5 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                >
                <div class="flex flex-wrap items-center gap-3 text-xs">
                  <span class="text-slate-400">{{ notificationPasswordStateText }}</span>
                  <button
                    v-if="notificationForm.smtp.passwordConfigured && !notificationForm.smtp.password.trim()"
                    type="button"
                    class="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 text-xs font-bold text-slate-600 transition-colors hover:border-slate-300 hover:text-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:text-white"
                    @click="clearNotificationPassword"
                  >
                    清除已保存密码
                  </button>
                  <button
                    v-else-if="savedNotificationSnapshot.smtp.passwordConfigured && !notificationForm.smtp.passwordConfigured && !notificationForm.smtp.password.trim()"
                    type="button"
                    class="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 text-xs font-bold text-slate-600 transition-colors hover:border-slate-300 hover:text-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:text-white"
                    @click="restoreNotificationPassword"
                  >
                    保留已保存密码
                  </button>
                </div>
              </div>
            </div>
          </article>

          <article class="admin-theme-card rounded-[2.5rem] border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
            <div class="mb-6 flex items-center gap-3">
              <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-300">
                <BellRing :size="22" />
              </div>
              <div>
                <h2 class="text-lg font-black text-slate-900 dark:text-white">事件开关</h2>
                <p class="text-sm text-slate-500 dark:text-slate-400">维护管理员待审核提醒与评论回复通知事件。</p>
              </div>
            </div>

            <div class="space-y-4">
              <label class="flex items-start gap-3 rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-4 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-200">
                <input v-model="notificationForm.events.postCommentCreated" type="checkbox" class="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500 dark:border-slate-700">
                <span>
                  <strong class="font-bold text-slate-900 dark:text-white">新评论待审核</strong>
                  <span class="mt-1 block text-xs leading-6 text-slate-500 dark:text-slate-400">文章评论进入审核队列时向管理员发信。</span>
                </span>
              </label>

              <label class="flex items-start gap-3 rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-4 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-200">
                <input v-model="notificationForm.events.postCommentReply" type="checkbox" class="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500 dark:border-slate-700">
                <span>
                  <strong class="font-bold text-slate-900 dark:text-white">评论收到回复</strong>
                  <span class="mt-1 block text-xs leading-6 text-slate-500 dark:text-slate-400">回复评论审核通过后向上级评论作者发信。</span>
                </span>
              </label>

              <label class="flex items-start gap-3 rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-4 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-200">
                <input v-model="notificationForm.events.guestbookCreated" type="checkbox" class="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500 dark:border-slate-700">
                <span>
                  <strong class="font-bold text-slate-900 dark:text-white">新留言待审核</strong>
                  <span class="mt-1 block text-xs leading-6 text-slate-500 dark:text-slate-400">留言写入审核队列时向管理员发信。</span>
                </span>
              </label>
            </div>

            <p class="mt-6 text-xs leading-6 text-slate-500 dark:text-slate-400">
              评论回复通知会在回复审核通过后发送给上级评论作者。
            </p>
          </article>
        </section>

        <section class="admin-theme-card flex flex-col gap-4 rounded-[2rem] border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between">
          <div class="space-y-1">
            <p class="text-sm font-bold text-slate-900 dark:text-white">{{ notificationSaveBadge.label }}</p>
            <p class="text-sm text-slate-500 dark:text-slate-400">{{ notificationBottomStatusText }}</p>
          </div>

          <div class="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              class="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-100 dark:hover:border-slate-600 dark:hover:bg-slate-800"
              :disabled="isNotificationSaveDisabled"
              @click="resetNotificationForm"
            >
              <RotateCcw :size="16" />
              重置本页
            </button>
            <button
              type="button"
              class="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 text-sm font-bold text-white shadow-lg shadow-brand-500/25 transition-all hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none dark:disabled:bg-slate-700 dark:disabled:text-slate-300"
              :disabled="isNotificationSaveDisabled"
              @click="saveNotificationSettings"
            >
              <LoaderCircle v-if="notificationSaveState === 'saving'" :size="16" class="animate-spin" />
              <Save v-else :size="16" />
              {{ notificationSaveState === 'saving' ? '保存中...' : '保存修改' }}
            </button>
          </div>
        </section>
      </template>

      <section
        v-else
        class="admin-theme-card rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
      >
        <div class="flex items-start gap-3 text-slate-500 dark:text-slate-300">
          <Settings2 :size="18" class="mt-0.5 shrink-0" />
          <div class="space-y-2">
            <h2 class="text-lg font-black text-slate-900 dark:text-white">当前模块暂无管理表单</h2>
            <p class="text-sm leading-6">当前页面已保留模块级状态控制，后续新增模块时可继续按相同方式挂接独立配置页面。</p>
          </div>
        </div>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import {
  AlertCircle,
  ArrowLeft,
  BellRing,
  CircleOff,
  Download,
  LoaderCircle,
  Mail,
  Package,
  Plus,
  Power,
  RotateCcw,
  Save,
  Settings2,
  ShieldCheck,
  Trash2,
} from '~/utils/admin-lucide-icons';
import { cloneSiteSettings, DEFAULT_SITE_SETTINGS } from '~/constants/site-settings';
import { useAppToast } from '~/composables/useAppToast';
import type { AdminSettingsSaveState, SiteNotificationSettings } from '~/types/admin-settings';
import type { NotificationFormErrors } from '~/utils/notification-form';
import {
  validateNotificationSettingsForm,
  validateNotificationTestEmailForm,
} from '~/utils/notification-form';
import { resolveRequestErrorMessage } from '~/utils/request-error';
import type { AdminModuleSummary } from '~~/shared/types/module-center';

definePageMeta({ layout: 'admin' });

type LoadState = 'loading' | 'ready' | 'error';

type ModuleAction = 'install' | 'enable' | 'disable' | 'uninstall';

const notificationModuleKey = 'notification-center';
const notificationSettingsEndpoint = '/api/admin/modules/notification-center/settings';
const notificationTestEndpoint = '/api/admin/modules/notification-center/test';

const route = useRoute();
const { addToast } = useAppToast();

const moduleInfo = ref<AdminModuleSummary | null>(null);
const pageState = ref<LoadState>('loading');
const pageErrorMessage = ref('');
const pendingModuleAction = ref<ModuleAction | ''>('');

const notificationForm = ref<SiteNotificationSettings>(cloneNotificationSettings());
const savedNotificationSnapshot = ref<SiteNotificationSettings>(cloneNotificationSettings());
const notificationFieldErrors = ref<NotificationFormErrors>({});
const notificationSaveState = ref<AdminSettingsSaveState>('saved');
const notificationFeedbackMessage = ref('');
const notificationFeedbackTone = ref<'success' | 'error'>('success');

const testEmailRecipient = ref('');
const testEmailErrors = ref<NotificationFormErrors>({});
const testEmailState = ref<'idle' | 'sending' | 'success' | 'error'>('idle');
const testEmailMessage = ref('');

const moduleKey = computed(() => typeof route.params.moduleKey === 'string' ? route.params.moduleKey : '');
const isNotificationModule = computed(() => moduleKey.value === notificationModuleKey);
const fallbackModuleName = computed(() => (moduleKey.value === notificationModuleKey ? '邮件通知' : moduleKey.value));

const notificationHasUnsavedChanges = computed(() => (
  JSON.stringify(notificationForm.value) !== JSON.stringify(savedNotificationSnapshot.value)
));

const isNotificationSaveDisabled = computed(() => (
  notificationSaveState.value === 'saving' || !notificationHasUnsavedChanges.value
));

const notificationBottomStatusText = computed(() => {
  if (notificationSaveState.value === 'saving') {
    return '页面正在写入当前修改，请稍候。';
  }

  if (notificationSaveState.value === 'dirty') {
    return '存在尚未保存的修改，保存后会更新邮件通知配置。';
  }

  if (notificationSaveState.value === 'error') {
    return '表单中仍有需要修正的内容。';
  }

  return '当前页面内容与最近一次保存结果一致。';
});

const notificationSaveBadge = computed(() => {
  if (notificationSaveState.value === 'dirty') {
    return {
      label: '未保存',
      icon: AlertCircle,
      badgeClass: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200',
    };
  }

  if (notificationSaveState.value === 'saving') {
    return {
      label: '保存中',
      icon: LoaderCircle,
      badgeClass: 'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/40 dark:bg-sky-950/30 dark:text-sky-200',
    };
  }

  if (notificationSaveState.value === 'error') {
    return {
      label: '未保存',
      icon: AlertCircle,
      badgeClass: 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-200',
    };
  }

  return {
    label: '已保存',
    icon: ShieldCheck,
    badgeClass: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-200',
  };
});

const notificationPasswordStateText = computed(() => {
  if (notificationForm.value.smtp.password.trim()) {
    return '保存后会写入新的 SMTP 密码。';
  }

  if (notificationForm.value.smtp.passwordConfigured) {
    return '当前已保存 SMTP 密码，留空表示保持原密码。';
  }

  if (savedNotificationSnapshot.value.smtp.passwordConfigured) {
    return '已标记为清除 SMTP 密码，保存后生效。';
  }

  return '当前尚未保存 SMTP 密码。';
});

const savedNotificationRecipients = computed(() => (
  savedNotificationSnapshot.value.adminRecipients
    .map((item) => item.trim())
    .filter(Boolean)
));

const isTestEmailActionDisabled = computed(() => (
  testEmailState.value === 'sending' || savedNotificationRecipients.value.length === 0
));

const testEmailMessageClass = computed(() => {
  if (testEmailState.value === 'success') {
    return 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-200';
  }

  if (testEmailState.value === 'error') {
    return 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-200';
  }

  return 'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-300';
});

await refreshModulePage();

watch(
  notificationForm,
  () => {
    if (notificationSaveState.value === 'saving') {
      return;
    }

    if (notificationSaveState.value === 'error') {
      validateNotificationForm();
    }

    notificationFeedbackMessage.value = '';
    notificationFeedbackTone.value = 'success';
    notificationSaveState.value = notificationHasUnsavedChanges.value ? 'dirty' : 'saved';
  },
  { deep: true },
);

watch(testEmailRecipient, () => {
  testEmailErrors.value = {};

  if (testEmailState.value === 'error') {
    testEmailState.value = 'idle';
    testEmailMessage.value = '';
  }
});

watch(savedNotificationRecipients, (recipients) => {
  if (testEmailRecipient.value && !recipients.includes(testEmailRecipient.value)) {
    testEmailRecipient.value = '';
  }
});

watch(moduleKey, async (value, previousValue) => {
  if (!value || value === previousValue) {
    return;
  }

  await refreshModulePage();
});

function cloneNotificationSettings(
  value: SiteNotificationSettings = cloneSiteSettings(DEFAULT_SITE_SETTINGS).notification,
): SiteNotificationSettings {
  return {
    ...value,
    adminRecipients: [...value.adminRecipients],
    smtp: { ...value.smtp },
    events: { ...value.events },
  };
}

function formatTimestamp(value: string | null) {
  if (!value) {
    return '尚未记录';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('zh-CN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function getNotificationFieldError(field: string) {
  return notificationFieldErrors.value[field] || '';
}

function getNotificationInputClass(field: string) {
  return getNotificationFieldError(field)
    ? 'border-rose-300 focus:border-rose-500 dark:border-rose-800'
    : 'border-slate-200/80 dark:border-slate-700/80';
}

function validateNotificationForm() {
  notificationFieldErrors.value = validateNotificationSettingsForm(notificationForm.value);
  return Object.keys(notificationFieldErrors.value).length === 0;
}

function readActionLabel(action: ModuleAction) {
  if (action === 'install') {
    return '安装模块';
  }

  if (action === 'enable') {
    return '启用模块';
  }

  if (action === 'disable') {
    return '停用模块';
  }

  return '卸载模块';
}

function readActionSuccessMessage(action: ModuleAction) {
  const moduleName = moduleInfo.value?.name || fallbackModuleName.value;

  if (action === 'install') {
    return `${moduleName}已安装并启用`;
  }

  if (action === 'enable') {
    return `${moduleName}已启用`;
  }

  if (action === 'disable') {
    return `${moduleName}已停用`;
  }

  return `${moduleName}已卸载`;
}

async function refreshModulePage() {
  if (!moduleKey.value) {
    pageState.value = 'error';
    pageErrorMessage.value = '模块键名无效';
    return;
  }

  pageState.value = 'loading';
  pageErrorMessage.value = '';

  try {
    const response = await $fetch<AdminModuleSummary>(`/api/admin/modules/${moduleKey.value}`);
    moduleInfo.value = response;

    if (response.key === notificationModuleKey) {
      const settings = await $fetch<SiteNotificationSettings>(notificationSettingsEndpoint);
      const nextSettings = cloneNotificationSettings(settings);
      notificationForm.value = nextSettings;
      savedNotificationSnapshot.value = cloneNotificationSettings(nextSettings);
      notificationFieldErrors.value = {};
      notificationSaveState.value = 'saved';
      notificationFeedbackMessage.value = '';
      notificationFeedbackTone.value = 'success';
      resetNotificationTestState();
    }

    pageState.value = 'ready';
  }
  catch (error) {
    moduleInfo.value = null;
    pageState.value = 'error';
    pageErrorMessage.value = resolveRequestErrorMessage(error, '模块详情读取失败');
  }
}

async function submitModuleAction(action: ModuleAction) {
  if (!moduleInfo.value) {
    return;
  }

  pendingModuleAction.value = action;

  try {
    moduleInfo.value = await $fetch<AdminModuleSummary>(`/api/admin/modules/${moduleInfo.value.key}/${action}`, {
      method: 'POST',
    });

    const message = readActionSuccessMessage(action);
    addToast(message, 'success');
  }
  catch (error) {
    const message = resolveRequestErrorMessage(error, `${readActionLabel(action)}失败`);
    addToast(message, 'error');
  }
  finally {
    pendingModuleAction.value = '';
  }
}

function addNotificationRecipient() {
  notificationForm.value.adminRecipients = [
    ...notificationForm.value.adminRecipients,
    '',
  ];
}

function removeNotificationRecipient(index: number) {
  notificationForm.value.adminRecipients = notificationForm.value.adminRecipients.filter((_, itemIndex) => itemIndex !== index);
}

function clearNotificationPassword() {
  notificationForm.value.smtp.password = '';
  notificationForm.value.smtp.passwordConfigured = false;
}

function restoreNotificationPassword() {
  notificationForm.value.smtp.password = '';
  notificationForm.value.smtp.passwordConfigured = true;
}

function resetNotificationTestState(options: { preserveRecipient?: boolean } = {}) {
  if (!options.preserveRecipient) {
    testEmailRecipient.value = '';
  }

  testEmailErrors.value = {};
  testEmailState.value = 'idle';
  testEmailMessage.value = '';
}

function resetNotificationForm() {
  notificationForm.value = cloneNotificationSettings(savedNotificationSnapshot.value);
  notificationFieldErrors.value = {};
  notificationFeedbackMessage.value = '';
  notificationFeedbackTone.value = 'success';
  notificationSaveState.value = 'saved';
  resetNotificationTestState();
}

async function saveNotificationSettings() {
  notificationFeedbackMessage.value = '';

  if (!validateNotificationForm()) {
    notificationSaveState.value = 'error';
    notificationFeedbackTone.value = 'error';
    notificationFeedbackMessage.value = '保存未完成，请先修正表单内容。';
    addToast('请先修正表单校验项', 'warning');
    return;
  }

  notificationSaveState.value = 'saving';

  try {
    const savedSettings = await $fetch<SiteNotificationSettings>(notificationSettingsEndpoint, {
      method: 'PUT',
      body: cloneNotificationSettings(notificationForm.value),
    });
    const nextSettings = cloneNotificationSettings(savedSettings);
    notificationForm.value = nextSettings;
    savedNotificationSnapshot.value = cloneNotificationSettings(nextSettings);
    notificationSaveState.value = 'saved';
    notificationFeedbackTone.value = 'success';
    notificationFeedbackMessage.value = '邮件通知配置已保存';
    resetNotificationTestState({ preserveRecipient: savedNotificationRecipients.value.includes(testEmailRecipient.value) });
    addToast('邮件通知配置已保存', 'success');
  }
  catch (error) {
    const message = resolveRequestErrorMessage(error, '邮件通知配置保存失败');
    notificationSaveState.value = 'error';
    notificationFeedbackTone.value = 'error';
    notificationFeedbackMessage.value = message;
    addToast(message, 'error');
  }
}

async function sendNotificationTestEmailRequest() {
  testEmailErrors.value = validateNotificationTestEmailForm({
    recipient: testEmailRecipient.value,
    availableRecipients: savedNotificationRecipients.value,
  });

  if (Object.keys(testEmailErrors.value).length) {
    testEmailState.value = 'error';
    testEmailMessage.value = '';
    return;
  }

  testEmailState.value = 'sending';
  testEmailMessage.value = '';

  try {
    const response = await $fetch<{ message: string }>(notificationTestEndpoint, {
      method: 'POST',
      body: {
        recipient: testEmailRecipient.value,
      },
    });

    testEmailState.value = 'success';
    testEmailMessage.value = response.message;
    addToast(response.message, 'success');
  }
  catch (error) {
    const message = resolveRequestErrorMessage(error, '测试邮件发送失败');
    testEmailState.value = 'error';
    testEmailMessage.value = message;
    addToast(message, 'error');
  }
}

void formatTimestamp;
</script>
