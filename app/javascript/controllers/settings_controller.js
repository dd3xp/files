import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["rootPath", "selectDirectory", "password", "passwordIcon", "passwordBtnText", "togglePassword", "newPassword", "confirmPassword"]

  connect() {
    this.setupEventListeners()
    this.passwordVisible = false
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
      
      if (!response.ok) {
        throw new Error(result.message || '选择目录失败');
      }

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
        // 更新根目录
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
      this.showToast(error.message || '选择目录失败', 'error');
    }
  }

  async restoreDefaultPath() {
    try {
      const response = await fetch('/settings/restore_default_path', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]').content
        }
      });

      const result = await response.json();
      if (result.success) {
        this.rootPathTarget.textContent = result.new_path;
        this.showToast('已恢复默认根目录', 'success');
        // 刷新页面以确保配置更新生效
        window.location.reload();
      } else {
        this.showToast(result.message || '恢复默认路径失败', 'error');
      }
    } catch (error) {
      console.error('恢复默认路径失败:', error);
      this.showToast(error.message || '恢复默认路径失败', 'error');
    }
  }

  /*
  * 显示密码
  */
  async togglePassword() {
    if (this.passwordVisible) {
      // 如果密码当前可见，则隐藏它
      this.passwordTarget.textContent = '••••••••';
      this.passwordIconTarget.className = 'fas fa-eye';
      this.passwordBtnTextTarget.textContent = '显示密码';
      this.passwordVisible = false;
    } else {
      try {
        // 如果密码当前隐藏，则获取并显示它
        const response = await fetch('/settings/get_admin_password', {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });
        
        const result = await response.json();
        
        if (!response.ok) {
          throw new Error(result.message || '获取密码失败');
        }
        
        if (result.success) {
          this.passwordTarget.textContent = result.password;
          this.passwordIconTarget.className = 'fas fa-eye-slash';
          this.passwordBtnTextTarget.textContent = '隐藏密码';
          this.passwordVisible = true;
        } else {
          throw new Error(result.message || '获取密码失败');
        }
      } catch (error) {
        console.error('获取密码失败:', error);
        this.showToast(error.message || '获取密码失败', 'error');
      }
    }
  }

  async updatePassword(event) {
    event.preventDefault();
    
    const newPassword = this.newPasswordTarget.value;
    const confirmPassword = this.confirmPasswordTarget.value;

    if (newPassword.length < 6) {
      this.showToast('密码长度至少为6位', 'error');
      return;
    }

    if (newPassword !== confirmPassword) {
      this.showToast('两次输入的密码不一致', 'error');
      return;
    }

    try {
      const response = await fetch('/settings/update_password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]').content
        },
        body: JSON.stringify({ password: newPassword })
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || '更新密码失败');
      }

      if (result.success) {
        this.showToast('密码已更新', 'success');
        // 清空输入框
        this.newPasswordTarget.value = '';
        this.confirmPasswordTarget.value = '';
      } else {
        throw new Error(result.message || '更新密码失败');
      }
    } catch (error) {
      console.error('更新密码失败:', error);
      this.showToast(error.message || '更新密码失败', 'error');
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
