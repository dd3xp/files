class ApplicationController < ActionController::Base
  # Only allow modern browsers supporting webp images, web push, badges, import maps, CSS nesting, and CSS :has.
  allow_browser versions: :modern
  layout 'application'

  before_action :authenticate_user!

  private

  def current_user
    @current_user ||= session[:user_id] || cookies[:user_id]
  end

  def authenticate_user!
    unless current_user
      redirect_to login_path, alert: '请先登录'
      return
    end
    
    # 验证用户是否存在于 users.yml 文件中
    users = User.load_users
    unless users.key?(current_user)
      # 用户不存在，清除会话和 cookie
      session.delete(:user_id)
      cookies.delete(:user_id)
      redirect_to login_path, alert: '用户不存在，请重新登录'
    end
  end

  helper_method :current_user
end
