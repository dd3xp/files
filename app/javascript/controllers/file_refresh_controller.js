import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["button"]

  connect() {
    // 监听刷新事件
    document.addEventListener('refresh', (event) => {
      this.refreshWithPath(event.detail.path)
    })
  }

  refresh() {
    // 添加旋转动画
    const refreshIcon = document.querySelector('.refresh-btn i')
    refreshIcon.style.transition = 'transform 1s'
    refreshIcon.style.transform = 'rotate(360deg)'

    // 获取当前路径
    const pathElements = Array.from(document.querySelectorAll('.breadcrumb-path a'))
      .map(a => a.textContent.trim())
      .filter(text => text !== '根目录')
    
    const currentPath = pathElements.length ? '/' + pathElements.join('/') : '/'

    // 使用 Turbo 刷新当前页面，保持在当前目录
    window.Turbo.visit(`/files?path=${encodeURIComponent(currentPath)}`, { action: "replace" })
    
    // 延迟重置旋转动画
    setTimeout(() => {
      refreshIcon.style.transform = 'rotate(0deg)'
    }, 1000)
  }

  refreshWithPath(path) {
    // 添加旋转动画
    const refreshIcon = document.querySelector('.refresh-btn i')
    refreshIcon.style.transition = 'transform 1s'
    refreshIcon.style.transform = 'rotate(360deg)'

    // 使用 Turbo 刷新当前页面，保持在当前目录
    window.Turbo.visit(`/files?path=${encodeURIComponent(path)}`, { action: "replace" })
    
    // 延迟重置旋转动画
    setTimeout(() => {
      refreshIcon.style.transform = 'rotate(0deg)'
    }, 1000)
  }
} 