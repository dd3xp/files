class RegisterModel
  # 检查是否需要重定向到登录页面
  def self.need_redirect_to_login?
    User.load_users.any?
  end

  # 验证密码确认
  def self.validate_password_confirmation(password, password_confirmation)
    password == password_confirmation
  end

  # 创建新用户
  def self.create_user(username, password)
    User.save_user(username, password)
  end

  # 处理注册页面访问
  def self.handle_index
    if need_redirect_to_login?
      { redirect: true }
    else
      { redirect: false }
    end
  end

  # 处理用户注册
  def self.handle_register(username, password, password_confirmation)
    unless validate_password_confirmation(password, password_confirmation)
      return { 
        error: '两次输入的密码不一致', 
        status: :unprocessable_entity 
      }
    end

    if create_user(username, password)
      { 
        success: true, 
        redirect_url: Rails.application.routes.url_helpers.login_path,
        status: :ok
      }
    else
      { 
        error: '用户名已存在或密码不符合要求', 
        status: :unprocessable_entity 
      }
    end
  end
end 