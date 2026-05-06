<template>
  <div class="space-y-8 pb-20">
    <UCard :ui="{ root: 'rounded-[2rem] border-slate-200 dark:border-slate-800', body: 'p-5 sm:p-6' }">
      <div class="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div class="space-y-3">
          <div class="flex flex-wrap items-center gap-3">
            <UIcon name="i-lucide-link-2" class="size-7 text-brand-600 dark:text-brand-300" />
            <h1 class="font-serif text-3xl font-black tracking-tight text-slate-900 dark:text-white">友情链接</h1>
            <span class="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold" :class="saveBadgeClass">
              <component :is="saveBadgeIcon" :size="14" :class="saveState === 'saving' ? 'animate-spin' : ''" />
              {{ saveBadgeLabel }}
            </span>
          </div>
          <p class="text-sm text-slate-500 dark:text-slate-400">
            {{ activeTab === 'settings' ? '维护页面状态、SEO 信息与友情链接资料。' : '通过独立接口维护友情链接列表、状态与提交资料。' }}
          </p>
          <div
            v-if="activeTab === 'settings' && feedbackMessage"
            class="inline-flex max-w-full items-start gap-2 rounded-2xl border px-4 py-3 text-sm"
            :class="feedbackTone === 'error'
              ? 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-200'
              : 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-200'"
          >
            <AlertCircle v-if="feedbackTone === 'error'" :size="16" class="mt-0.5 shrink-0" />
            <ShieldCheck v-else :size="16" class="mt-0.5 shrink-0" />
            <span>{{ feedbackMessage }}</span>
          </div>
          <div
            v-else-if="activeTab === 'friends' && friendFeedbackMessage"
            class="inline-flex max-w-full items-start gap-2 rounded-2xl border px-4 py-3 text-sm"
            :class="friendFeedbackTone === 'error'
              ? 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-200'
              : 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-200'"
          >
            <AlertCircle v-if="friendFeedbackTone === 'error'" :size="16" class="mt-0.5 shrink-0" />
            <ShieldCheck v-else :size="16" class="mt-0.5 shrink-0" />
            <span>{{ friendFeedbackMessage }}</span>
          </div>
        </div>

        <div v-if="activeTab === 'settings'" class="grid gap-3 sm:grid-cols-2 xl:w-[22rem]">
          <UButton color="neutral" variant="soft" icon="i-lucide-rotate-ccw" class="justify-center" :disabled="isActionDisabled" @click="resetForm">
            重置本页
          </UButton>
          <UButton :loading="saveState === 'saving'" :icon="saveState === 'saving' ? undefined : 'i-lucide-save'" class="justify-center" :disabled="isActionDisabled" @click="savePageSettings">
            {{ saveState === 'saving' ? '保存中...' : '保存修改' }}
          </UButton>
        </div>

        <div v-else class="grid gap-3 sm:grid-cols-2 xl:w-[22rem]">
          <UButton
            color="neutral"
            variant="soft"
            :loading="isFriendLinksLoading"
            :icon="isFriendLinksLoading ? undefined : 'i-lucide-rotate-ccw'"
            class="justify-center"
            :disabled="isFriendLinksLoading || Boolean(activeSavingFriendLinkId)"
            @click="refreshFriendLinks()"
          >
            刷新列表
          </UButton>
          <div class="flex h-11 items-center justify-center rounded-xl bg-amber-50 px-4 text-sm font-bold text-amber-700 dark:bg-amber-950/30 dark:text-amber-200">
            待审核 {{ pendingFriendCount }}
          </div>
        </div>
      </div>
    </UCard>

    <div class="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/80 p-2 dark:border-slate-800 dark:bg-slate-900/40">
      <button
        type="button"
        class="inline-flex items-center rounded-xl px-4 py-2 text-sm font-bold transition-all"
        :class="activeTab === 'settings'
          ? 'bg-white text-brand-600 shadow-sm dark:bg-slate-800 dark:text-white'
          : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'"
        @click="activeTab = 'settings'"
      >
        基础设置
      </button>
      <button
        type="button"
        class="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition-all"
        :class="activeTab === 'friends'
          ? 'bg-white text-brand-600 shadow-sm dark:bg-slate-800 dark:text-white'
          : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'"
        @click="activeTab = 'friends'"
      >
        <span>友情链接列表</span>
        <span
          class="inline-flex h-6 min-w-6 items-center justify-center rounded-full px-2 text-[11px]"
          :class="activeTab === 'friends'
            ? 'bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-300'
            : 'bg-slate-200/70 text-slate-500 dark:bg-slate-800 dark:text-slate-300'"
        >
          {{ friendLinks.length }}
        </span>
      </button>
    </div>

    <div v-if="activeTab === 'settings'" class="space-y-8">
      <section class="rounded-[2.5rem] border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
        <div class="mb-6 flex items-center gap-3">
          <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-300">
            <Power :size="22" />
          </div>
          <div>
            <h2 class="text-lg font-black text-slate-900 dark:text-white">页面状态</h2>
            <p class="text-sm text-slate-500 dark:text-slate-400">控制友情链接页面是否在前台展示。</p>
          </div>
        </div>
        <label class="flex items-start gap-4 rounded-[1.75rem] border border-slate-200 bg-slate-50/80 p-5 dark:border-slate-800 dark:bg-slate-950/40">
          <input v-model="form.enabled" type="checkbox" class="mt-1 h-5 w-5 rounded border-slate-300 text-brand-600 focus:ring-brand-500">
          <div class="space-y-1">
            <p class="text-sm font-bold text-slate-900 dark:text-white">启用友情链接页面</p>
            <p class="text-sm text-slate-500 dark:text-slate-400">关闭后前台导航会移除友情链接入口，直接访问页面时返回 404。</p>
          </div>
        </label>
      </section>

      <section class="rounded-[2.5rem] border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
        <div class="mb-6 flex items-center gap-3">
          <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-600 dark:bg-sky-950/30 dark:text-sky-300">
            <SearchCheck :size="22" />
          </div>
          <div>
            <h2 class="text-lg font-black text-slate-900 dark:text-white">SEO 设置</h2>
            <p class="text-sm text-slate-500 dark:text-slate-400">维护页面标题和描述元信息。</p>
          </div>
        </div>
        <div class="grid gap-6 lg:grid-cols-2">
          <div class="space-y-2">
            <label class="text-sm font-bold text-slate-900 dark:text-white">SEO 标题</label>
            <input v-model="form.seo.title" type="text" maxlength="60" class="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition-all focus:border-brand-600 focus:ring-4 focus:ring-brand-500/5 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100">
          </div>
          <div class="space-y-2 lg:col-span-2">
            <label class="text-sm font-bold text-slate-900 dark:text-white">SEO 描述</label>
            <textarea v-model="form.seo.description" rows="4" maxlength="160" class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition-all focus:border-brand-600 focus:ring-4 focus:ring-brand-500/5 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100" />
          </div>
        </div>
      </section>

      <section class="rounded-[2.5rem] border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
        <div class="mb-6 flex items-center gap-3">
          <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-600 dark:bg-cyan-950/30 dark:text-cyan-300">
            <Link2 :size="22" />
          </div>
          <div>
            <h2 class="text-lg font-black text-slate-900 dark:text-white">友情链接资料</h2>
            <p class="text-sm text-slate-500 dark:text-slate-400">维护友情链接页“我的信息”展示内容。</p>
          </div>
        </div>

        <div class="space-y-6">
          <div class="space-y-2">
            <label class="text-sm font-bold text-slate-900 dark:text-white">展示名称</label>
            <input
              v-model="form.friendCard.name"
              type="text"
              maxlength="40"
              placeholder="例如：TechFlow.blog"
              class="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition-all focus:border-brand-600 focus:ring-4 focus:ring-brand-500/5 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
            >
          </div>

          <div class="space-y-2">
            <label class="text-sm font-bold text-slate-900 dark:text-white">展示简介</label>
            <textarea
              v-model="form.friendCard.description"
              rows="4"
              maxlength="120"
              placeholder="用于展示站点定位与友链交换说明"
              class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition-all focus:border-brand-600 focus:ring-4 focus:ring-brand-500/5 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
            />
            <div class="flex items-center justify-end gap-3 text-xs">
              <span class="text-slate-400">{{ form.friendCard.description.trim().length }}/120</span>
            </div>
          </div>

          <div class="grid gap-6 md:grid-cols-2">
            <div class="space-y-2">
              <label class="text-sm font-bold text-slate-900 dark:text-white">展示链接</label>
              <input
                v-model="form.friendCard.url"
                type="url"
                placeholder="https://example.com"
                class="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition-all focus:border-brand-600 focus:ring-4 focus:ring-brand-500/5 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
              >
            </div>

            <div class="space-y-2">
              <label class="text-sm font-bold text-slate-900 dark:text-white">头像链接</label>
              <input
                v-model="form.friendCard.avatarUrl"
                type="url"
                placeholder="https://example.com/avatar.png"
                class="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition-all focus:border-brand-600 focus:ring-4 focus:ring-brand-500/5 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
              >
            </div>
          </div>
        </div>
      </section>

    </div>

    <div v-else class="space-y-8">
      <section class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 xl:w-[46rem]">
        <article class="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div class="flex items-center justify-between gap-4">
            <div>
              <p class="text-xs font-black uppercase tracking-[0.28em] text-slate-400">友链总量</p>
              <p class="mt-3 text-3xl font-black text-slate-900 dark:text-white">{{ friendLinks.length }}</p>
            </div>
            <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-200">
              <Link2 :size="22" />
            </div>
          </div>
        </article>

        <article class="rounded-[2rem] border border-emerald-200/80 bg-emerald-50/80 p-6 shadow-sm dark:border-emerald-900/40 dark:bg-emerald-950/20">
          <div class="flex items-center justify-between gap-4">
            <div>
              <p class="text-xs font-black uppercase tracking-[0.28em] text-emerald-600 dark:text-emerald-300">展示中</p>
              <p class="mt-3 text-3xl font-black text-emerald-700 dark:text-emerald-100">{{ visibleFriendCount }}</p>
            </div>
            <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/70 text-emerald-600 shadow-sm dark:bg-emerald-900/30 dark:text-emerald-200">
              <ShieldCheck :size="22" />
            </div>
          </div>
        </article>

        <article class="rounded-[2rem] border border-amber-200/80 bg-amber-50/80 p-6 shadow-sm dark:border-amber-900/40 dark:bg-amber-950/20">
          <div class="flex items-center justify-between gap-4">
            <div>
              <p class="text-xs font-black uppercase tracking-[0.28em] text-amber-600 dark:text-amber-300">审核中</p>
              <p class="mt-3 text-3xl font-black text-amber-700 dark:text-amber-100">{{ pendingFriendCount }}</p>
            </div>
            <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/70 text-amber-600 shadow-sm dark:bg-amber-900/30 dark:text-amber-200">
              <AlertCircle :size="22" />
            </div>
          </div>
        </article>
      </section>

      <section class="rounded-[2.5rem] border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
        <div class="mb-6 flex items-center justify-between gap-4">
          <div class="flex items-center gap-3">
            <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-300">
              <Link2 :size="22" />
            </div>
            <div>
              <h2 class="text-lg font-black text-slate-900 dark:text-white">友情链接列表</h2>
              <p class="text-sm text-slate-500 dark:text-slate-400">维护友链名称、地址、头像与审核状态，前台仅展示展示中条目。</p>
            </div>
          </div>
          <button v-if="activeTab === 'friends'" type="button" class="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-700" :disabled="Boolean(activeSavingFriendLinkId)" @click="addFriendLink">
            <Plus :size="16" />
            新增友链
          </button>
        </div>

        <div class="overflow-x-auto rounded-[1.75rem] border border-slate-200 dark:border-slate-800">
          <table class="min-w-[980px] w-full border-collapse text-left xl:min-w-[1180px]">
            <thead class="bg-slate-50 text-xs font-black uppercase tracking-[0.24em] text-slate-500 dark:bg-slate-950/60 dark:text-slate-400">
              <tr>
                <th class="px-6 py-4">名称</th>
                <th class="px-4 py-4">链接</th>
                <th class="px-4 py-4">状态</th>
                <th class="px-4 py-4">描述</th>
                <th class="px-4 py-4">头像</th>
                <th class="px-4 py-4">联系方式</th>
                <th class="px-4 py-4">提交时间</th>
                <th class="px-4 py-4 text-right">操作</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-200 bg-white dark:divide-slate-800 dark:bg-slate-900">
              <tr v-for="item in friendLinks" :key="item.id" class="align-top">
                <td class="px-6 py-4">
                  <input v-model="item.name" type="text" maxlength="40" placeholder="友链名称" class="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition-all focus:border-brand-600 focus:ring-4 focus:ring-brand-500/5 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100">
                </td>
                <td class="px-4 py-4">
                  <input v-model="item.url" type="url" placeholder="站点链接" class="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition-all focus:border-brand-600 focus:ring-4 focus:ring-brand-500/5 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100">
                </td>
                <td class="px-4 py-4">
                  <div v-for="statusMeta in [friendStatusMeta[item.status]]" :key="`${item.id}-${statusMeta.value}`" class="space-y-3">
                    <div class="rounded-2xl border px-3 py-3" :class="statusMeta.panelClass">
                      <span class="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold" :class="statusBadgeClass(item.status)">
                        <component :is="statusMeta.icon" :size="14" />
                        {{ statusMeta.label }}
                      </span>
                      <p class="mt-2 text-xs leading-5" :class="statusMeta.descriptionClass">
                        {{ statusMeta.description }}
                      </p>
                    </div>
                    <select v-model="item.status" class="h-10 w-full rounded-xl border px-3 text-sm text-slate-900 outline-none transition-all focus:border-brand-600 focus:ring-4 focus:ring-brand-500/5 dark:text-slate-100" :class="statusMeta.selectClass">
                      <option v-for="option in friendStatuses" :key="option.value" :value="option.value">
                        {{ option.label }}
                      </option>
                    </select>
                  </div>
                </td>
                <td class="px-4 py-4">
                  <textarea v-model="item.description" rows="3" maxlength="120" placeholder="站点描述" class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition-all focus:border-brand-600 focus:ring-4 focus:ring-brand-500/5 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100" />
                </td>
                <td class="px-4 py-4">
                  <input v-model="item.avatarUrl" type="url" placeholder="头像链接" class="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition-all focus:border-brand-600 focus:ring-4 focus:ring-brand-500/5 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100">
                </td>
                <td class="px-4 py-4">
                  <input v-model="item.contact" type="text" maxlength="80" placeholder="邮箱或即时通信账号" class="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition-all focus:border-brand-600 focus:ring-4 focus:ring-brand-500/5 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100">
                </td>
                <td class="px-4 py-4 text-sm text-slate-500 dark:text-slate-400">
                  {{ item.submittedAt }}
                </td>
                <td class="px-4 py-4">
                  <div class="flex justify-end">
                    <button type="button" class="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold text-brand-600 transition-colors hover:bg-brand-50 dark:hover:bg-brand-950/30" :disabled="activeSavingFriendLinkId === item.id" @click="saveFriendLink(item)">
                      <LoaderCircle v-if="activeSavingFriendLinkId === item.id" :size="14" class="animate-spin" />
                      <Save v-else :size="14" />
                      保存
                    </button>
                    <button type="button" class="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold text-rose-500 transition-colors hover:bg-rose-50 dark:hover:bg-rose-950/30" :disabled="activeSavingFriendLinkId === item.id" @click="deleteFriendLink(item)">
                      <Trash2 :size="14" />
                      删除
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>

    <section v-if="activeTab === 'settings'" class="flex flex-col gap-4 rounded-[2rem] border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between">
      <div class="space-y-1">
        <p class="text-sm font-bold text-slate-900 dark:text-white">{{ saveBadgeLabel }}</p>
        <p class="text-sm text-slate-500 dark:text-slate-400">{{ bottomStatusText }}</p>
      </div>
      <div class="grid gap-3 sm:grid-cols-2">
        <button type="button" class="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-100 dark:hover:border-slate-600 dark:hover:bg-slate-800" :disabled="isActionDisabled" @click="resetForm">
          <RotateCcw :size="16" />
          重置本页
        </button>
        <button type="button" class="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 text-sm font-bold text-white shadow-lg shadow-brand-500/25 transition-all hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none dark:disabled:bg-slate-700 dark:disabled:text-slate-300" :disabled="isActionDisabled" @click="savePageSettings">
          <LoaderCircle v-if="saveState === 'saving'" :size="16" class="animate-spin" />
          <Save v-else :size="16" />
          {{ saveState === 'saving' ? '保存中...' : '保存修改' }}
        </button>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import {
  AlertCircle,
  Clock3,
  Eye,
  EyeOff,
  Link2,
  LoaderCircle,
  Plus,
  Power,
  RotateCcw,
  Save,
  SearchCheck,
  ShieldCheck,
  Trash2,
} from '~/utils/admin-lucide-icons';
import { clonePageSettings } from '~/constants/page-settings';
import { useAdminPageEditor } from '~/composables/useAdminPageEditor';
import { useAppToast } from '~/composables/useAppToast';
import { usePageSettings } from '~/composables/usePageSettings';
import type { AdminFriendLinkItem } from '~/types/friend-link';
import type { FriendLinkStatus, LinksPageSettings } from '~/types/page-settings';
import { resolveRequestErrorMessage } from '~/utils/request-error';

