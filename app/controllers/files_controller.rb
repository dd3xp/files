class FilesController < ApplicationController
  def index
    @title = "文件管理"
    @message = "文件管理页面"
    @current_path = params[:path] || '/'
    @files = FilesModel.get_files_in_directory(@current_path)
  end

  def upload
    begin
      Rails.logger.info "开始处理文件上传"
      Rails.logger.info "上传路径参数: #{params[:path]}"
      Rails.logger.info "文件参数: #{params[:files]&.map(&:original_filename)}"
      Rails.logger.info "文件操作参数: #{params[:fileAction]}"

      upload_path = Rails.root.join('public', 'root', params[:path].to_s.sub(/^\//, ''))
      Rails.logger.info "目标上传路径: #{upload_path}"

      if params[:files].nil?
        Rails.logger.warn "没有接收到文件"
        render json: { error: '没有选择文件' }, status: :bad_request
        return
      end

      result = FilesModel.upload_files(upload_path, params[:files], params[:fileAction])
      
      render json: result
    rescue => e
      Rails.logger.error "文件上传失败: #{e.message}"
      Rails.logger.error e.backtrace.join("\n")
      render json: { error: "文件上传失败: #{e.message}" }, status: :internal_server_error
    end
  end

  def preview
    begin
      file_path = FilesModel.get_file_path(params[:file])
      if FilesModel.file_exists?(file_path) && FilesModel.text_file?(file_path)
        content = FilesModel.read_file_content(file_path)
        render json: { content: content }
      else
        render json: { error: '文件不存在或不是可预览的文本文件' }, status: :not_found
      end
    rescue => e
      render json: { error: '无效的文件路径' }, status: :bad_request
    end
  end

  def delete
    begin
      paths = params[:paths]
      if paths.blank?
        render json: { error: '没有选择要删除的文件' }, status: :bad_request
        return
      end

      result = FilesModel.delete_files(paths)
      deleted_files = result[:deleted]
      failed_files = result[:failed]

      if failed_files.any?
        render json: { 
          message: '部分文件删除成功',
          deleted: deleted_files,
          failed: failed_files
        }, status: :partial_content
      else
        render json: { 
          message: '文件删除成功',
          deleted: deleted_files
        }
      end
    rescue => e
      Rails.logger.error "文件删除失败: #{e.message}"
      Rails.logger.error e.backtrace.join("\n")
      render json: { error: "文件删除失败: #{e.message}" }, status: :internal_server_error
    end
  end

  def paste
    target_path = params[:targetPath]
    files = params[:files]
    operation = params[:operation]
    file_action = params[:fileAction]

    Rails.logger.info "=== Raw Parameters ==="
    Rails.logger.info params.inspect

    result = FilesModel.paste_files(target_path, files, operation, file_action)
    
    if result[:status] == :conflict
      render json: { duplicate_files: result[:duplicate_files] }, status: :conflict
    else
      render json: result
    end
  end

  def check_duplicates
    target_path = params[:targetPath]
    files = params[:files]
    
    result = FilesModel.check_duplicates(target_path, files)
    duplicate_files = result[:duplicate_files]
    
    if duplicate_files.any?
      render json: { duplicate_files: duplicate_files }, status: :conflict
    else
      render json: { duplicate_files: [] }, status: :ok
    end
  end
end 