<script setup lang="ts">
import { naiveThemeOverrides } from '~/assets/styles/themes/naive'
import { useAppTheme } from '~/composables/app/useAppTheme'
import {
  NConfigProvider,
  NDialogProvider,
  NLoadingBarProvider,
  NMessageProvider,
  NNotificationProvider,
  dateZhCN,
  zhCN,
} from 'naive-ui'

// Theme wiring stays here; data startup does not.
const { theme } = useAppTheme()
</script>

<template>
  <NConfigProvider
    :theme="theme"
    :theme-overrides="naiveThemeOverrides"
    :locale="zhCN"
    :date-locale="dateZhCN"
  >
    <NMessageProvider>
      <NNotificationProvider>
        <NDialogProvider>
          <NLoadingBarProvider>
            <slot />
          </NLoadingBarProvider>
        </NDialogProvider>
      </NNotificationProvider>
    </NMessageProvider>
  </NConfigProvider>
</template>