definePageMeta({ layout: 'admin' });

const { addToast } = useAppToast();
const { pageSettings, fetchPageSettings } = usePageSettings();

await fetchPageSettings({ admin: true });

const activeTab = ref<'settings' | 'friends'>('settings');
type FriendLinkEditorItem = AdminFriendLinkItem & { isDraft?: boolean };
const friendStatuses = [
  { value: 'visible', label: '展示' },
  { value: 'hidden', label: '隐藏' },
  { value: 'pending', label: '审核中' },
] as Array<{ value: FriendLinkStatus; label: string }>;

const friendStatusMeta = {
  visible: {
    value: 'visible',
    label: '展示',
    description: '展示中，前台可见',
    badgeClass: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200',
    panelClass: 'border-emerald-200 bg-emerald-50/80 dark:border-emerald-900/40 dark:bg-emerald-950/20',
    descriptionClass: 'text-emerald-700 dark:text-emerald-200',
    selectClass: 'border-emerald-200 bg-white dark:border-emerald-900/40 dark:bg-emerald-950/30',
    icon: Eye,
  },
  hidden: {
    value: 'hidden',
    label: '隐藏',
    description: '已隐藏，仅后台保留',
    badgeClass: 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
    panelClass: 'border-slate-200 bg-slate-50/80 dark:border-slate-800 dark:bg-slate-950/20',
    descriptionClass: 'text-slate-600 dark:text-slate-300',
    selectClass: 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950',
    icon: EyeOff,
  },
  pending: {
    value: 'pending',
    label: '审核中',
    description: '等待审核后再展示',
    badgeClass: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-200',
    panelClass: 'border-amber-200 bg-amber-50/80 dark:border-amber-900/40 dark:bg-amber-950/20',
    descriptionClass: 'text-amber-700 dark:text-amber-200',
    selectClass: 'border-amber-200 bg-white dark:border-amber-900/40 dark:bg-amber-950/30',
    icon: Clock3,
  },
} satisfies Record<FriendLinkStatus, {
  value: FriendLinkStatus;
  label: string;
  description: string;
  badgeClass: string;
  panelClass: string;
  descriptionClass: string;
  selectClass: string;
  icon: typeof Eye;
}>;

