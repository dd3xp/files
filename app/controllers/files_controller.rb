class FilesController < ApplicationController
  def index
    @title = "文件管理"
    @message = "文件管理页面"
    @current_path = params[:path] || '/'
    @files = FilesModel.get_files_in_directory(@current_path)
  end

  def upload
    result = FilesModel.handle_upload(params[:path], params[:files], params[:fileAction])
    render json: result, status: result[:status]
  end

  def preview
    result = FilesModel.handle_preview(params[:file])
    render json: result, status: result[:status]
  end

  def delete
    result = FilesModel.handle_delete(params[:paths])
    render json: result, status: result[:status]
  end

  def paste
    result = FilesModel.handle_paste(params[:targetPath], params[:files], params[:operation], params[:fileAction])
    render json: result, status: result[:status]
  end

  def check_duplicates
    result = FilesModel.handle_check_duplicates(params[:targetPath], params[:files])
    render json: result, status: result[:status]
  end
end 