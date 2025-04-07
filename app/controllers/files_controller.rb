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
    begin
      Rails.logger.info "开始处理文件粘贴"
      Rails.logger.info "粘贴参数: #{params.inspect}"

      files = params[:files]
      target_path = params[:targetPath]
      operation = params[:operation]
      action = params[:action] # 'replace', 'skip', 'rename'

      if files.blank?
        render json: { error: '没有要粘贴的文件' }, status: :bad_request
        return
      end

      if target_path.blank?
        render json: { error: '目标路径不能为空' }, status: :bad_request
        return
      end

      target_dir = Rails.root.join('public', 'root', target_path.gsub(/^\/+/, ''))
      Rails.logger.info "目标目录: #{target_dir}"

      unless Dir.exist?(target_dir)
        Rails.logger.info "创建目标目录: #{target_dir}"
        FileUtils.mkdir_p(target_dir)
      end

      # 检查重名文件
      duplicate_files = []
      files.each do |file|
        target_file = File.join(target_dir, file['name'])
        Rails.logger.info "检查文件: #{target_file}"
        if File.exist?(target_file)
          Rails.logger.info "发现重名文件: #{file['name']}"
          duplicate_files << file['name']
        end
      end

      Rails.logger.info "重名文件列表: #{duplicate_files.inspect}"

      # 如果有重名文件且没有指定处理方式，返回重名文件列表
      if duplicate_files.any? && action.blank?
        Rails.logger.info "返回重名文件列表，状态码: 409"
        render json: { 
          error: '存在重名文件',
          duplicate_files: duplicate_files
        }, status: :conflict
        return
      end

      pasted_files = []
      failed_files = []

      files.each do |file|
        source_path = Rails.root.join('public', 'root', file['path'].gsub(/^\/+/, ''))
        target_file = File.join(target_dir, file['name'])

        # 检查源文件和目标文件是否相同
        if source_path.to_s == target_file.to_s
          failed_files << "#{file['name']} (源文件和目标文件相同)"
          next
        end

        # 处理重名文件
        if File.exist?(target_file)
          case action
          when 'replace'
            # 直接替换
            Rails.logger.info "替换文件: #{target_file}"
            FileUtils.rm_rf(target_file) if File.directory?(target_file)
            FileUtils.rm(target_file) if File.file?(target_file)
          when 'skip'
            # 跳过重名文件
            Rails.logger.info "跳过文件: #{target_file}"
            next
          when 'rename'
            # 重命名文件
            Rails.logger.info "重命名文件: #{target_file}"
            base_name = File.basename(file['name'], '.*')
            extension = File.extname(file['name'])
            counter = 1
            while File.exist?(target_file)
              target_file = File.join(target_dir, "#{base_name}_#{counter}#{extension}")
              counter += 1
            end
          end
        end

        if File.exist?(source_path)
          if operation == 'copy'
            if file['isDirectory']
              FileUtils.cp_r(source_path, target_file)
            else
              FileUtils.cp(source_path, target_file)
            end
          elsif operation == 'cut'
            if file['isDirectory']
              FileUtils.mv(source_path, target_file)
            else
              FileUtils.mv(source_path, target_file)
            end
          end
          pasted_files << File.basename(target_file)
        else
          failed_files << file['name']
        end
      end

      if failed_files.any?
        render json: { 
          message: '部分文件粘贴成功',
          pasted: pasted_files,
          failed: failed_files
        }, status: :partial_content
      else
        render json: { 
          message: '文件粘贴成功',
          pasted: pasted_files
        }
      end
    rescue => e
      Rails.logger.error "文件粘贴失败: #{e.message}"
      Rails.logger.error e.backtrace.join("\n")
      render json: { error: "文件粘贴失败: #{e.message}" }, status: :internal_server_error
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