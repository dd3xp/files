class RegisterController < ApplicationController
  skip_before_action :authenticate_user!, only: [:index, :create]
  layout 'auth'

  def index
    result = RegisterModel.handle_index
    redirect_to login_path if result[:redirect]
  end

  def create
    result = RegisterModel.handle_register(
      params[:username], 
      params[:password], 
      params[:password_confirmation]
    )
    render json: result, status: result[:status]
  end
end 