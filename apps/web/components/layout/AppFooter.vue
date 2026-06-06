<template>
  <n-layout-footer bordered class="app-footer">
    <div class="footer-content">
      <div class="footer-left">
        <span class="copyright">© 2026 Narrative Studio</span>
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
/**
 * 应用底部栏组件
 * 显示版权信息、版本号、快捷链接等
 */

// 版本号（从 package.json 读取）
const version = '0.1.0'

// 打开文档
const openDocs = () => {
  console.log('打开文档')
  // TODO: 打开文档页面
}

// 打开 GitHub
const openGithub = () => {
  console.log('打开 GitHub')
  // TODO: 打开 GitHub 仓库
}

// 打开反馈
const openFeedback = () => {
  console.log('打开反馈')
  // TODO: 打开反馈表单
}
</script>

<style scoped>
.app-footer {
  padding: 16px 24px;
  background: #fafafa;
}

.footer-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.footer-left {
  display: flex;
  align-items: center;
  gap: 8px;
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
  text-decoration: none;
  font-size: 14px;
  transition: color 0.3s;
}

.footer-link:hover {
  color: #18a058;
}
</style>