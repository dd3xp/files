class LoginController < ApplicationController
  skip_before_action :authenticate_user!, only: [:index, :create]
  layout 'auth'

  def index
    if User.load_users.empty?
      redirect_to register_path
    end
  end

  def create
    user = User.find_by_username(params[:username])
    if user&.authenticate(params[:password])
      session[:user_id] = user.username
      cookies.permanent[:user_id] = user.username
      render json: { success: true, redirect_url: root_path }
    else
      render json: { error: '用户名或密码错误' }, status: :unprocessable_entity
    end
  end

  def destroy
    session.delete(:user_id)
    cookies.delete(:user_id)
    redirect_to root_path
  end
end 