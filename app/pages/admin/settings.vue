<template>
  <div class="space-y-8 pb-20">
    <UCard :ui="{ root: 'admin-theme-card rounded-[2rem] border-slate-200/80 dark:border-slate-700/80', body: 'p-5 sm:p-6' }">
      <div class="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div class="space-y-3">
          <div class="flex flex-wrap items-center gap-3">
            <h1 class="font-serif text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              系统设置
            </h1>
            <span
              class="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold"
              :class="saveStateMeta.badgeClass"
            >
              <component :is="saveStateMeta.icon" :size="14" :class="saveState === 'saving' ? 'animate-spin' : ''" />
              {{ saveStateMeta.label }}
            </span>
          </div>
          <p class="text-sm text-slate-500 dark:text-slate-400">{{ currentTabDescription }}</p>
          <div
            v-if="feedbackMessage"
            class="inline-flex max-w-full items-start gap-2 rounded-2xl border px-4 py-3 text-sm"
            :class="feedbackTone === 'error'
              ? 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-200'
              : 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-200'"
          >
            <UIcon v-if="feedbackTone === 'error'" name="i-lucide-alert-circle" class="mt-0.5 size-4 shrink-0" />
            <UIcon v-else name="i-lucide-shield-check" class="mt-0.5 size-4 shrink-0" />
            <span>{{ feedbackMessage }}</span>
          </div>
        </div>

        <div class="grid gap-3 sm:grid-cols-2 xl:w-[22rem]">
          <UButton
            color="neutral"
            variant="soft"
            icon="i-lucide-rotate-ccw"
            class="justify-center"
            :disabled="isActionDisabled"
            @click="resetForm"
          >
            重置本页
          </UButton>
          <UButton
            icon="i-lucide-save"
            class="justify-center"
            :loading="saveState === 'saving'"
            :disabled="isActionDisabled"
            @click="saveSettings"
          >
            {{ saveState === 'saving' ? '保存中...' : '保存修改' }}
          </UButton>
        </div>
      </div>
    </UCard>

    <div class="admin-theme-card flex flex-wrap items-center gap-3 rounded-2xl p-2">
      <button
        type="button"
        class="inline-flex items-center rounded-xl px-4 py-2 text-sm font-bold transition-all"
        :class="activeTab === 'site'
          ? 'bg-white text-brand-600 shadow-sm dark:bg-slate-800 dark:text-white'
          : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'"
        @click="activeTab = 'site'"
      >
        站点资料
      </button>
      <button
        type="button"
        class="inline-flex items-center rounded-xl px-4 py-2 text-sm font-bold transition-all"
        :class="activeTab === 'owner'
          ? 'bg-white text-brand-600 shadow-sm dark:bg-slate-800 dark:text-white'
          : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'"
        @click="activeTab = 'owner'"
      >
        站长资料
      </button>
      <button
        type="button"
        class="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition-all"
        :class="activeTab === 'socialLinks'
          ? 'bg-white text-brand-600 shadow-sm dark:bg-slate-800 dark:text-white'
          : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'"
        @click="activeTab = 'socialLinks'"
      >
        <span>社交链接</span>
        <span
          class="inline-flex h-6 min-w-6 items-center justify-center rounded-full px-2 text-[11px]"
          :class="activeTab === 'socialLinks'
            ? 'bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-300'
            : 'bg-slate-200/70 text-slate-500 dark:bg-slate-800 dark:text-slate-300'"
        >
          {{ form.socialLinks.length }}
        </span>
      </button>
      <button
        type="button"
        class="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition-all"
        :class="activeTab === 'navItems'
          ? 'bg-white text-brand-600 shadow-sm dark:bg-slate-800 dark:text-white'
          : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'"
        @click="activeTab = 'navItems'"
      >
        <span>顶部导航</span>
        <span
          class="inline-flex h-6 min-w-6 items-center justify-center rounded-full px-2 text-[11px]"
          :class="activeTab === 'navItems'
            ? 'bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-300'
            : 'bg-slate-200/70 text-slate-500 dark:bg-slate-800 dark:text-slate-300'"
        >
          {{ form.navItems.length }}
        </span>
      </button>
      <button
        type="button"
        class="inline-flex items-center rounded-xl px-4 py-2 text-sm font-bold transition-all"
        :class="activeTab === 'security'
          ? 'bg-white text-brand-600 shadow-sm dark:bg-slate-800 dark:text-white'
          : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'"
        @click="activeTab = 'security'"
      >
        安全策略
      </button>
      <button
        type="button"
        class="inline-flex items-center rounded-xl px-4 py-2 text-sm font-bold transition-all"
        :class="activeTab === 'footer'
          ? 'bg-white text-brand-600 shadow-sm dark:bg-slate-800 dark:text-white'
          : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'"
        @click="activeTab = 'footer'"
      >
        页脚与联系
      </button>
    </div>

    <div v-if="activeTab === 'site'" class="space-y-8">
      <section class="admin-theme-card rounded-[2.5rem] p-6 sm:p-8">
      <div class="mb-6 flex items-center gap-3">
        <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-300">
          <Globe2 :size="22" />
        </div>
        <div>
          <h2 class="text-lg font-black text-slate-900 dark:text-white">站点资料</h2>
          <p class="text-sm text-slate-500 dark:text-slate-400">维护站点名称、站点链接、简介与品牌标识。</p>
        </div>
      </div>

      <div class="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div class="space-y-6">
          <div class="space-y-2">
            <label for="site-name" class="text-sm font-bold text-slate-900 dark:text-white">站点名称</label>
            <input
              id="site-name"
              v-model="form.site.name"
              type="text"
              maxlength="40"
              placeholder="输入站点名称"
              class="h-11 w-full rounded-xl border bg-slate-50 px-4 text-sm text-slate-900 outline-none transition-all focus:border-brand-600 focus:ring-4 focus:ring-brand-500/5 dark:bg-slate-950 dark:text-slate-100"
              :class="getInputClass('site', 'name')"
            >
            <div class="flex items-center justify-between gap-3 text-xs">
              <span class="text-rose-500 dark:text-rose-300">{{ getFieldError('site', 'name') }}</span>
              <span class="text-slate-400">{{ form.site.name.trim().length }}/40</span>
            </div>
          </div>

          <div class="space-y-2">
            <label for="site-url" class="text-sm font-bold text-slate-900 dark:text-white">站点链接</label>
            <input
              id="site-url"
              v-model="form.site.url"
              type="url"
              placeholder="https://example.com"
              class="h-11 w-full rounded-xl border bg-slate-50 px-4 text-sm text-slate-900 outline-none transition-all focus:border-brand-600 focus:ring-4 focus:ring-brand-500/5 dark:bg-slate-950 dark:text-slate-100"
              :class="getInputClass('site', 'url')"
            >
            <p v-if="getFieldError('site', 'url')" class="text-xs text-rose-500 dark:text-rose-300">
              {{ getFieldError('site', 'url') }}
            </p>
          </div>

          <div class="space-y-2">
            <label for="site-description" class="text-sm font-bold text-slate-900 dark:text-white">站点简介</label>
            <textarea
              id="site-description"
              v-model="form.site.description"
              rows="5"
              maxlength="160"
              placeholder="简要介绍站点主题与写作方向"
              class="w-full rounded-2xl border bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition-all focus:border-brand-600 focus:ring-4 focus:ring-brand-500/5 dark:bg-slate-950 dark:text-slate-100"
              :class="getInputClass('site', 'description')"
            />
            <div class="flex items-center justify-between gap-3 text-xs">
              <span class="text-slate-400">用于首页侧栏与导航品牌区。</span>
              <span :class="getFieldError('site', 'description') ? 'text-rose-500 dark:text-rose-300' : 'text-slate-400'">
                {{ form.site.description.trim().length }}/160
              </span>
            </div>
            <p v-if="getFieldError('site', 'description')" class="text-xs text-rose-500 dark:text-rose-300">
              {{ getFieldError('site', 'description') }}
            </p>
          </div>
        </div>

        <div class="admin-theme-card rounded-[2rem] border-dashed p-5">
          <div class="flex items-center gap-3">
            <div class="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-slate-500 shadow-sm dark:bg-slate-900 dark:text-slate-300">
              <ImagePlus :size="20" />
            </div>
            <div>
              <h3 class="text-sm font-bold text-slate-900 dark:text-white">站点 Logo</h3>
              <p class="text-xs text-slate-500 dark:text-slate-400">建议使用正方形 PNG、SVG 或 WebP</p>
            </div>
          </div>

          <div class="mt-5 overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <div v-if="siteLogoPreviewUrl" class="flex h-52 items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.12),_transparent_60%)] p-6">
              <img :src="siteLogoPreviewUrl" :alt="form.site.logoAlt" class="max-h-full max-w-full rounded-2xl object-contain">
            </div>
            <div v-else class="flex h-52 flex-col items-center justify-center gap-3 bg-slate-50 text-center dark:bg-slate-950">
              <div class="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                <ImagePlus :size="24" />
              </div>
              <div class="space-y-1">
                <p class="text-sm font-bold text-slate-900 dark:text-white">上传站点 Logo</p>
                <p class="text-xs text-slate-500 dark:text-slate-400">保存后会同步显示在导航品牌区</p>
              </div>
            </div>
          </div>

          <label class="mt-5 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-700">
            <Upload :size="16" />
            上传 Logo
            <input
              class="hidden"
              type="file"
              accept=".png,.svg,.webp,image/png,image/svg+xml,image/webp"
              @change="handleLogoChange"
            >
          </label>

          <p class="mt-3 text-xs text-slate-400">建议使用 2MB 以内的正方形图片。</p>
          <p v-if="uploadError.siteLogo" class="mt-2 text-xs text-rose-500 dark:text-rose-300">
            {{ uploadError.siteLogo }}
          </p>
        </div>
      </div>
      </section>
    </div>

    <div v-else-if="activeTab === 'owner'" class="space-y-8">
      <section class="admin-theme-card rounded-[2.5rem] p-6 sm:p-8">
      <div class="mb-6 flex items-center gap-3">
        <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-600 dark:bg-sky-950/30 dark:text-sky-300">
          <UserRound :size="22" />
        </div>
        <div>
          <h2 class="text-lg font-black text-slate-900 dark:text-white">站长资料</h2>
          <p class="text-sm text-slate-500 dark:text-slate-400">维护头像、昵称、简介以及位置标识。</p>
        </div>
      </div>

      <div class="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div class="space-y-6">
          <div class="space-y-2">
            <label for="owner-name" class="text-sm font-bold text-slate-900 dark:text-white">站长昵称</label>
            <input
              id="owner-name"
              v-model="form.owner.name"
              type="text"
              maxlength="40"
              placeholder="输入展示昵称"
              class="h-11 w-full rounded-xl border bg-slate-50 px-4 text-sm text-slate-900 outline-none transition-all focus:border-brand-600 focus:ring-4 focus:ring-brand-500/5 dark:bg-slate-950 dark:text-slate-100"
              :class="getInputClass('owner', 'name')"
            >
            <div class="flex items-center justify-between gap-3 text-xs">
              <span class="text-rose-500 dark:text-rose-300">{{ getFieldError('owner', 'name') }}</span>
              <span class="text-slate-400">{{ form.owner.name.trim().length }}/40</span>
            </div>
          </div>

          <div class="space-y-2">
            <label for="owner-bio" class="text-sm font-bold text-slate-900 dark:text-white">个人简介</label>
            <textarea
              id="owner-bio"
              v-model="form.owner.bio"
              rows="5"
              maxlength="180"
              placeholder="用于首页侧栏与关于页的简介文案"
              class="w-full rounded-2xl border bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition-all focus:border-brand-600 focus:ring-4 focus:ring-brand-500/5 dark:bg-slate-950 dark:text-slate-100"
              :class="getInputClass('owner', 'bio')"
            />
            <div class="flex items-center justify-between gap-3 text-xs">
              <span class="text-slate-400">建议控制在 180 个字符以内。</span>
              <span :class="getFieldError('owner', 'bio') ? 'text-rose-500 dark:text-rose-300' : 'text-slate-400'">
                {{ form.owner.bio.trim().length }}/180
              </span>
            </div>
            <p v-if="getFieldError('owner', 'bio')" class="text-xs text-rose-500 dark:text-rose-300">
              {{ getFieldError('owner', 'bio') }}
            </p>
          </div>

          <div class="grid gap-6 md:grid-cols-2">
            <div class="space-y-2">
              <label for="owner-location" class="text-sm font-bold text-slate-900 dark:text-white">所在地点</label>
              <input
                id="owner-location"
                v-model="form.owner.location"
                type="text"
                maxlength="80"
                placeholder="例如：Shanghai, China"
                class="h-11 w-full rounded-xl border bg-slate-50 px-4 text-sm text-slate-900 outline-none transition-all focus:border-brand-600 focus:ring-4 focus:ring-brand-500/5 dark:bg-slate-950 dark:text-slate-100"
                :class="getInputClass('owner', 'location')"
              >
              <p v-if="getFieldError('owner', 'location')" class="text-xs text-rose-500 dark:text-rose-300">
                {{ getFieldError('owner', 'location') }}
              </p>
            </div>

            <div class="space-y-2">
              <label for="owner-tagline" class="text-sm font-bold text-slate-900 dark:text-white">身份短句</label>
              <input
                id="owner-tagline"
                v-model="form.owner.tagline"
                type="text"
                maxlength="80"
                placeholder="例如：Based in Earth"
                class="h-11 w-full rounded-xl border bg-slate-50 px-4 text-sm text-slate-900 outline-none transition-all focus:border-brand-600 focus:ring-4 focus:ring-brand-500/5 dark:bg-slate-950 dark:text-slate-100"
                :class="getInputClass('owner', 'tagline')"
              >
              <p v-if="getFieldError('owner', 'tagline')" class="text-xs text-rose-500 dark:text-rose-300">
                {{ getFieldError('owner', 'tagline') }}
              </p>
            </div>
          </div>
        </div>

        <div class="admin-theme-card rounded-[2rem] border-dashed p-5">
          <div class="flex items-center gap-3">
            <div class="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-slate-500 shadow-sm dark:bg-slate-900 dark:text-slate-300">
              <ImagePlus :size="20" />
            </div>
            <div>
              <h3 class="text-sm font-bold text-slate-900 dark:text-white">站长头像</h3>
              <p class="text-xs text-slate-500 dark:text-slate-400">用于首页侧栏头像展示</p>
            </div>
          </div>

          <div class="mt-5 overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <div v-if="ownerAvatarPreviewUrl" class="flex h-52 items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.16),_transparent_60%)] p-6">
              <img :src="ownerAvatarPreviewUrl" :alt="form.owner.name" class="h-36 w-36 rounded-full object-cover">
            </div>
            <div v-else class="flex h-52 flex-col items-center justify-center gap-3 bg-slate-50 text-center dark:bg-slate-950">
              <div class="flex h-14 w-14 items-center justify-center rounded-full bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                <UserRound :size="24" />
              </div>
              <div class="space-y-1">
                <p class="text-sm font-bold text-slate-900 dark:text-white">上传头像</p>
                <p class="text-xs text-slate-500 dark:text-slate-400">保存后会同步首页侧栏展示</p>
              </div>
            </div>
          </div>

          <label class="mt-5 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-700">
            <Upload :size="16" />
            上传头像
            <input
              class="hidden"
              type="file"
              accept=".png,.svg,.webp,image/png,image/svg+xml,image/webp"
              @change="handleOwnerAvatarChange"
            >
          </label>

          <p class="mt-3 text-xs text-slate-400">建议使用 2MB 以内的头像图片。</p>
          <p v-if="uploadError.ownerAvatar" class="mt-2 text-xs text-rose-500 dark:text-rose-300">
            {{ uploadError.ownerAvatar }}
          </p>
        </div>
      </div>
      </section>
    </div>

    <div v-else-if="activeTab === 'socialLinks'" class="space-y-8">
      <section class="admin-theme-card rounded-[2.5rem] p-6 sm:p-8">
      <div class="mb-6 flex items-center gap-3">
        <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50 text-violet-600 dark:bg-violet-950/30 dark:text-violet-300">
          <Share2 :size="22" />
        </div>
        <div>
          <h2 class="text-lg font-black text-slate-900 dark:text-white">社交链接</h2>
          <p class="text-sm text-slate-500 dark:text-slate-400">控制首页侧栏图标、显示名称与链接顺序。</p>
        </div>
      </div>

      <div class="space-y-4">
        <article
          v-for="(link, index) in form.socialLinks"
          :key="link.id"
          class="rounded-[1.75rem] border border-slate-200 bg-slate-50/80 p-5 dark:border-slate-800 dark:bg-slate-950/40"
        >
          <div class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_11rem_auto]">
            <div class="space-y-2">
              <label class="text-xs font-bold uppercase tracking-widest text-slate-400">显示名称</label>
              <input
                v-model="link.label"
                type="text"
                maxlength="30"
                placeholder="例如：Github"
                class="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition-all focus:border-brand-600 focus:ring-4 focus:ring-brand-500/5 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
              >
            </div>

            <div class="space-y-2">
              <label class="text-xs font-bold uppercase tracking-widest text-slate-400">链接地址</label>
              <input
                v-model="link.url"
                type="text"
                placeholder="https://example.com 或 mailto:hello@example.com"
                class="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition-all focus:border-brand-600 focus:ring-4 focus:ring-brand-500/5 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
              >
            </div>

            <div class="space-y-2">
              <label class="text-xs font-bold uppercase tracking-widest text-slate-400">图标</label>
              <select
                v-model="link.icon"
                class="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition-all focus:border-brand-600 focus:ring-4 focus:ring-brand-500/5 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
              >
                <option v-for="item in availableSocialIcons" :key="item.value" :value="item.value">
                  {{ item.label }}
                </option>
              </select>
            </div>

            <div class="flex flex-wrap items-end justify-between gap-3 lg:justify-end">
              <label class="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                <input v-model="link.enabled" type="checkbox" class="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500">
                启用
              </label>

              <div class="flex items-center gap-2">
                <button
                  type="button"
                  class="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition-colors hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:text-white"
                  :disabled="index === 0"
                  @click="moveSocialLink(link.id, 'up')"
                >
                  <ArrowUp :size="16" />
                </button>
                <button
                  type="button"
                  class="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition-colors hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:text-white"
                  :disabled="index === form.socialLinks.length - 1"
                  @click="moveSocialLink(link.id, 'down')"
                >
                  <ArrowDown :size="16" />
                </button>
                <button
                  type="button"
                  class="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 text-rose-600 transition-colors hover:border-rose-300 hover:bg-rose-100 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300"
                  @click="removeSocialLink(link.id)"
                >
                  <Trash2 :size="16" />
                </button>
              </div>
            </div>
          </div>
        </article>

        <button
          type="button"
          class="inline-flex items-center gap-2 rounded-xl border border-dashed border-slate-300 px-4 py-2.5 text-sm font-bold text-slate-700 transition-colors hover:border-brand-400 hover:text-brand-600 dark:border-slate-700 dark:text-slate-200 dark:hover:border-brand-500 dark:hover:text-brand-300"
          @click="addSocialLink"
        >
          <Plus :size="16" />
          新增链接
        </button>
      </div>
      </section>
    </div>

    <div v-else-if="activeTab === 'navItems'" class="space-y-8">
      <section class="admin-theme-card rounded-[2.5rem] p-6 sm:p-8">
      <div class="mb-6 flex items-center gap-3">
        <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-300">
          <Link2 :size="22" />
        </div>
        <div>
          <h2 class="text-lg font-black text-slate-900 dark:text-white">顶部导航</h2>
          <p class="text-sm text-slate-500 dark:text-slate-400">维护顶部导航项的名称、顺序、地址与打开方式。</p>
        </div>
      </div>

      <div class="space-y-4">
        <div class="flex items-center justify-between gap-3">
          <div>
            <h3 class="text-sm font-bold text-slate-900 dark:text-white">顶部导航项</h3>
            <p class="text-xs text-slate-500 dark:text-slate-400">支持修改顶部导航名称、顺序、地址与新窗口打开。</p>
          </div>
        </div>

        <article
          v-for="(item, index) in form.navItems"
          :key="item.id"
          class="rounded-[1.75rem] border border-slate-200 bg-slate-50/80 p-5 dark:border-slate-800 dark:bg-slate-950/40"
        >
          <div class="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_auto]">
            <div class="space-y-2">
              <label class="text-xs font-bold uppercase tracking-widest text-slate-400">导航名称</label>
              <input
                v-model="item.label"
                type="text"
                maxlength="20"
                placeholder="例如：关于"
                class="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition-all focus:border-brand-600 focus:ring-4 focus:ring-brand-500/5 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
              >
            </div>

            <div class="space-y-2">
              <label class="text-xs font-bold uppercase tracking-widest text-slate-400">链接地址</label>
              <input
                v-model="item.href"
                type="text"
                placeholder="/about 或 https://example.com"
                class="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition-all focus:border-brand-600 focus:ring-4 focus:ring-brand-500/5 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
              >
            </div>

            <div class="flex flex-wrap items-end justify-between gap-3 xl:justify-end">
              <label class="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                <input v-model="item.enabled" type="checkbox" class="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500">
                启用
              </label>
              <label class="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                <input v-model="item.openInNewTab" type="checkbox" class="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500">
                新窗口
              </label>
              <div class="flex items-center gap-2">
                <button
                  type="button"
                  class="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition-colors hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:text-white"
                  :disabled="index === 0"
                  @click="moveNavItem(item.id, 'up')"
                >
                  <ArrowUp :size="16" />
                </button>
                <button
                  type="button"
                  class="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition-colors hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:text-white"
                  :disabled="index === form.navItems.length - 1"
                  @click="moveNavItem(item.id, 'down')"
                >
                  <ArrowDown :size="16" />
                </button>
                <button
                  type="button"
                  class="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 text-rose-600 transition-colors hover:border-rose-300 hover:bg-rose-100 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300"
                  @click="removeNavItem(item.id)"
                >
                  <Trash2 :size="16" />
                </button>
              </div>
            </div>
          </div>
        </article>

        <button
          type="button"
          class="inline-flex items-center gap-2 rounded-xl border border-dashed border-slate-300 px-4 py-2.5 text-sm font-bold text-slate-700 transition-colors hover:border-brand-400 hover:text-brand-600 dark:border-slate-700 dark:text-slate-200 dark:hover:border-brand-500 dark:hover:text-brand-300"
          @click="addNavItem"
        >
          <Plus :size="16" />
          新增导航
        </button>
      </div>
      </section>
    </div>

    <div v-else-if="activeTab === 'security'" class="space-y-8">
      <UCard :ui="{ root: 'admin-theme-card rounded-[2rem] border-slate-200/80 dark:border-slate-700/80', body: 'p-5 sm:p-6' }">
        <template #header>
          <div class="flex items-center gap-3">
            <div class="grid size-10 place-items-center rounded-2xl bg-primary-50 text-primary-600 dark:bg-primary-950 dark:text-primary-300">
              <UIcon name="i-lucide-sliders-horizontal" class="size-5" />
            </div>
            <div>
              <h2 class="text-lg font-black text-slate-900 dark:text-white">配置概览</h2>
              <p class="text-sm text-slate-500 dark:text-slate-400">常用开关集中显示，可与下方完整配置保持同步。</p>
            </div>
          </div>
        </template>
        <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <UFormField label="登录人机校验">
            <USwitch v-model="form.security.login.captchaEnabled" label="开启" />
          </UFormField>
          <UFormField label="评论人机校验">
            <USwitch v-model="form.security.comments.captchaEnabled" label="开启" />
          </UFormField>
          <UFormField label="留言人机校验">
            <USwitch v-model="form.security.guestbook.captchaEnabled" label="开启" />
          </UFormField>
          <UFormField label="友链人机校验">
            <USwitch v-model="form.security.linkApplications.captchaEnabled" label="开启" />
          </UFormField>
        </div>
      </UCard>

      <section class="admin-theme-card rounded-[2.5rem] p-6 sm:p-8">
        <div class="mb-6 flex items-center gap-3">
          <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-300">
            <ShieldCheck :size="22" />
          </div>
          <div>
            <h2 class="text-lg font-black text-slate-900 dark:text-white">安全策略</h2>
            <p class="text-sm text-slate-500 dark:text-slate-400">维护公开接口的人机校验、限流与登录保护参数。</p>
          </div>
        </div>

        <div class="space-y-2">
          <label for="security-turnstile-site-key" class="text-sm font-bold text-slate-900 dark:text-white">Turnstile Site Key</label>
          <input
            id="security-turnstile-site-key"
            v-model="form.security.turnstileSiteKey"
            type="text"
            placeholder="填写 Cloudflare Turnstile Site Key"
            class="h-11 w-full rounded-xl border bg-slate-50 px-4 text-sm text-slate-900 outline-none transition-all focus:border-brand-600 focus:ring-4 focus:ring-brand-500/5 dark:bg-slate-950 dark:text-slate-100"
            :class="getInputClass('security', 'turnstileSiteKey')"
          >
          <div class="flex items-center justify-between gap-3 text-xs">
            <span class="text-slate-400">登录、评论、留言或友链申请启用人机校验时需要填写。</span>
            <span class="text-rose-500 dark:text-rose-300">{{ getFieldError('security', 'turnstileSiteKey') }}</span>
          </div>
        </div>
      </section>

      <section class="admin-theme-card rounded-[2.5rem] p-6 sm:p-8">
        <div class="mb-6 flex items-center gap-3">
          <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-600 dark:bg-sky-950/30 dark:text-sky-300">
            <ShieldCheck :size="22" />
          </div>
          <div>
            <h2 class="text-lg font-black text-slate-900 dark:text-white">登录保护</h2>
            <p class="text-sm text-slate-500 dark:text-slate-400">控制后台登录的人机校验、失败次数与冷却时间。</p>
          </div>
        </div>

        <div class="space-y-6">
          <label class="inline-flex items-center gap-3 text-sm font-bold text-slate-900 dark:text-white">
            <input v-model="form.security.login.captchaEnabled" type="checkbox" class="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500 dark:border-slate-700">
            启用登录人机校验
          </label>

          <div class="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            <div class="space-y-2">
              <label for="security-login-window" class="text-sm font-bold text-slate-900 dark:text-white">时间窗口</label>
              <input id="security-login-window" v-model.number="form.security.login.rateLimit.windowSeconds" type="number" min="1" class="h-11 w-full rounded-xl border bg-slate-50 px-4 text-sm text-slate-900 outline-none transition-all focus:border-brand-600 focus:ring-4 focus:ring-brand-500/5 dark:bg-slate-950 dark:text-slate-100" :class="getInputClass('security', 'login.rateLimit.windowSeconds')">
              <p v-if="getFieldError('security', 'login.rateLimit.windowSeconds')" class="text-xs text-rose-500 dark:text-rose-300">{{ getFieldError('security', 'login.rateLimit.windowSeconds') }}</p>
            </div>
            <div class="space-y-2">
              <label for="security-login-ip" class="text-sm font-bold text-slate-900 dark:text-white">每个 IP 上限</label>
              <input id="security-login-ip" v-model.number="form.security.login.rateLimit.maxPerIp" type="number" min="1" class="h-11 w-full rounded-xl border bg-slate-50 px-4 text-sm text-slate-900 outline-none transition-all focus:border-brand-600 focus:ring-4 focus:ring-brand-500/5 dark:bg-slate-950 dark:text-slate-100" :class="getInputClass('security', 'login.rateLimit.maxPerIp')">
              <p v-if="getFieldError('security', 'login.rateLimit.maxPerIp')" class="text-xs text-rose-500 dark:text-rose-300">{{ getFieldError('security', 'login.rateLimit.maxPerIp') }}</p>
            </div>
            <div class="space-y-2">
              <label for="security-login-session" class="text-sm font-bold text-slate-900 dark:text-white">每个会话上限</label>
              <input id="security-login-session" v-model.number="form.security.login.rateLimit.maxPerSession" type="number" min="1" class="h-11 w-full rounded-xl border bg-slate-50 px-4 text-sm text-slate-900 outline-none transition-all focus:border-brand-600 focus:ring-4 focus:ring-brand-500/5 dark:bg-slate-950 dark:text-slate-100" :class="getInputClass('security', 'login.rateLimit.maxPerSession')">
              <p v-if="getFieldError('security', 'login.rateLimit.maxPerSession')" class="text-xs text-rose-500 dark:text-rose-300">{{ getFieldError('security', 'login.rateLimit.maxPerSession') }}</p>
            </div>
            <div class="space-y-2">
              <label for="security-login-failures" class="text-sm font-bold text-slate-900 dark:text-white">失败次数上限</label>
              <input id="security-login-failures" v-model.number="form.security.login.maxFailures" type="number" min="1" class="h-11 w-full rounded-xl border bg-slate-50 px-4 text-sm text-slate-900 outline-none transition-all focus:border-brand-600 focus:ring-4 focus:ring-brand-500/5 dark:bg-slate-950 dark:text-slate-100" :class="getInputClass('security', 'login.maxFailures')">
              <p v-if="getFieldError('security', 'login.maxFailures')" class="text-xs text-rose-500 dark:text-rose-300">{{ getFieldError('security', 'login.maxFailures') }}</p>
            </div>
            <div class="space-y-2">
              <label for="security-login-cooldown" class="text-sm font-bold text-slate-900 dark:text-white">冷却时间</label>
              <input id="security-login-cooldown" v-model.number="form.security.login.cooldownSeconds" type="number" min="1" class="h-11 w-full rounded-xl border bg-slate-50 px-4 text-sm text-slate-900 outline-none transition-all focus:border-brand-600 focus:ring-4 focus:ring-brand-500/5 dark:bg-slate-950 dark:text-slate-100" :class="getInputClass('security', 'login.cooldownSeconds')">
              <p v-if="getFieldError('security', 'login.cooldownSeconds')" class="text-xs text-rose-500 dark:text-rose-300">{{ getFieldError('security', 'login.cooldownSeconds') }}</p>
            </div>
          </div>
        </div>
      </section>

      <section class="grid gap-6 xl:grid-cols-2">
        <article class="admin-theme-card rounded-[2.5rem] p-6 sm:p-8">
          <div class="mb-6 flex items-center gap-3">
            <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50 text-violet-600 dark:bg-violet-950/30 dark:text-violet-300">
              <ShieldCheck :size="22" />
            </div>
            <div>
              <h2 class="text-lg font-black text-slate-900 dark:text-white">评论提交</h2>
              <p class="text-sm text-slate-500 dark:text-slate-400">控制公开评论接口的校验与频率。</p>
            </div>
          </div>

          <div class="space-y-6">
            <label class="inline-flex items-center gap-3 text-sm font-bold text-slate-900 dark:text-white">
              <input v-model="form.security.comments.captchaEnabled" type="checkbox" class="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500 dark:border-slate-700">
              启用评论人机校验
            </label>

            <div class="grid gap-6 md:grid-cols-3">
              <div class="space-y-2">
                <label for="security-comments-window" class="text-sm font-bold text-slate-900 dark:text-white">时间窗口</label>
                <input id="security-comments-window" v-model.number="form.security.comments.rateLimit.windowSeconds" type="number" min="1" class="h-11 w-full rounded-xl border bg-slate-50 px-4 text-sm text-slate-900 outline-none transition-all focus:border-brand-600 focus:ring-4 focus:ring-brand-500/5 dark:bg-slate-950 dark:text-slate-100" :class="getInputClass('security', 'comments.rateLimit.windowSeconds')">
                <p v-if="getFieldError('security', 'comments.rateLimit.windowSeconds')" class="text-xs text-rose-500 dark:text-rose-300">{{ getFieldError('security', 'comments.rateLimit.windowSeconds') }}</p>
              </div>
              <div class="space-y-2">
                <label for="security-comments-ip" class="text-sm font-bold text-slate-900 dark:text-white">每个 IP 上限</label>
                <input id="security-comments-ip" v-model.number="form.security.comments.rateLimit.maxPerIp" type="number" min="1" class="h-11 w-full rounded-xl border bg-slate-50 px-4 text-sm text-slate-900 outline-none transition-all focus:border-brand-600 focus:ring-4 focus:ring-brand-500/5 dark:bg-slate-950 dark:text-slate-100" :class="getInputClass('security', 'comments.rateLimit.maxPerIp')">
                <p v-if="getFieldError('security', 'comments.rateLimit.maxPerIp')" class="text-xs text-rose-500 dark:text-rose-300">{{ getFieldError('security', 'comments.rateLimit.maxPerIp') }}</p>
              </div>
              <div class="space-y-2">
                <label for="security-comments-session" class="text-sm font-bold text-slate-900 dark:text-white">每个会话上限</label>
                <input id="security-comments-session" v-model.number="form.security.comments.rateLimit.maxPerSession" type="number" min="1" class="h-11 w-full rounded-xl border bg-slate-50 px-4 text-sm text-slate-900 outline-none transition-all focus:border-brand-600 focus:ring-4 focus:ring-brand-500/5 dark:bg-slate-950 dark:text-slate-100" :class="getInputClass('security', 'comments.rateLimit.maxPerSession')">
                <p v-if="getFieldError('security', 'comments.rateLimit.maxPerSession')" class="text-xs text-rose-500 dark:text-rose-300">{{ getFieldError('security', 'comments.rateLimit.maxPerSession') }}</p>
              </div>
            </div>
          </div>
        </article>

        <article class="admin-theme-card rounded-[2.5rem] p-6 sm:p-8">
          <div class="mb-6 flex items-center gap-3">
            <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-300">
              <ShieldCheck :size="22" />
            </div>
            <div>
              <h2 class="text-lg font-black text-slate-900 dark:text-white">留言提交</h2>
              <p class="text-sm text-slate-500 dark:text-slate-400">控制留言接口的校验与频率。</p>
            </div>
          </div>

          <div class="space-y-6">
            <label class="inline-flex items-center gap-3 text-sm font-bold text-slate-900 dark:text-white">
              <input v-model="form.security.guestbook.captchaEnabled" type="checkbox" class="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500 dark:border-slate-700">
              启用留言人机校验
            </label>

            <div class="grid gap-6 md:grid-cols-3">
              <div class="space-y-2">
                <label for="security-guestbook-window" class="text-sm font-bold text-slate-900 dark:text-white">时间窗口</label>
                <input id="security-guestbook-window" v-model.number="form.security.guestbook.rateLimit.windowSeconds" type="number" min="1" class="h-11 w-full rounded-xl border bg-slate-50 px-4 text-sm text-slate-900 outline-none transition-all focus:border-brand-600 focus:ring-4 focus:ring-brand-500/5 dark:bg-slate-950 dark:text-slate-100" :class="getInputClass('security', 'guestbook.rateLimit.windowSeconds')">
                <p v-if="getFieldError('security', 'guestbook.rateLimit.windowSeconds')" class="text-xs text-rose-500 dark:text-rose-300">{{ getFieldError('security', 'guestbook.rateLimit.windowSeconds') }}</p>
              </div>
              <div class="space-y-2">
                <label for="security-guestbook-ip" class="text-sm font-bold text-slate-900 dark:text-white">每个 IP 上限</label>
                <input id="security-guestbook-ip" v-model.number="form.security.guestbook.rateLimit.maxPerIp" type="number" min="1" class="h-11 w-full rounded-xl border bg-slate-50 px-4 text-sm text-slate-900 outline-none transition-all focus:border-brand-600 focus:ring-4 focus:ring-brand-500/5 dark:bg-slate-950 dark:text-slate-100" :class="getInputClass('security', 'guestbook.rateLimit.maxPerIp')">
                <p v-if="getFieldError('security', 'guestbook.rateLimit.maxPerIp')" class="text-xs text-rose-500 dark:text-rose-300">{{ getFieldError('security', 'guestbook.rateLimit.maxPerIp') }}</p>
              </div>
              <div class="space-y-2">
                <label for="security-guestbook-session" class="text-sm font-bold text-slate-900 dark:text-white">每个会话上限</label>
                <input id="security-guestbook-session" v-model.number="form.security.guestbook.rateLimit.maxPerSession" type="number" min="1" class="h-11 w-full rounded-xl border bg-slate-50 px-4 text-sm text-slate-900 outline-none transition-all focus:border-brand-600 focus:ring-4 focus:ring-brand-500/5 dark:bg-slate-950 dark:text-slate-100" :class="getInputClass('security', 'guestbook.rateLimit.maxPerSession')">
                <p v-if="getFieldError('security', 'guestbook.rateLimit.maxPerSession')" class="text-xs text-rose-500 dark:text-rose-300">{{ getFieldError('security', 'guestbook.rateLimit.maxPerSession') }}</p>
              </div>
            </div>
          </div>
        </article>

        <article class="admin-theme-card rounded-[2.5rem] p-6 sm:p-8">
          <div class="mb-6 flex items-center gap-3">
            <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-300">
              <ShieldCheck :size="22" />
            </div>
            <div>
              <h2 class="text-lg font-black text-slate-900 dark:text-white">友链申请</h2>
              <p class="text-sm text-slate-500 dark:text-slate-400">控制友链申请接口的校验与频率。</p>
            </div>
          </div>

          <div class="space-y-6">
            <label class="inline-flex items-center gap-3 text-sm font-bold text-slate-900 dark:text-white">
              <input v-model="form.security.linkApplications.captchaEnabled" type="checkbox" class="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500 dark:border-slate-700">
              启用友链申请人机校验
            </label>

            <div class="grid gap-6 md:grid-cols-3">
              <div class="space-y-2">
                <label for="security-links-window" class="text-sm font-bold text-slate-900 dark:text-white">时间窗口</label>
                <input id="security-links-window" v-model.number="form.security.linkApplications.rateLimit.windowSeconds" type="number" min="1" class="h-11 w-full rounded-xl border bg-slate-50 px-4 text-sm text-slate-900 outline-none transition-all focus:border-brand-600 focus:ring-4 focus:ring-brand-500/5 dark:bg-slate-950 dark:text-slate-100" :class="getInputClass('security', 'linkApplications.rateLimit.windowSeconds')">
                <p v-if="getFieldError('security', 'linkApplications.rateLimit.windowSeconds')" class="text-xs text-rose-500 dark:text-rose-300">{{ getFieldError('security', 'linkApplications.rateLimit.windowSeconds') }}</p>
              </div>
              <div class="space-y-2">
                <label for="security-links-ip" class="text-sm font-bold text-slate-900 dark:text-white">每个 IP 上限</label>
                <input id="security-links-ip" v-model.number="form.security.linkApplications.rateLimit.maxPerIp" type="number" min="1" class="h-11 w-full rounded-xl border bg-slate-50 px-4 text-sm text-slate-900 outline-none transition-all focus:border-brand-600 focus:ring-4 focus:ring-brand-500/5 dark:bg-slate-950 dark:text-slate-100" :class="getInputClass('security', 'linkApplications.rateLimit.maxPerIp')">
                <p v-if="getFieldError('security', 'linkApplications.rateLimit.maxPerIp')" class="text-xs text-rose-500 dark:text-rose-300">{{ getFieldError('security', 'linkApplications.rateLimit.maxPerIp') }}</p>
              </div>
              <div class="space-y-2">
                <label for="security-links-session" class="text-sm font-bold text-slate-900 dark:text-white">每个会话上限</label>
                <input id="security-links-session" v-model.number="form.security.linkApplications.rateLimit.maxPerSession" type="number" min="1" class="h-11 w-full rounded-xl border bg-slate-50 px-4 text-sm text-slate-900 outline-none transition-all focus:border-brand-600 focus:ring-4 focus:ring-brand-500/5 dark:bg-slate-950 dark:text-slate-100" :class="getInputClass('security', 'linkApplications.rateLimit.maxPerSession')">
                <p v-if="getFieldError('security', 'linkApplications.rateLimit.maxPerSession')" class="text-xs text-rose-500 dark:text-rose-300">{{ getFieldError('security', 'linkApplications.rateLimit.maxPerSession') }}</p>
              </div>
            </div>
          </div>
        </article>

        <article class="admin-theme-card rounded-[2.5rem] p-6 sm:p-8">
          <div class="mb-6 flex items-center gap-3">
            <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-300">
              <ShieldCheck :size="22" />
            </div>
            <div>
              <h2 class="text-lg font-black text-slate-900 dark:text-white">点赞提交</h2>
              <p class="text-sm text-slate-500 dark:text-slate-400">控制公开点赞接口的访问频率。</p>
            </div>
          </div>

          <div class="grid gap-6 md:grid-cols-3">
            <div class="space-y-2">
              <label for="security-likes-window" class="text-sm font-bold text-slate-900 dark:text-white">时间窗口</label>
              <input id="security-likes-window" v-model.number="form.security.likes.rateLimit.windowSeconds" type="number" min="1" class="h-11 w-full rounded-xl border bg-slate-50 px-4 text-sm text-slate-900 outline-none transition-all focus:border-brand-600 focus:ring-4 focus:ring-brand-500/5 dark:bg-slate-950 dark:text-slate-100" :class="getInputClass('security', 'likes.rateLimit.windowSeconds')">
              <p v-if="getFieldError('security', 'likes.rateLimit.windowSeconds')" class="text-xs text-rose-500 dark:text-rose-300">{{ getFieldError('security', 'likes.rateLimit.windowSeconds') }}</p>
            </div>
            <div class="space-y-2">
              <label for="security-likes-ip" class="text-sm font-bold text-slate-900 dark:text-white">每个 IP 上限</label>
              <input id="security-likes-ip" v-model.number="form.security.likes.rateLimit.maxPerIp" type="number" min="1" class="h-11 w-full rounded-xl border bg-slate-50 px-4 text-sm text-slate-900 outline-none transition-all focus:border-brand-600 focus:ring-4 focus:ring-brand-500/5 dark:bg-slate-950 dark:text-slate-100" :class="getInputClass('security', 'likes.rateLimit.maxPerIp')">
              <p v-if="getFieldError('security', 'likes.rateLimit.maxPerIp')" class="text-xs text-rose-500 dark:text-rose-300">{{ getFieldError('security', 'likes.rateLimit.maxPerIp') }}</p>
            </div>
            <div class="space-y-2">
              <label for="security-likes-session" class="text-sm font-bold text-slate-900 dark:text-white">每个会话上限</label>
              <input id="security-likes-session" v-model.number="form.security.likes.rateLimit.maxPerSession" type="number" min="1" class="h-11 w-full rounded-xl border bg-slate-50 px-4 text-sm text-slate-900 outline-none transition-all focus:border-brand-600 focus:ring-4 focus:ring-brand-500/5 dark:bg-slate-950 dark:text-slate-100" :class="getInputClass('security', 'likes.rateLimit.maxPerSession')">
              <p v-if="getFieldError('security', 'likes.rateLimit.maxPerSession')" class="text-xs text-rose-500 dark:text-rose-300">{{ getFieldError('security', 'likes.rateLimit.maxPerSession') }}</p>
            </div>
          </div>
        </article>
      </section>
    </div>


    <div v-else-if="activeTab === 'footer'" class="space-y-8">
      <section class="admin-theme-card rounded-[2.5rem] p-6 sm:p-8">
      <div class="mb-6 flex items-center gap-3">
        <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-300">
          <Mail :size="22" />
        </div>
        <div>
          <h2 class="text-lg font-black text-slate-900 dark:text-white">页脚与联系</h2>
          <p class="text-sm text-slate-500 dark:text-slate-400">维护联系邮箱、版权文案、备案信息与补充说明。</p>
        </div>
      </div>

      <div class="grid gap-6 lg:grid-cols-2">
        <div class="space-y-2">
          <label for="footer-contact-email" class="text-sm font-bold text-slate-900 dark:text-white">联系邮箱</label>
          <input
            id="footer-contact-email"
            v-model="form.footer.contactEmail"
            type="email"
            placeholder="hello@example.com"
            class="h-11 w-full rounded-xl border bg-slate-50 px-4 text-sm text-slate-900 outline-none transition-all focus:border-brand-600 focus:ring-4 focus:ring-brand-500/5 dark:bg-slate-950 dark:text-slate-100"
            :class="getInputClass('footer', 'contactEmail')"
          >
          <p v-if="getFieldError('footer', 'contactEmail')" class="text-xs text-rose-500 dark:text-rose-300">
            {{ getFieldError('footer', 'contactEmail') }}
          </p>
        </div>

        <div class="space-y-2">
          <label for="footer-copyright" class="text-sm font-bold text-slate-900 dark:text-white">版权文案</label>
          <input
            id="footer-copyright"
            v-model="form.footer.copyright"
            type="text"
            maxlength="120"
            placeholder="例如：© 2026 TechFlow. Built with Nuxt & Tailwind."
            class="h-11 w-full rounded-xl border bg-slate-50 px-4 text-sm text-slate-900 outline-none transition-all focus:border-brand-600 focus:ring-4 focus:ring-brand-500/5 dark:bg-slate-950 dark:text-slate-100"
            :class="getInputClass('footer', 'copyright')"
          >
          <p v-if="getFieldError('footer', 'copyright')" class="text-xs text-rose-500 dark:text-rose-300">
            {{ getFieldError('footer', 'copyright') }}
          </p>
        </div>

        <div class="space-y-2">
          <label for="footer-icp-text" class="text-sm font-bold text-slate-900 dark:text-white">备案号文本</label>
          <input
            id="footer-icp-text"
            v-model="form.footer.icpText"
            type="text"
            maxlength="60"
            placeholder="例如：京ICP备2026000000号-1"
            class="h-11 w-full rounded-xl border bg-slate-50 px-4 text-sm text-slate-900 outline-none transition-all focus:border-brand-600 focus:ring-4 focus:ring-brand-500/5 dark:bg-slate-950 dark:text-slate-100"
            :class="getInputClass('footer', 'icpText')"
          >
          <p v-if="getFieldError('footer', 'icpText')" class="text-xs text-rose-500 dark:text-rose-300">
            {{ getFieldError('footer', 'icpText') }}
          </p>
        </div>

        <div class="space-y-2">
          <label for="footer-icp-link" class="text-sm font-bold text-slate-900 dark:text-white">备案链接</label>
          <input
            id="footer-icp-link"
            v-model="form.footer.icpLink"
            type="url"
            placeholder="https://beian.miit.gov.cn/"
            class="h-11 w-full rounded-xl border bg-slate-50 px-4 text-sm text-slate-900 outline-none transition-all focus:border-brand-600 focus:ring-4 focus:ring-brand-500/5 dark:bg-slate-950 dark:text-slate-100"
            :class="getInputClass('footer', 'icpLink')"
          >
          <p v-if="getFieldError('footer', 'icpLink')" class="text-xs text-rose-500 dark:text-rose-300">
            {{ getFieldError('footer', 'icpLink') }}
          </p>
        </div>
      </div>

      <div class="mt-6 space-y-2">
        <label for="footer-note" class="text-sm font-bold text-slate-900 dark:text-white">补充说明</label>
        <textarea
          id="footer-note"
          v-model="form.footer.note"
          rows="4"
          maxlength="140"
          placeholder="例如：保存后首页侧栏、导航与全站页脚会同步更新。"
          class="w-full rounded-2xl border bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition-all focus:border-brand-600 focus:ring-4 focus:ring-brand-500/5 dark:bg-slate-950 dark:text-slate-100"
          :class="getInputClass('footer', 'note')"
        />
        <div class="flex items-center justify-between gap-3 text-xs">
          <span class="text-slate-400">该内容会显示在页脚备案信息下方。</span>
          <span :class="getFieldError('footer', 'note') ? 'text-rose-500 dark:text-rose-300' : 'text-slate-400'">
            {{ form.footer.note.trim().length }}/140
          </span>
        </div>
        <p v-if="getFieldError('footer', 'note')" class="text-xs text-rose-500 dark:text-rose-300">
          {{ getFieldError('footer', 'note') }}
        </p>
      </div>
      </section>
    </div>

    <section class="admin-theme-card flex flex-col gap-4 rounded-[2rem] p-5 sm:flex-row sm:items-center sm:justify-between">
      <div class="space-y-1">
        <p class="text-sm font-bold text-slate-900 dark:text-white">
          {{ saveStateMeta.label }}
        </p>
        <p class="text-sm text-slate-500 dark:text-slate-400">
          {{ bottomStatusText }}
        </p>
      </div>

      <div class="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          class="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-100 dark:hover:border-slate-600 dark:hover:bg-slate-800"
          :disabled="isActionDisabled"
          @click="resetForm"
        >
          <RotateCcw :size="16" />
          重置本页
        </button>
        <button
          type="button"
          class="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 text-sm font-bold text-white shadow-lg shadow-brand-500/25 transition-all hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none dark:disabled:bg-slate-700 dark:disabled:text-slate-300"
          :disabled="isActionDisabled"
          @click="saveSettings"
        >
          <LoaderCircle v-if="saveState === 'saving'" :size="16" class="animate-spin" />
          <Save v-else :size="16" />
          {{ saveState === 'saving' ? '保存中...' : '保存修改' }}
        </button>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  Globe2,
  ImagePlus,
  Link2,
  LoaderCircle,
  Mail,
  Plus,
  RotateCcw,
  Save,
  Share2,
  ShieldCheck,
  Trash2,
  Upload,
  UserRound,
} from '~/utils/admin-lucide-icons';
import { cloneSiteSettings } from '~/constants/site-settings';
import { validateSecuritySettingsForm } from '~/utils/security-form';
import { useAppToast } from '~/composables/useAppToast';
import { useSiteSettings } from '~/composables/useSiteSettings';
import type {
  AdminSettingsForm,
  AdminSettingsSaveState,
  SiteSocialIcon,
} from '~/types/admin-settings';
import { resolveRequestErrorMessage } from '~/utils/request-error';

