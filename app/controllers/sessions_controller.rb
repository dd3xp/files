class SessionsController < ApplicationController
  skip_before_action :authenticate_user!, only: [:new, :create]
  layout 'auth'

  def new
    if User.load_users.empty?
      redirect_to new_user_path
    end
  end

  def create
    user = User.find_by_username(params[:username])
    if user&.authenticate(params[:password])
      session[:user_id] = user.username
      cookies.permanent[:user_id] = user.username
      
      respond_to do |format|
        format.html { redirect_to root_path, notice: '登录成功' }
        format.json { render json: { success: true, redirect_url: root_path } }
      end
    else
      respond_to do |format|
        format.html { redirect_to login_path(error: true) }
        format.json { render json: { error: '用户名或密码错误' }, status: :unprocessable_entity }
      end
    end
  end

  def destroy
    session.delete(:user_id)
    cookies.delete(:user_id)
    redirect_to root_path, notice: '已登出'
  end
end 