function cloneLinksPageSettings(value: LinksPageSettings): LinksPageSettings {
  return clonePageSettings({
    ...pageSettings.value,
    links: value,
  }).links;
}

const {
  form,
  saveState,
  feedbackMessage,
  feedbackTone,
  isActionDisabled,
  bottomStatusText,
  resetForm,
  beginSaving,
  markError,
  markSaved,
} = useAdminPageEditor(pageSettings.value.links, cloneLinksPageSettings);

const saveBadgeLabel = computed(() => {
  if (saveState.value === 'dirty') {
    return '未保存';
  }

  if (saveState.value === 'saving') {
    return '保存中';
  }

  if (saveState.value === 'error') {
    return '未保存';
  }

  return '已保存';
});

const saveBadgeIcon = computed(() => saveState.value === 'saved' ? ShieldCheck : AlertCircle);

const saveBadgeClass = computed(() => {
  if (saveState.value === 'dirty') {
    return 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200';
  }

  if (saveState.value === 'saving') {
    return 'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/40 dark:bg-sky-950/30 dark:text-sky-200';
  }

  if (saveState.value === 'error') {
    return 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-200';
  }

  return 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-200';
});

function statusBadgeClass(status: FriendLinkStatus) {
  return friendStatusMeta[status].badgeClass;
}

