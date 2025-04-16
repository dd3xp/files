class LoginModel
  # 检查是否需要重定向到注册页面
  def self.need_redirect_to_register?
    User.load_users.empty?
  end

  # 验证用户登录
  def self.authenticate_user(username, password)
    user = User.find_by_username(username)
    user&.authenticate(password)
  end

  # 设置用户会话
  def self.set_user_session(username, session, cookies)
    session[:user_id] = username
    cookies.permanent[:user_id] = username
  end

  # 清除用户会话
  def self.clear_user_session(session, cookies)
    session.delete(:user_id)
    cookies.delete(:user_id)
  end

  # 处理首页访问
  def self.handle_index
    if need_redirect_to_register?
      { redirect: true }
    else
      { redirect: false }
    end
  end

  # 处理用户登录
  def self.handle_login(username, password, session, cookies)
    if authenticate_user(username, password)
      set_user_session(username, session, cookies)
      { 
        success: true, 
        redirect_url: Rails.application.routes.url_helpers.root_path,
        status: :ok
      }
    else
      { 
        error: '用户名或密码错误', 
        status: :unprocessable_entity 
      }
    end
  end

  # 处理用户登出
  def self.handle_logout(session, cookies)
    clear_user_session(session, cookies)
    { 
      redirect_url: Rails.application.routes.url_helpers.root_path,
      status: :ok
    }
  end
end 