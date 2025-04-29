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
      redirect_to login_path
      return
    end
    
    users = User.load_users
    unless users.key?(current_user)
      session.delete(:user_id)
      cookies.delete(:user_id)
      redirect_to login_path
    end
  end

  helper_method :current_user
end