const friendLinks = ref<FriendLinkEditorItem[]>([]);
const activeSavingFriendLinkId = ref('');
const isFriendLinksLoading = ref(false);
const friendFeedbackMessage = ref('');
const friendFeedbackTone = ref<'success' | 'error'>('success');

const visibleFriendCount = computed(() => friendLinks.value.filter((item) => item.status === 'visible').length);
const pendingFriendCount = computed(() => friendLinks.value.filter((item) => item.status === 'pending').length);

function isValidUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  }
  catch {
    return false;
  }
}

function validateForm() {
  if (form.value.enabled && (!form.value.seo.title.trim() || !form.value.seo.description.trim())) {
    return '启用页面时需填写 SEO 标题和 SEO 描述。';
  }

  if (!form.value.friendCard.name.trim()) {
    return '请输入展示名称';
  }

  if (!form.value.friendCard.description.trim()) {
    return '请输入展示简介';
  }

  if (!form.value.friendCard.url.trim() || !isValidUrl(form.value.friendCard.url.trim())) {
    return '请输入有效的展示链接';
  }

  if (!form.value.friendCard.avatarUrl.trim() || !isValidUrl(form.value.friendCard.avatarUrl.trim())) {
    return '请输入有效的头像链接';
  }

  return '';
}

function createDraftFriendLink(): FriendLinkEditorItem {
  return {
    id: `draft-friend-link-${Date.now()}`,
    name: '',
    url: '',
    avatarUrl: '',
    contact: '',
    description: '',
    status: 'pending',
    submittedAt: '未提交',
    updatedAt: '未提交',
    isDraft: true,
  };
}

