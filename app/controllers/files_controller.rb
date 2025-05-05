class FilesController < ApplicationController
  skip_before_action :verify_authenticity_token, only: [:download_multiple]

  def index
    @title = "文件管理"
    @message = "文件管理页面"
    @current_path = params[:path] || '/'
    @files = FilesModel.get_files_in_directory(@current_path)
  end

  def upload
    path = params[:path]
    files = params[:files]
    file_action = params[:fileAction]

    if files.nil?
      render json: { error: '没有选择文件' }, status: :bad_request
      return
    end

    upload_path = File.join(FilesModel.root_path, path.to_s.sub(/^\//, ''))
    result = FilesModel.upload_files(upload_path, files, file_action)
    render json: result, status: :ok
  end

  def preview
    file = params[:file]
    file_path = FilesModel.get_file_path(file)

    begin
      if !File.exist?(file_path) || !FilesModel.text_file?(file_path)
        render json: { error: '文件不存在或不是可预览的文本文件' }, status: :not_found
        return
      end

      content = File.read(file_path).force_encoding('UTF-8')
      render json: { content: content }, status: :ok
    rescue => e
      render json: { error: e.message }, status: :internal_server_error
    end
  end

  def delete
    paths = params[:paths]
    if paths.blank?
      render json: { error: '没有选择要删除的文件' }, status: :bad_request
      return
    end

    result = FilesModel.delete_files(paths)
    render json: result, status: :ok
  end

  def paste
    target_path = params[:targetPath]
    files = params[:files]
    operation = params[:operation]
    file_action = params[:fileAction]

    # 检查重名文件
    duplicate_files = FilesModel.check_duplicates(target_path, files)
    if duplicate_files.any? && file_action.nil?
      render json: { duplicate_files: duplicate_files }, status: :conflict
      return
    end

    result = FilesModel.paste_files(target_path, files, operation, file_action)
    render json: result, status: :ok
  end

  def check_duplicates
    target_path = params[:targetPath]
    files = params[:files]
    
    duplicate_files = FilesModel.check_duplicates(target_path, files)
    if duplicate_files.any?
      render json: { duplicate_files: duplicate_files }, status: :conflict
    else
      render json: { duplicate_files: [] }, status: :ok
    end
  end

  def download
    file_path = params[:id]
    full_path = FilesModel.get_file_path(file_path)
    
    if !File.exist?(full_path)
      render json: { error: '文件不存在' }, status: :not_found
      return
    end

    if File.directory?(full_path)
      result = FilesModel.download_directory(full_path)
    else
      result = FilesModel.download_file(full_path)
    end

    send_file result[:file_path],
              filename: result[:file_name],
              type: result[:content_type],
              disposition: 'attachment'
  end

  def download_multiple
    paths = params[:paths]
    if paths.blank?
      render json: { error: '没有选择要下载的文件' }, status: :bad_request
      return
    end

    result = FilesModel.download_multiple_files(paths)
    send_file result[:file_path],
              filename: result[:file_name],
              type: result[:content_type],
              disposition: 'attachment'
  end
end 