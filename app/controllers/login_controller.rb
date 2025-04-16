class LoginController < ApplicationController
  skip_before_action :authenticate_user!, only: [:index, :create]
  layout 'auth'

  def index
    result = LoginModel.handle_index
    redirect_to register_path if result[:redirect]
  end

  def create
    result = LoginModel.handle_login(params[:username], params[:password], session, cookies)
    render json: result, status: result[:status]
  end

  def destroy
    result = LoginModel.handle_logout(session, cookies)
    redirect_to result[:redirect_url]
  end
end 