function setFriendFeedback(message: string, tone: 'success' | 'error') {
  friendFeedbackMessage.value = message;
  friendFeedbackTone.value = tone;
}

function replaceFriendLink(currentId: string, nextItem: FriendLinkEditorItem) {
  const nextIndex = friendLinks.value.findIndex((item) => item.id === currentId);

  if (nextIndex >= 0) {
    friendLinks.value.splice(nextIndex, 1, nextItem);
    return;
  }

  friendLinks.value.unshift(nextItem);
}

function toEditorItem(item: AdminFriendLinkItem): FriendLinkEditorItem {
  return {
    ...item,
    contact: item.contact || '',
  };
}

async function refreshFriendLinks(showToast = false) {
  isFriendLinksLoading.value = true;

  try {
    const records = await $fetch<AdminFriendLinkItem[]>('/api/admin/friend-links');
    friendLinks.value = records.map(toEditorItem);
    setFriendFeedback('友情链接列表已刷新', 'success');

    if (showToast) {
      addToast('友情链接列表已刷新', 'success');
    }
  }
  catch (error) {
    const message = resolveRequestErrorMessage(error, '友情链接列表读取失败');
    setFriendFeedback(message, 'error');
    addToast(message, 'error');
  }
  finally {
    isFriendLinksLoading.value = false;
  }
}

