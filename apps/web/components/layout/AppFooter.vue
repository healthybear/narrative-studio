<template>
  <n-layout-footer bordered class="app-footer">
    <div class="footer-content">
      <div class="footer-left">
        <span class="copyright">© {{ currentYear }} Narrative Studio</span>
        <n-divider vertical />
        <span class="version">v{{ version }}</span>
      </div>

      <div class="footer-right">
        <n-space :size="16">
          <a href="#" class="footer-link" @click.prevent="openDocs">文档</a>
          <a href="#" class="footer-link" @click.prevent="openGithub">GitHub</a>
          <a href="#" class="footer-link" @click.prevent="openFeedback">反馈</a>
        </n-space>
      </div>
    </div>
  </n-layout-footer>
</template>

<script setup lang="ts">
const currentYear = new Date().getFullYear()
const version = '0.1.0'
const message = useMessage()

function openDocs() {
  message.warning('文档中心暂未开放')
}

function openGithub() {
  message.warning('GitHub 链接暂未配置')
}

function openFeedback() {
  message.warning('反馈入口暂未开放')
}
</script>

<style scoped>
.app-footer {
  padding: 16px 24px;
  background: #fafafa;
}

.footer-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.footer-left {
  display: flex;
  gap: 8px;
  align-items: center;
  color: #666;
  font-size: 14px;
}

.copyright,
.version {
  color: #666;
}

.footer-right {
  display: flex;
  align-items: center;
}

.footer-link {
  color: #666;
  font-size: 14px;
  text-decoration: none;
  transition: color 0.3s;
}

.footer-link:hover {
  color: #18a058;
}
</style>
