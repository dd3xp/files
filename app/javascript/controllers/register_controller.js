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

      if (response.ok) {
        window.location.href = response.url
      } else {
        const data = await response.json()
        this.showToast(data.error || '注册失败，请重试', 'error')
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