function addFriendLink() {
  friendLinks.value.unshift(createDraftFriendLink());
}

function validateFriendLink(item: FriendLinkEditorItem) {
  if (item.name.trim().length < 2 || item.name.trim().length > 40) {
    return '站点名称长度需在 2 到 40 个字符之间';
  }

  if (!isValidUrl(item.url) || !isValidUrl(item.avatarUrl)) {
    return '站点链接和头像链接必须是有效地址';
  }

  if (item.description.trim().length < 1 || item.description.trim().length > 120) {
    return '站点描述长度需在 1 到 120 个字符之间';
  }

  if (item.contact.trim() && (item.contact.trim().length < 2 || item.contact.trim().length > 80)) {
    return '联系方式长度需在 2 到 80 个字符之间';
  }

  return '';
}

async function saveFriendLink(item: FriendLinkEditorItem) {
  const validationMessage = validateFriendLink(item);
  if (validationMessage) {
    setFriendFeedback(validationMessage, 'error');
    addToast(validationMessage, 'warning');
    return;
  }

  activeSavingFriendLinkId.value = item.id;

  try {
    const payload = {
      name: item.name,
      url: item.url,
      avatarUrl: item.avatarUrl,
      contact: item.contact,
      description: item.description,
      status: item.status,
    };

    const savedItem = item.isDraft
      ? await $fetch<AdminFriendLinkItem>('/api/admin/friend-links', {
          method: 'POST',
          body: payload,
        })
      : await $fetch<AdminFriendLinkItem>(`/api/admin/friend-links/${item.id}`, {
          method: 'PATCH',
          body: payload,
        });

    replaceFriendLink(item.id, toEditorItem(savedItem));
    const successMessage = item.isDraft ? '友链已创建' : '友链已保存';
    setFriendFeedback(successMessage, 'success');
    addToast(successMessage, 'success');
  }
  catch (error) {
    const message = resolveRequestErrorMessage(error, '友链保存失败');
    setFriendFeedback(message, 'error');
    addToast(message, 'error');
  }
  finally {
    activeSavingFriendLinkId.value = '';
  }
}

