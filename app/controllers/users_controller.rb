class UsersController < ApplicationController
  skip_before_action :authenticate_user!, only: [:new, :create]
  layout 'auth', only: [:new, :create]

  def new
    redirect_to login_path unless User.load_users.empty?
  end

  def create
    if params[:password] != params[:password_confirmation]
      respond_to do |format|
        format.html do
          flash.now[:alert] = '两次输入的密码不匹配'
          render :new, status: :unprocessable_entity
        end
        format.json { render json: { error: '两次输入的密码不匹配' }, status: :unprocessable_entity }
      end
      return
    end

    if User.save_user(params[:username], params[:password])
      session[:user_id] = params[:username]
      cookies.permanent[:user_id] = params[:username]
      
      respond_to do |format|
        format.html { redirect_to root_path, notice: '登录成功' }
        format.json { render json: { success: true, redirect_url: root_path } }
      end
    else
      respond_to do |format|
        format.html do
          flash.now[:alert] = '创建账号失败'
          render :new, status: :unprocessable_entity
        end
        format.json { render json: { error: '创建账号失败' }, status: :unprocessable_entity }
      end
    end
  end
end 