definePageMeta({
  layout: 'admin',
});

interface SettingsFieldErrors {
  site: Partial<Record<keyof AdminSettingsForm['site'], string>>;
  owner: Partial<Record<keyof AdminSettingsForm['owner'], string>>;
  footer: Partial<Record<keyof AdminSettingsForm['footer'], string>>;
  security: Record<string, string>;
}

const availableSocialIcons = [
  { label: 'Github', value: 'github' },
  { label: 'Twitter', value: 'twitter' },
  { label: 'LinkedIn', value: 'linkedin' },
  { label: '邮箱', value: 'mail' },
  { label: '站点', value: 'website' },
] as const satisfies Array<{ label: string; value: SiteSocialIcon }>;

const { addToast } = useAppToast();
const { settings, fetchSiteSettings } = useSiteSettings();

await fetchSiteSettings({ admin: true });

const initialSettings = cloneSiteSettings(settings.value);
const form = ref<AdminSettingsForm>(cloneSiteSettings(initialSettings));
const savedSnapshot = ref<AdminSettingsForm>(cloneSiteSettings(initialSettings));
const activeTab = ref<'site' | 'owner' | 'socialLinks' | 'navItems' | 'security' | 'footer'>('site');
const saveState = ref<AdminSettingsSaveState>('saved');
const fieldErrors = ref<SettingsFieldErrors>(createEmptyFieldErrors());
const uploadError = ref({
  siteLogo: '',
  ownerAvatar: '',
});
const siteLogoPreviewUrl = ref(initialSettings.site.logoUrl);
const ownerAvatarPreviewUrl = ref(initialSettings.owner.avatarUrl);
const feedbackMessage = ref('设置已保存');
const feedbackTone = ref<'success' | 'error'>('success');

