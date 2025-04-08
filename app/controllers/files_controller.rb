class FilesController < ApplicationController
  def index
    @title = "文件管理"
    @message = "文件管理页面"
    @current_path = params[:path] || '/'
    @files = get_files_in_directory(@current_path)
  end

  def upload
    begin
      Rails.logger.info "开始处理文件上传"
      Rails.logger.info "上传路径参数: #{params[:path]}"
      Rails.logger.info "文件参数: #{params[:files]&.map(&:original_filename)}"

      upload_path = Rails.root.join('public', 'root', params[:path].to_s.sub(/^\//, ''))
      Rails.logger.info "目标上传路径: #{upload_path}"

      unless Dir.exist?(upload_path)
        Rails.logger.info "创建目录: #{upload_path}"
        FileUtils.mkdir_p(upload_path)
      end

      if params[:files].nil?
        Rails.logger.warn "没有接收到文件"
        render json: { error: '没有选择文件' }, status: :bad_request
        return
      end

      uploaded_files = []
      params[:files].each do |file|
        file_path = File.join(upload_path, file.original_filename)
        Rails.logger.info "正在保存文件: #{file_path}"
        
        File.open(file_path, 'wb') do |f|
          f.write(file.read)
        end
        uploaded_files << file.original_filename
      end

      Rails.logger.info "文件上传成功: #{uploaded_files.join(', ')}"
      render json: { message: '文件上传成功', files: uploaded_files }
    rescue => e
      Rails.logger.error "文件上传失败: #{e.message}"
      Rails.logger.error e.backtrace.join("\n")
      render json: { error: "文件上传失败: #{e.message}" }, status: :internal_server_error
    end
  end

  def preview
    begin
      file_path = Rails.root.join('public', 'root', params[:file].gsub(/^\/+/, ''))
      if File.exist?(file_path) && text_file?(file_path)
        content = File.read(file_path)
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

      deleted_files = []
      failed_files = []

      paths.each do |path|
        file_path = Rails.root.join('public', 'root', path.gsub(/^\/+/, ''))
        if File.exist?(file_path)
          if File.directory?(file_path)
            FileUtils.rm_rf(file_path)
          else
            File.delete(file_path)
          end
          deleted_files << path
        else
          failed_files << path
        end
      end

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
    Rails.logger.info "=== Paste Operation Start ==="
    Rails.logger.info "Parameters:"
    Rails.logger.info "  target_path: #{target_path}"
    Rails.logger.info "  operation: #{operation}"
    Rails.logger.info "  file_action: #{file_action.inspect}"
    Rails.logger.info "  file_action.class: #{file_action.class}"
    Rails.logger.info "  files: #{files.inspect}"

    # 检查重名文件
    duplicate_files = []
    files.each do |file|
      file_name = File.basename(file[:path])
      target_file = File.join('public/root', target_path, file_name)
      if File.exist?(target_file)
        duplicate_files << file_name
        Rails.logger.info "Found duplicate file: #{file_name}"
      end
    end

    if duplicate_files.any? && file_action.nil?
      Rails.logger.info "Found duplicates but no action specified, returning conflict"
      render json: { duplicate_files: duplicate_files }, status: :conflict
    else
      pasted_files = []
      failed_files = []
      skipped_files = []

      files.each do |file|
        source_path = File.join('public/root', file[:path])
        file_name = File.basename(file[:path])
        target_file = File.join('public/root', target_path, file_name)

        Rails.logger.info "=== Processing file: #{file_name} ==="
        Rails.logger.info "  source_path: #{source_path}"
        Rails.logger.info "  target_file: #{target_file}"
        Rails.logger.info "  file_action: #{file_action.inspect}"
        Rails.logger.info "  file_action.class: #{file_action.class}"

        # 处理重名文件
        if File.exist?(target_file)
          Rails.logger.info "  File exists, handling with action: #{file_action.inspect}"
          case file_action.to_s.downcase
          when 'replace'
            Rails.logger.info "  Replacing file..."
            begin
              FileUtils.rm(target_file)
              if operation == 'copy'
                Rails.logger.info "  Copying file..."
                FileUtils.cp(source_path, target_file)
              else
                Rails.logger.info "  Moving file..."
                FileUtils.mv(source_path, target_file)
              end
              pasted_files << File.basename(target_file)
              Rails.logger.info "  File replaced successfully"
            rescue => e
              Rails.logger.error "  Error replacing file: #{e.message}"
              failed_files << file_name
            end
          when 'skip'
            Rails.logger.info "  Skipping file..."
            skipped_files << file_name
          when 'rename'
            Rails.logger.info "  Renaming file..."
            begin
              base_name = File.basename(file_name, '.*')
              extension = File.extname(file_name)
              counter = 1
              new_target_file = target_file
              while File.exist?(new_target_file)
                new_name = "#{base_name}(#{counter})#{extension}"
                new_target_file = File.join('public/root', target_path, new_name)
                counter += 1
              end
              Rails.logger.info "  New file name: #{File.basename(new_target_file)}"
              if operation == 'copy'
                Rails.logger.info "  Copying file..."
                FileUtils.cp(source_path, new_target_file)
              else
                Rails.logger.info "  Moving file..."
                FileUtils.mv(source_path, new_target_file)
              end
              pasted_files << File.basename(new_target_file)
              Rails.logger.info "  File renamed successfully"
            rescue => e
              Rails.logger.error "  Error renaming file: #{e.message}"
              failed_files << file_name
            end
          else
            Rails.logger.info "  No valid action specified (#{file_action.inspect}), skipping file"
            skipped_files << file_name
          end
        else
          Rails.logger.info "  File doesn't exist, performing direct operation"
          begin
            if operation == 'copy'
              Rails.logger.info "  Copying file..."
              FileUtils.cp(source_path, target_file)
            else
              Rails.logger.info "  Moving file..."
              FileUtils.mv(source_path, target_file)
            end
            pasted_files << File.basename(target_file)
            Rails.logger.info "  Operation completed successfully"
          rescue => e
            Rails.logger.error "  Error performing operation: #{e.message}"
            failed_files << file_name
          end
        end
      end

      # 根据不同的情况返回不同的消息
      if pasted_files.any?
        message = '文件粘贴成功'
        if skipped_files.any?
          message += "，跳过了 #{skipped_files.length} 个文件"
        end
      elsif skipped_files.any?
        message = "已跳过 #{skipped_files.length} 个文件"
      else
        message = '粘贴失败'
      end

      Rails.logger.info "=== Paste Operation Complete ==="
      Rails.logger.info "Result:"
      Rails.logger.info "  message: #{message}"
      Rails.logger.info "  pasted: #{pasted_files.inspect}"
      Rails.logger.info "  skipped: #{skipped_files.inspect}"
      Rails.logger.info "  failed: #{failed_files.inspect}"

      render json: { 
        message: message,
        pasted: pasted_files,
        skipped: skipped_files,
        failed: failed_files
      }
    end
  end

  def check_duplicates
    target_path = params[:targetPath]
    files = params[:files]
    
    duplicate_files = []
    files.each do |file|
      file_name = File.basename(file[:path])
      target_file = File.join('public/root', target_path, file_name)
      if File.exist?(target_file)
        duplicate_files << file_name
      end
    end
    
    if duplicate_files.any?
      render json: { duplicate_files: duplicate_files }, status: :conflict
    else
      render json: { duplicate_files: [] }, status: :ok
    end
  end

  private

  def text_file?(file_path)
    # 可预览的文本文件扩展名列表
    text_extensions = %w[
      .txt .md .json .xml .html .css .js .rb .py .java .c .cpp .h .hpp .cs .php .sql .sh .bat .ps1
    ]
    text_extensions.include?(File.extname(file_path).downcase)
  end

  def get_files_in_directory(path)
    full_path = Rails.root.join('public', 'root', path.gsub(/^\/+/, ''))
    return [] unless Dir.exist?(full_path)

    files = []
    Dir.entries(full_path).each do |entry|
      next if entry == '.' || entry == '..'
      
      file_path = File.join(full_path, entry)
      is_directory = File.directory?(file_path)
      
      files << {
        id: SecureRandom.hex(4),
        name: entry,
        path: File.join(path, entry).gsub(/\/+/, '/'),
        size: is_directory ? 0 : File.size(file_path),
        modified: File.mtime(file_path),
        is_directory: is_directory,
        icon: is_directory ? 'fa-folder' : get_file_icon(entry),
        previewable: !is_directory && text_file?(file_path)
      }
    end
    
    # 按目录在前，文件在后的顺序排序
    files.sort_by { |f| [f[:is_directory] ? 0 : 1, f[:name].downcase] }
  end

  def get_file_icon(filename)
    extension = File.extname(filename).downcase
    case extension
    when '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'
      'fa-image'
    when '.mp4', '.avi', '.mov', '.wmv', '.flv', '.mkv'
      'fa-video'
    when '.mp3', '.wav', '.ogg', '.flac', '.m4a'
      'fa-music'
    when '.pdf'
      'fa-file-pdf'
    when '.doc', '.docx'
      'fa-file-word'
    when '.xls', '.xlsx'
      'fa-file-excel'
    when '.ppt', '.pptx'
      'fa-file-powerpoint'
    when '.zip', '.rar', '.7z', '.tar', '.gz'
      'fa-file-archive'
    when '.txt', '.md', '.json', '.xml', '.html', '.css', '.js', '.rb', '.py', '.java', '.c', '.cpp', '.h', '.hpp', '.cs', '.php', '.sql', '.sh', '.bat', '.ps1'
      'fa-file-code'
    else
      'fa-file'
    end
  end
end 