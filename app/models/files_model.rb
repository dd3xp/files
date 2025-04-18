require 'securerandom'
require 'zip'

# 设置 ZIP 文件名的编码
Zip.force_entry_names_encoding = 'UTF-8'
# 设置 ZIP 文件名使用 Unicode
Zip.unicode_names = true

class FilesModel
  # 可预览的文本文件扩展名列表
  TEXT_EXTENSIONS = %w[
    .txt .md .json .xml .html .css .js .rb .py .java .c .cpp .h .hpp .cs .php .sql .sh .bat .ps1 .tsx .ts
  ]

  # 判断文件是否为可预览的文本文件
  def self.text_file?(file_path)
    TEXT_EXTENSIONS.include?(File.extname(file_path).downcase)
  end

  # 获取指定目录下的所有文件和文件夹
  def self.get_files_in_directory(path)
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

  # 获取文件图标
  def self.get_file_icon(filename)
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
    when '.txt', '.md', '.json', '.xml', '.html', '.css', '.js', '.rb', '.py', '.java', '.c', '.cpp', '.h', '.hpp', '.cs', '.php', '.sql', '.sh', '.bat', '.ps1', '.tsx', '.ts'
      'fa-file-code'
    else
      'fa-file'
    end
  end

  # 读取文件内容
  def self.read_file_content(file_path)
    File.read(file_path) if File.exist?(file_path) && text_file?(file_path)
  end

  # 删除文件或目录
  def self.delete_files(paths)
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

    { deleted: deleted_files, failed: failed_files }
  end

  # 检查文件是否存在
  def self.file_exists?(path)
    file_path = Rails.root.join('public', 'root', path.gsub(/^\/+/, ''))
    File.exist?(file_path)
  end

  # 获取文件路径
  def self.get_file_path(path)
    Rails.root.join('public', 'root', path.gsub(/^\/+/, ''))
  end

  # 上传文件
  def self.upload_files(upload_path, files, file_action)
    Rails.logger.info "开始处理文件上传"
    Rails.logger.info "上传路径: #{upload_path}"
    Rails.logger.info "文件数量: #{files&.size}"
    Rails.logger.info "文件操作: #{file_action}"

    # 确保上传目录存在
    unless Dir.exist?(upload_path)
      Rails.logger.info "创建目录: #{upload_path}"
      FileUtils.mkdir_p(upload_path)
    end

    uploaded_files = []
    skipped_files = []
    failed_files = []

    files.each do |file|
      file_path = File.join(upload_path, file.original_filename)
      Rails.logger.info "正在处理文件: #{file_path}"
      
      if File.exist?(file_path)
        case file_action&.to_s&.downcase
        when 'replace'
          Rails.logger.info "替换已存在的文件: #{file_path}"
          File.open(file_path, 'wb') do |f|
            f.write(file.read)
          end
          uploaded_files << file.original_filename
        when 'skip'
          Rails.logger.info "跳过已存在的文件: #{file_path}"
          skipped_files << file.original_filename
        when 'rename'
          Rails.logger.info "重命名文件: #{file_path}"
          base_name = File.basename(file.original_filename, '.*')
          extension = File.extname(file.original_filename)
          counter = 1
          new_file_path = file_path
          while File.exist?(new_file_path)
            new_name = "#{base_name}(#{counter})#{extension}"
            new_file_path = File.join(upload_path, new_name)
            counter += 1
          end
          Rails.logger.info "新文件路径: #{new_file_path}"
          File.open(new_file_path, 'wb') do |f|
            f.write(file.read)
          end
          uploaded_files << File.basename(new_file_path)
        else
          Rails.logger.warn "未指定文件操作方式，跳过文件: #{file_path}"
          skipped_files << file.original_filename
        end
      else
        Rails.logger.info "保存新文件: #{file_path}"
        File.open(file_path, 'wb') do |f|
          f.write(file.read)
        end
        uploaded_files << file.original_filename
      end
    end

    message = if uploaded_files.any?
      if skipped_files.any?
        "文件上传成功，跳过了 #{skipped_files.length} 个文件"
      else
        "文件上传成功"
      end
    elsif skipped_files.any?
      "已跳过 #{skipped_files.length} 个文件"
    else
      "上传失败"
    end

    Rails.logger.info "文件上传完成: #{message}"
    { 
      message: message,
      uploaded: uploaded_files,
      skipped: skipped_files,
      failed: failed_files
    }
  end

  # 粘贴文件
  def self.paste_files(target_path, files, operation, file_action)
    Rails.logger.info "=== Paste Operation Start ==="
    Rails.logger.info "Parameters:"
    Rails.logger.info "  target_path: #{target_path}"
    Rails.logger.info "  operation: #{operation}"
    Rails.logger.info "  file_action: #{file_action.inspect}"
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
      return { duplicate_files: duplicate_files, status: :conflict }
    end

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

    { 
      message: message,
      pasted: pasted_files,
      skipped: skipped_files,
      failed: failed_files
    }
  end

  # 检查重名文件
  def self.check_duplicates(target_path, files)
    duplicate_files = []
    files.each do |file|
      file_name = File.basename(file[:path])
      target_file = File.join('public/root', target_path, file_name)
      if File.exist?(target_file)
        duplicate_files << file_name
      end
    end
    
    { duplicate_files: duplicate_files }
  end

  # 处理文件上传
  def self.handle_upload(path, files, file_action)
    Rails.logger.info "开始处理文件上传"
    Rails.logger.info "上传路径参数: #{path}"
    Rails.logger.info "文件参数: #{files&.map(&:original_filename)}"
    Rails.logger.info "文件操作参数: #{file_action}"

    if files.nil?
      Rails.logger.warn "没有接收到文件"
      return { error: '没有选择文件', status: :bad_request }
    end

    upload_path = Rails.root.join('public', 'root', path.to_s.sub(/^\//, ''))
    Rails.logger.info "目标上传路径: #{upload_path}"

    begin
      result = upload_files(upload_path, files, file_action)
      result[:status] = :ok
      result
    rescue => e
      Rails.logger.error "文件上传失败: #{e.message}"
      Rails.logger.error e.backtrace.join("\n")
      { error: "文件上传失败: #{e.message}", status: :internal_server_error }
    end
  end

  # 处理文件预览
  def self.handle_preview(file)
    begin
      file_path = get_file_path(file)
      if file_exists?(file_path) && text_file?(file_path)
        content = read_file_content(file_path)
        { content: content, status: :ok }
      else
        { error: '文件不存在或不是可预览的文本文件', status: :not_found }
      end
    rescue => e
      { error: '无效的文件路径', status: :bad_request }
    end
  end

  # 处理文件删除
  def self.handle_delete(paths)
    if paths.blank?
      return { error: '没有选择要删除的文件', status: :bad_request }
    end

    begin
      result = delete_files(paths)
      deleted_files = result[:deleted]
      failed_files = result[:failed]

      if failed_files.any?
        {
          message: '部分文件删除成功',
          deleted: deleted_files,
          failed: failed_files,
          status: :partial_content
        }
      else
        {
          message: '文件删除成功',
          deleted: deleted_files,
          status: :ok
        }
      end
    rescue => e
      Rails.logger.error "文件删除失败: #{e.message}"
      Rails.logger.error e.backtrace.join("\n")
      { error: "文件删除失败: #{e.message}", status: :internal_server_error }
    end
  end

  # 处理文件粘贴
  def self.handle_paste(target_path, files, operation, file_action)
    Rails.logger.info "=== Raw Parameters ==="
    Rails.logger.info "target_path: #{target_path}"
    Rails.logger.info "files: #{files.inspect}"
    Rails.logger.info "operation: #{operation}"
    Rails.logger.info "file_action: #{file_action}"

    begin
      result = paste_files(target_path, files, operation, file_action)
      if result[:status] == :conflict
        { duplicate_files: result[:duplicate_files], status: :conflict }
      else
        result[:status] = :ok
        result
      end
    rescue => e
      Rails.logger.error "文件粘贴失败: #{e.message}"
      Rails.logger.error e.backtrace.join("\n")
      { error: "文件粘贴失败: #{e.message}", status: :internal_server_error }
    end
  end

  # 处理重名文件检查
  def self.handle_check_duplicates(target_path, files)
    begin
      result = check_duplicates(target_path, files)
      duplicate_files = result[:duplicate_files]
      
      if duplicate_files.any?
        { duplicate_files: duplicate_files, status: :conflict }
      else
        { duplicate_files: [], status: :ok }
      end
    rescue => e
      Rails.logger.error "检查重名文件失败: #{e.message}"
      Rails.logger.error e.backtrace.join("\n")
      { error: "检查重名文件失败: #{e.message}", status: :internal_server_error }
    end
  end

  def self.handle_download(paths)
    if paths.blank?
      return { error: '没有选择要下载的文件', status: :bad_request }
    end

    begin
      # 如果只选择了一个文件且不是目录，直接下载
      if paths.size == 1
        path = paths.first
        file_path = get_file_path(path)
        if File.directory?(file_path)
          return download_directory(file_path)
        else
          return download_file(file_path)
        end
      end

      # 如果选择了多个文件或包含目录，创建压缩包
      download_multiple_files(paths)
    rescue => e
      Rails.logger.error "文件下载失败: #{e.message}"
      Rails.logger.error e.backtrace.join("\n")
      { error: "文件下载失败: #{e.message}", status: :internal_server_error }
    end
  end

  def self.download_file(file_path)
    if File.exist?(file_path)
      {
        file_path: file_path,
        file_name: File.basename(file_path),
        content_type: get_content_type(file_path),
        status: :ok
      }
    else
      { error: '文件不存在', status: :not_found }
    end
  end

  def self.download_directory(dir_path)
    if File.directory?(dir_path)
      zip_path = create_zip_from_directory(dir_path)
      {
        file_path: zip_path,
        file_name: "#{File.basename(dir_path)}.zip",
        content_type: 'application/zip',
        status: :ok
      }
    else
      { error: '目录不存在', status: :not_found }
    end
  end

  def self.download_multiple_files(paths)
    temp_dir = Rails.root.join('tmp', 'downloads')
    FileUtils.mkdir_p(temp_dir)
    
    zip_path = File.join(temp_dir, "download_#{Time.now.to_i}.zip")
    
    Zip::File.open(zip_path, Zip::File::CREATE) do |zipfile|
      paths.each do |path|
        file_path = get_file_path(path)
        if File.directory?(file_path)
          add_directory_to_zip(zipfile, file_path)
        else
          add_file_to_zip(zipfile, file_path)
        end
      end
    end

    {
      file_path: zip_path,
      file_name: "download_#{Time.now.to_i}.zip",
      content_type: 'application/zip',
      status: :ok
    }
  end

  def self.add_directory_to_zip(zipfile, dir_path)
    Dir.glob("#{dir_path}/**/**").each do |file|
      next if File.directory?(file)
      file_in_zip = file.sub("#{Rails.root}/public/root/", '')
      # 使用 UTF-8 编码处理文件名，并确保路径分隔符统一
      file_in_zip = file_in_zip.force_encoding('UTF-8').gsub('\\', '/')
      # 使用 add 方法，并设置编码
      zipfile.add(file_in_zip, file) { |entry| entry.encoding = 'UTF-8' }
    end
  end

  def self.add_file_to_zip(zipfile, file_path)
    file_in_zip = file_path.sub("#{Rails.root}/public/root/", '')
    # 使用 UTF-8 编码处理文件名，并确保路径分隔符统一
    file_in_zip = file_in_zip.force_encoding('UTF-8').gsub('\\', '/')
    # 使用 add 方法，并设置编码
    zipfile.add(file_in_zip, file_path) { |entry| entry.encoding = 'UTF-8' }
  end

  def self.get_content_type(file_path)
    extension = File.extname(file_path).downcase
    case extension
    when '.jpg', '.jpeg'
      'image/jpeg'
    when '.png'
      'image/png'
    when '.gif'
      'image/gif'
    when '.pdf'
      'application/pdf'
    when '.doc', '.docx'
      'application/msword'
    when '.xls', '.xlsx'
      'application/vnd.ms-excel'
    when '.ppt', '.pptx'
      'application/vnd.ms-powerpoint'
    when '.zip'
      'application/zip'
    else
      'application/octet-stream'
    end
  end

  def self.create_zip_from_directory(dir_path)
    temp_dir = Rails.root.join('tmp', 'downloads')
    FileUtils.mkdir_p(temp_dir)
    
    # 使用 UTF-8 编码处理压缩包名称
    zip_name = "#{File.basename(dir_path).force_encoding('UTF-8')}_#{Time.now.to_i}.zip"
    zip_path = File.join(temp_dir, zip_name)
    
    Zip::File.open(zip_path, Zip::File::CREATE) do |zipfile|
      add_directory_to_zip(zipfile, dir_path)
    end

    zip_path
  end
end 