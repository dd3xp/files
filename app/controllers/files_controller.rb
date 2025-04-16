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

  def download
    file_path = params[:id]
    Rails.logger.info "=== Download Request ==="
    Rails.logger.info "Raw file path: #{file_path.inspect}"
    Rails.logger.info "Decoded file path: #{CGI.unescape(file_path)}"
    full_path = FilesModel.get_file_path(file_path)
    Rails.logger.info "Full path: #{full_path}"
    Rails.logger.info "File exists: #{File.exist?(full_path)}"
    Rails.logger.info "Directory exists: #{Dir.exist?(full_path)}"
    result = FilesModel.handle_download([file_path])
    Rails.logger.info "Download result: #{result.inspect}"
    
    if result[:status] == :ok
      send_file result[:file_path],
                filename: result[:file_name],
                type: result[:content_type],
                disposition: 'attachment'
    else
      render json: { error: result[:error] }, status: result[:status]
    end
  end

  def download_multiple
    paths = params[:paths]
    Rails.logger.info "=== Download Multiple Request ==="
    Rails.logger.info "Raw paths: #{paths.inspect}"
    paths.each do |path|
      Rails.logger.info "=== Processing path ==="
      Rails.logger.info "Raw path: #{path.inspect}"
      Rails.logger.info "Decoded path: #{CGI.unescape(path)}"
      full_path = FilesModel.get_file_path(path)
      Rails.logger.info "Full path: #{full_path}"
      Rails.logger.info "File exists: #{File.exist?(full_path)}"
      Rails.logger.info "Directory exists: #{Dir.exist?(full_path)}"
    end
    result = FilesModel.handle_download(paths)
    Rails.logger.info "Download result: #{result.inspect}"
    
    if result[:status] == :ok
      send_file result[:file_path],
                filename: result[:file_name],
                type: result[:content_type],
                disposition: 'attachment'
    else
      render json: { error: result[:error] }, status: result[:status]
    end
  end
end 