let siteLogoObjectUrl: string | null = null;
let ownerAvatarObjectUrl: string | null = null;

const currentTabDescription = computed(() => {
  if (activeTab.value === 'site') {
    return '维护首页侧栏与全站页脚内容';
  }

  if (activeTab.value === 'owner') {
    return '维护头像、昵称、简介以及位置标识。';
  }

  if (activeTab.value === 'socialLinks') {
    return '控制首页侧栏图标、显示名称与链接顺序。';
  }

  if (activeTab.value === 'navItems') {
    return '维护顶部导航项的名称、顺序、地址与打开方式。';
  }

  if (activeTab.value === 'security') {
    return '维护登录、评论、留言、友链申请与点赞接口的安全策略。';
  }

  return '维护联系邮箱、版权文案、备案信息与补充说明。';
});

const saveStateMeta = computed(() => {
  if (saveState.value === 'dirty') {
    return {
      label: '未保存',
      icon: AlertCircle,
      badgeClass: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200',
    };
  }

  if (saveState.value === 'saving') {
    return {
      label: '保存中',
      icon: LoaderCircle,
      badgeClass: 'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/40 dark:bg-sky-950/30 dark:text-sky-200',
    };
  }

  if (saveState.value === 'error') {
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

const hasUnsavedChanges = computed(() => JSON.stringify(form.value) !== JSON.stringify(savedSnapshot.value));

const isActionDisabled = computed(() => saveState.value === 'saving' || !hasUnsavedChanges.value);

const bottomStatusText = computed(() => {
  if (saveState.value === 'saving') {
    return '页面正在写入当前修改，请稍候。';
  }

  if (saveState.value === 'dirty') {
    return '存在尚未保存的修改，保存后会同步站点配置。';
  }

  if (saveState.value === 'error') {
    return '表单中仍有需要修正的内容。';
  }

  return '当前页面内容与最近一次保存结果一致。';
});

watch(
  form,
  () => {
    if (saveState.value === 'saving') {
      return;
    }

    if (saveState.value === 'error') {
      validateForm();
    }

    feedbackMessage.value = '';
    feedbackTone.value = 'success';
    saveState.value = hasUnsavedChanges.value ? 'dirty' : 'saved';
  },
  { deep: true }
);

function createEmptyFieldErrors(): SettingsFieldErrors {
  return {
    site: {},
    owner: {},
    footer: {},
    security: {},
  };
}

function getFieldError(group: keyof SettingsFieldErrors, field: string) {
  return (fieldErrors.value[group] as Record<string, string | undefined>)[field] || '';
}

function getInputClass(group: keyof SettingsFieldErrors, field: string) {
  return getFieldError(group, field)
    ? 'border-rose-300 focus:border-rose-500 dark:border-rose-800'
    : 'border-slate-200/80 dark:border-slate-700/80';
}

function isValidUrl(value: string) {
  try {
    new URL(value);
    return true;
  }
  catch {
    return false;
  }
}

function validateTextLength(value: string, maxLength: number) {
  return value.trim().length <= maxLength;
}

function validateForm() {
  const nextErrors = createEmptyFieldErrors();

  if (!form.value.site.name.trim()) {
    nextErrors.site.name = '请输入站点名称';
  }

  if (!form.value.site.url.trim() || !isValidUrl(form.value.site.url.trim())) {
    nextErrors.site.url = '请输入有效的站点链接';
  }

  if (!validateTextLength(form.value.site.description, 160)) {
    nextErrors.site.description = '站点简介需控制在 160 个字符以内';
  }

  if (!form.value.owner.name.trim()) {
    nextErrors.owner.name = '请输入站长昵称';
  }

  if (!form.value.owner.location.trim()) {
    nextErrors.owner.location = '请输入所在地点';
  }

  if (!form.value.owner.tagline.trim()) {
    nextErrors.owner.tagline = '请输入身份短句';
  }

  if (!validateTextLength(form.value.owner.bio, 180)) {
    nextErrors.owner.bio = '个人简介需控制在 180 个字符以内';
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.value.footer.contactEmail.trim())) {
    nextErrors.footer.contactEmail = '请输入有效的联系邮箱';
  }

  if (!form.value.footer.copyright.trim()) {
    nextErrors.footer.copyright = '请输入版权文案';
  }

  if (!form.value.footer.icpText.trim()) {
    nextErrors.footer.icpText = '请输入备案号文本';
  }

  if (!form.value.footer.icpLink.trim() || !isValidUrl(form.value.footer.icpLink.trim())) {
    nextErrors.footer.icpLink = '请输入有效的备案链接';
  }

  if (!validateTextLength(form.value.footer.note, 140)) {
    nextErrors.footer.note = '补充说明需控制在 140 个字符以内';
  }

  nextErrors.security = validateSecuritySettingsForm(form.value.security);

  fieldErrors.value = nextErrors;
  return Object.values(nextErrors).every((group) => Object.keys(group).length === 0);
}

function normalizeSocialLinks() {
  form.value.socialLinks = form.value.socialLinks.map((item, index) => ({
    ...item,
    order: index + 1,
  }));
}

function normalizeNavItems() {
  form.value.navItems = form.value.navItems.map((item, index) => ({
    ...item,
    order: index + 1,
  }));
}

function addSocialLink() {
  form.value.socialLinks = [
    ...form.value.socialLinks,
    {
      id: `social-${Date.now()}`,
      label: '',
      url: '',
      icon: 'website',
      enabled: true,
      order: form.value.socialLinks.length + 1,
    },
  ];
}

function removeSocialLink(id: string) {
  form.value.socialLinks = form.value.socialLinks.filter((item) => item.id !== id);
  normalizeSocialLinks();
}

function moveSocialLink(id: string, direction: 'up' | 'down') {
  const currentIndex = form.value.socialLinks.findIndex((item) => item.id === id);
  const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

  if (currentIndex === -1 || targetIndex < 0 || targetIndex >= form.value.socialLinks.length) {
    return;
  }

  const nextLinks = [...form.value.socialLinks];
  const currentItem = nextLinks[currentIndex];
  if (!currentItem) {
    return;
  }

  nextLinks.splice(currentIndex, 1);
  nextLinks.splice(targetIndex, 0, currentItem);
  form.value.socialLinks = nextLinks;
  normalizeSocialLinks();
}

function addNavItem() {
  form.value.navItems = [
    ...form.value.navItems,
    {
      id: `nav-${Date.now()}`,
      label: '',
      href: '/',
      openInNewTab: false,
      enabled: true,
      order: form.value.navItems.length + 1,
    },
  ];
}

function removeNavItem(id: string) {
  form.value.navItems = form.value.navItems.filter((item) => item.id !== id);
  normalizeNavItems();
}

function moveNavItem(id: string, direction: 'up' | 'down') {
  const currentIndex = form.value.navItems.findIndex((item) => item.id === id);
  const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

  if (currentIndex === -1 || targetIndex < 0 || targetIndex >= form.value.navItems.length) {
    return;
  }

  const nextItems = [...form.value.navItems];
  const currentItem = nextItems[currentIndex];
  if (!currentItem) {
    return;
  }

  nextItems.splice(currentIndex, 1);
  nextItems.splice(targetIndex, 0, currentItem);
  form.value.navItems = nextItems;
  normalizeNavItems();
}

function clearObjectUrl(target: 'siteLogo' | 'ownerAvatar') {
  if (target === 'siteLogo' && siteLogoObjectUrl) {
    URL.revokeObjectURL(siteLogoObjectUrl);
    siteLogoObjectUrl = null;
  }

  if (target === 'ownerAvatar' && ownerAvatarObjectUrl) {
    URL.revokeObjectURL(ownerAvatarObjectUrl);
    ownerAvatarObjectUrl = null;
  }
}

function resetForm() {
  clearObjectUrl('siteLogo');
  clearObjectUrl('ownerAvatar');
  form.value = cloneSiteSettings(savedSnapshot.value);
  fieldErrors.value = createEmptyFieldErrors();
  uploadError.value = {
    siteLogo: '',
    ownerAvatar: '',
  };
  siteLogoPreviewUrl.value = savedSnapshot.value.site.logoUrl;
  ownerAvatarPreviewUrl.value = savedSnapshot.value.owner.avatarUrl;
  feedbackMessage.value = '';
  feedbackTone.value = 'success';
  saveState.value = 'saved';
}

async function saveSettings() {
  feedbackMessage.value = '';
  uploadError.value = {
    siteLogo: '',
    ownerAvatar: '',
  };

  if (!validateForm()) {
    saveState.value = 'error';
    feedbackTone.value = 'error';
    feedbackMessage.value = '保存未完成，请先修正表单内容。';
    addToast('请先修正表单校验项', 'warning');
    return;
  }

  saveState.value = 'saving';
  try {
    const savedSettings = await $fetch<AdminSettingsForm>('/api/admin/site-settings', {
      method: 'PUT',
      body: cloneSiteSettings(form.value),
    });
    const nextSettings = cloneSiteSettings(savedSettings);
    settings.value = nextSettings;
    savedSnapshot.value = cloneSiteSettings(nextSettings);
    siteLogoPreviewUrl.value = nextSettings.site.logoUrl;
    ownerAvatarPreviewUrl.value = nextSettings.owner.avatarUrl;
    saveState.value = 'saved';
    feedbackTone.value = 'success';
    feedbackMessage.value = '设置已保存';
    addToast('设置已保存', 'success');
  }
  catch (error) {
    const message = resolveRequestErrorMessage(error, '设置保存失败');
    saveState.value = 'error';
    feedbackTone.value = 'error';
    feedbackMessage.value = message;
    addToast(message, 'error');
  }
}

function handleImageUpload(event: Event, target: 'siteLogo' | 'ownerAvatar') {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];

  if (!file) {
    return;
  }

  const isSupportedType = ['image/png', 'image/svg+xml', 'image/webp'].includes(file.type);
  const isSupportedSize = file.size <= 2 * 1024 * 1024;

  if (!isSupportedType || !isSupportedSize) {
    uploadError.value = {
      ...uploadError.value,
      [target]: '请上传 2MB 以内的 PNG、SVG 或 WebP 图片',
    };
    input.value = '';
    return;
  }

  clearObjectUrl(target);

  const objectUrl = URL.createObjectURL(file);

  if (target === 'siteLogo') {
    siteLogoObjectUrl = objectUrl;
    siteLogoPreviewUrl.value = objectUrl;
    form.value.site.logoUrl = objectUrl;
    form.value.site.logoAlt = `${form.value.site.name || '站点'} 标志`;
  }

  if (target === 'ownerAvatar') {
    ownerAvatarObjectUrl = objectUrl;
    ownerAvatarPreviewUrl.value = objectUrl;
    form.value.owner.avatarUrl = objectUrl;
  }

  uploadError.value = {
    ...uploadError.value,
    [target]: '',
  };
  saveState.value = 'dirty';
  input.value = '';
}

function handleLogoChange(event: Event) {
  handleImageUpload(event, 'siteLogo');
}

function handleOwnerAvatarChange(event: Event) {
  handleImageUpload(event, 'ownerAvatar');
}

onBeforeUnmount(() => {
  clearObjectUrl('siteLogo');
  clearObjectUrl('ownerAvatar');
});
</script>
