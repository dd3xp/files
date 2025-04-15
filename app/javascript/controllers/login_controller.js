import { Controller } from "@hotwired/stimulus"

// Connects to data-controller="login"
export default class extends Controller {
  static targets = ["form", "toast", "toastMessage"]

  connect() {
    this.setupEventListeners()
    this.checkUrlParams()
  }

  setupEventListeners() {
    this.formTarget.addEventListener('submit', this.handleSubmit.bind(this))
  }

  validateField(event) {
    const field = event.target
    if (field.value.trim() === '') {
      field.classList.add('is-invalid')
    } else {
      field.classList.remove('is-invalid')
    }
  }

  checkUrlParams() {
    const urlParams = new URLSearchParams(window.location.search)
    const error = urlParams.get('error')
    
    if (error) {
      this.showToast('密码错误，请重试', 'error')
    }
  }

  async handleSubmit(event) {
    event.preventDefault()
    
    try {
      const response = await fetch(this.formTarget.action, {
        method: 'POST',
        body: new FormData(this.formTarget),
        headers: {
          'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]').content
        }
      })

      // 检查响应状态
      if (response.ok) {
        // 如果响应是重定向
        if (response.redirected) {
          this.showToast('登录成功', 'success')
          setTimeout(() => {
            window.location.href = response.url
          }, 1000)
          return
        }
        
        // 尝试解析 JSON 响应
        try {
          const data = await response.json()
          if (data && data.success) {
            this.showToast('登录成功', 'success')
            setTimeout(() => {
              window.location.href = data.redirect_url || '/'
            }, 1000)
            return
          }
        } catch (e) {
          // 如果不是 JSON 响应，可能是 HTML 重定向
          this.showToast('登录成功', 'success')
          setTimeout(() => {
            window.location.href = response.url
          }, 1000)
          return
        }
      } else {
        // 处理错误响应
        const data = await response.json()
        if (data && data.error) {
          this.showToast(data.error, 'error')
        } else {
          this.showToast('登录失败，请重试', 'error')
        }
      }
    } catch (error) {
      console.error('Error:', error)
      this.showToast('登录失败，请重试', 'error')
    }
  }

  showToast(message, type) {
    this.toastMessageTarget.textContent = message
    
    // 更新图标
    const iconElement = this.toastTarget.querySelector('i')
    if (type === 'success') {
      iconElement.className = 'fas fa-check-circle'
    } else if (type === 'error') {
      iconElement.className = 'fas fa-exclamation-circle'
    } else {
      iconElement.className = 'fas fa-info-circle'
    }
    
    // 先移除所有可能的类型类
    this.toastTarget.classList.remove('success', 'error')
    // 添加新的类型类
    this.toastTarget.classList.add(type, 'show')
    
    setTimeout(() => {
      this.toastTarget.classList.remove('show')
    }, 3000)
  }
} 