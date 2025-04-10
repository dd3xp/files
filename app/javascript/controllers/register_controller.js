import { Controller } from "@hotwired/stimulus"

// Connects to data-controller="register"
export default class extends Controller {
  static targets = ["form", "password", "passwordConfirmation", "toast", "toastMessage"]

  connect() {
    this.setupEventListeners()
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

  async handleSubmit(event) {
    event.preventDefault()
    
    const password = this.passwordTarget.value
    const passwordConfirmation = this.passwordConfirmationTarget.value
    
    // 先检查密码是否匹配
    if (password !== passwordConfirmation) {
      this.showToast('两次输入的密码不匹配', 'error')
      return
    }
    
    // 再检查密码长度
    if (password.length < 6) {
      this.showToast('密码长度至少需要6个字符', 'error')
      return
    }
    
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
          this.showToast('注册成功', 'success')
          setTimeout(() => {
            window.location.href = response.url
          }, 1000)
          return
        }
        
        // 尝试解析 JSON 响应
        try {
          const data = await response.json()
          if (data && data.success) {
            this.showToast('注册成功', 'success')
            setTimeout(() => {
              window.location.href = data.redirect_url || '/'
            }, 1000)
            return
          }
        } catch (e) {
          // 如果不是 JSON 响应，可能是 HTML 重定向
          this.showToast('注册成功', 'success')
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
          this.showToast('注册失败，请重试', 'error')
        }
      }
    } catch (error) {
      console.error('Error:', error)
      this.showToast('注册失败，请重试', 'error')
    }
  }

  showToast(message, type) {
    this.toastMessageTarget.textContent = message
    this.toastTarget.classList.add(type, 'show')
    
    setTimeout(() => {
      this.toastTarget.classList.remove('show')
    }, 3000)
  }
} 