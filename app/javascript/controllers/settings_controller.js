import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["rootPath", "selectDirectory"]

  connect() {
    this.setupEventListeners()
  }

  setupEventListeners() {
    // 监听按钮点击事件
  }


  /*
  * 择根目录
  */
  async selectDirectory() {
    try {
      const response = await fetch('/settings/select_directory', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]').content
        }
      });

      const result = await response.json();
      
      if (!result.success) {
        if (result.message) {
          console.log('目录选择取消:', result.message);
          return;
        }
        throw new Error(result.message || '选择目录失败');
      }

      const selectedPath = result.output;
      if (!selectedPath) {
        console.log('未选择目录');
        return;
      }

      // 检查目录权限
      const checkResponse = await fetch('/settings/check_directory_access', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]').content
        },
        body: JSON.stringify({ path: selectedPath })
      });

      const checkResult = await checkResponse.json();
      if (checkResult.success) {
        // 直接更新根目录
        const updateResponse = await fetch('/settings/update_root_path', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]').content
          },
          body: JSON.stringify({ path: selectedPath })
        });

        const updateResult = await updateResponse.json();
        if (updateResult.success) {
          this.rootPathTarget.textContent = updateResult.new_path;
          this.showToast('根目录已更新', 'success');
          // 刷新页面以确保配置更新生效
          window.location.reload();
        } else {
          this.showToast(updateResult.message, 'error');
        }
      } else {
        this.showToast(checkResult.message, 'error');
      }
    } catch (error) {
      console.error('选择目录失败:', error);
      this.showToast('选择目录失败: ' + error.message, 'error');
    }
  }

  /**
   * 显示提示消息
   * @param {string} message - 要显示的消息内容
   * @param {string} type - 消息类型，可以是'success'、'error'或'info'
   */
  showToast(message, type = 'info') {
    const toast = document.createElement('div')
    toast.className = `custom-toast ${type}`
    
    const icon = document.createElement('i')
    if (type === 'success') {
      icon.className = 'fas fa-check-circle'
    } else if (type === 'error') {
      icon.className = 'fas fa-exclamation-circle'
    } else {
      icon.className = 'fas fa-info-circle'
    }
    
    const messageSpan = document.createElement('span')
    messageSpan.textContent = message
    
    toast.appendChild(icon)
    toast.appendChild(messageSpan)
    
    document.body.appendChild(toast)
    
    setTimeout(() => {
      toast.classList.add('show')
    }, 10)
    
    setTimeout(() => {
      toast.classList.remove('show')
      setTimeout(() => {
        if (document.body.contains(toast)) {
          document.body.removeChild(toast)
        }
      }, 300)
    }, 3000)
  }
}
