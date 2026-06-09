import { defineNuxtPlugin } from '#app'

export default defineNuxtPlugin(() => {
  if (import.meta.client) {
    void import('naive-ui')
  }
})