async function deleteFriendLink(item: FriendLinkEditorItem) {
  if (item.isDraft) {
    friendLinks.value = friendLinks.value.filter((currentItem) => currentItem.id !== item.id);
    setFriendFeedback('草稿已移除', 'success');
    return;
  }

  activeSavingFriendLinkId.value = item.id;

  try {
    await $fetch(`/api/admin/friend-links/${item.id}`, {
      method: 'DELETE',
    });
    friendLinks.value = friendLinks.value.filter((currentItem) => currentItem.id !== item.id);
    setFriendFeedback('友链已删除', 'success');
    addToast('友链已删除', 'success');
  }
  catch (error) {
    const message = resolveRequestErrorMessage(error, '友链删除失败');
    setFriendFeedback(message, 'error');
    addToast(message, 'error');
  }
  finally {
    activeSavingFriendLinkId.value = '';
  }
}

await refreshFriendLinks();

async function savePageSettings() {
  const validationMessage = validateForm();
  if (validationMessage) {
    markError(validationMessage);
    addToast(validationMessage, 'warning');
    return;
  }

  beginSaving();
  try {
    const savedSettings = await $fetch<LinksPageSettings>('/api/admin/page-settings/links', {
      method: 'PUT',
      body: cloneLinksPageSettings(form.value),
    });
    const nextSettings = clonePageSettings(pageSettings.value);
    nextSettings.links = cloneLinksPageSettings(savedSettings);
    pageSettings.value = nextSettings;
    markSaved(nextSettings.links, '友情链接设置已保存');
    addToast('友情链接设置已保存', 'success');
  }
  catch (error) {
    const message = resolveRequestErrorMessage(error, '友情链接设置保存失败');
    markError(message);
    addToast(message, 'error');
  }
}
</script>
