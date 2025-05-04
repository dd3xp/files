require 'securerandom'
require 'zip'

Zip.force_entry_names_encoding = 'UTF-8'
Zip.unicode_names = true

class FilesModel
  # 可预览的文本文件扩展名列表
  TEXT_EXTENSIONS = %w[
    .txt .md .json .xml .html .css .js .rb .py .java .c .cpp .h .hpp .cs .php .sql .sh .bat .ps1 .tsx .ts
  ]

  # 获取根目录路径
  def self.root_path
    begin
      config = Rails.application.config_for(:file_system)
      relative_path = config[:root_path]
      
      if relative_path.nil? || relative_path.empty?
        # 如果配置文件为空，使用默认的 public/root 目录
        default_path = File.expand_path('public/root', Rails.root)
        # 确保目录存在
        FileUtils.mkdir_p(default_path) unless Dir.exist?(default_path)
        return default_path
      end
      
      File.expand_path(relative_path, Rails.root)
    rescue => e
      # 如果读取配置失败，也使用默认路径
      default_path = File.expand_path('public/root', Rails.root)
      FileUtils.mkdir_p(default_path) unless Dir.exist?(default_path)
      default_path
    end
  end

  # 判断文件是否为可预览的文本文件
  def self.text_file?(file_path)
    TEXT_EXTENSIONS.include?(File.extname(file_path.to_s).downcase)
  end

  # 获取指定目录下的所有文件和文件夹
  def self.get_files_in_directory(path)
    full_path = File.join(root_path, path.gsub(/^\/+/, ''))
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

  # 获取文件路径
  def self.get_file_path(path)
    clean_path = path.to_s.gsub(/^\/+/, '')
    File.join(root_path, clean_path)
  end

  # 检查文件是否存在
  def self.file_exists?(path)
    File.exist?(get_file_path(path))
  end

  # 读取文件内容
  def self.read_file_content(file_path)
    return nil unless File.exist?(file_path) && text_file?(file_path)
    File.read(file_path.to_s).force_encoding('UTF-8')
  end

  # 删除文件或目录
  def self.delete_files(paths)
    deleted_files = []
    failed_files = []

    paths.each do |path|
      file_path = File.join(root_path, path.gsub(/^\/+/, ''))
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

  # 上传文件
  def self.upload_files(upload_path, files, file_action)
    unless Dir.exist?(upload_path)
      FileUtils.mkdir_p(upload_path)
    end

    uploaded_files = []
    skipped_files = []
    failed_files = []

    files.each do |file|
      file_path = File.join(upload_path, file.original_filename)
      
      if File.exist?(file_path)
        case file_action&.to_s&.downcase
        when 'replace'
          begin
            temp_path = File.join(upload_path, "temp_#{file.original_filename}")
            File.open(temp_path, 'wb') do |f|
              f.write(file.read)
            end
            uploaded_files << replace(temp_path, file_path, 'copy')
            FileUtils.rm(temp_path)
          rescue => e
            failed_files << file.original_filename
          end
        when 'skip'
          skipped_files << file.original_filename
        when 'rename'
          begin
            temp_path = File.join(upload_path, "temp_#{file.original_filename}")
            File.open(temp_path, 'wb') do |f|
              f.write(file.read)
            end
            uploaded_files << rename(temp_path, file_path, 'copy')
            FileUtils.rm(temp_path)
          rescue => e
            failed_files << file.original_filename
          end
        else
          skipped_files << file.original_filename
        end
      else
        begin
          File.open(file_path, 'wb') do |f|
            f.write(file.read)
          end
          uploaded_files << file.original_filename
        rescue => e
          failed_files << file.original_filename
        end
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

    { 
      message: message,
      uploaded: uploaded_files,
      skipped: skipped_files,
      failed: failed_files
    }
  end

  # 替换文件
  def self.replace(source_path, target_file, operation)
    FileUtils.rm(target_file)
    if operation == 'copy'
      FileUtils.cp(source_path, target_file)
    else
      FileUtils.mv(source_path, target_file)
    end
    File.basename(target_file)
  end

  # 重命名文件
  def self.rename(source_path, target_file, operation)
    base_name = File.basename(target_file, '.*')
    extension = File.extname(target_file)
    counter = 1
    new_target_file = target_file
    while File.exist?(new_target_file)
      new_name = "#{base_name}(#{counter})#{extension}"
      new_target_file = File.join(File.dirname(target_file), new_name)
      counter += 1
    end
    if operation == 'copy'
      FileUtils.cp(source_path, new_target_file)
    else
      FileUtils.mv(source_path, new_target_file)
    end
    File.basename(new_target_file)
  end

  # 复制或移动文件
  def self.copy_or_move(source_path, target_file, operation)
    if operation == 'copy'
      FileUtils.cp(source_path, target_file)
    else
      FileUtils.mv(source_path, target_file)
    end
    File.basename(target_file)
  end

  def self.paste_files(target_path, files, operation, file_action)
    pasted_files = []
    failed_files = []
    skipped_files = []

    target_dir = File.join(root_path, target_path.gsub(/^\/+/, ''))
    FileUtils.mkdir_p(target_dir) unless Dir.exist?(target_dir)

    files.each do |file|
      source_path = File.join(root_path, file[:path].gsub(/^\/+/, ''))
      file_name = File.basename(file[:path])
      target_file = File.join(target_dir, file_name)
      
      # 处理重名文件
      if File.exist?(target_file)
        case file_action.to_s.downcase
        when 'replace'
          begin
            pasted_files << replace(source_path, target_file, operation)
          rescue => e
            failed_files << file_name
          end
        when 'skip'
          skipped_files << file_name
        when 'rename'
          begin
            pasted_files << rename(source_path, target_file, operation)
          rescue => e
            failed_files << file_name
          end
        else
          skipped_files << file_name
        end
      else
        begin
          pasted_files << copy_or_move(source_path, target_file, operation)
        rescue => e
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
    target_dir = File.join(root_path, target_path.gsub(/^\/+/, ''))
    
    files.each do |file|
      file_name = File.basename(file[:path])
      target_file = File.join(target_dir, file_name)
      if File.exist?(target_file)
        duplicate_files << file_name
      end
    end
    
    duplicate_files
  end

  # 下载单个文件
  def self.download_file(file_path)
    if File.exist?(file_path)
      {
        file_path: file_path,
        file_name: File.basename(file_path),
        content_type: get_content_type(file_path)
      }
    else
      nil
    end
  end

  # 下载目录
  def self.download_directory(dir_path)
    if File.directory?(dir_path)
      zip_path = create_zip_from_directory(dir_path)
      {
        file_path: zip_path,
        file_name: "#{File.basename(dir_path)}.zip",
        content_type: 'application/zip'
      }
    else
      nil
    end
  end

  # 下载多个文件
  def self.download_multiple_files(paths)
    temp_dir = File.join(Rails.root, 'tmp', 'downloads')
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
      content_type: 'application/zip'
    }
  end

  # 添加目录到压缩包
  def self.add_directory_to_zip(zipfile, dir_path)
    Dir.glob("#{dir_path}/**/**").each do |file|
      next if File.directory?(file)
      file_in_zip = file.to_s.sub(root_path.to_s + '/', '')
      file_in_zip = file_in_zip.force_encoding('UTF-8').gsub('\\', '/')
      zipfile.add(file_in_zip, file) { |entry| entry.encoding = 'UTF-8' }
    end
  end

  # 添加文件到压缩包
  def self.add_file_to_zip(zipfile, file_path)
    file_in_zip = file_path.to_s.sub(root_path.to_s + '/', '')
    file_in_zip = file_in_zip.force_encoding('UTF-8').gsub('\\', '/')
    zipfile.add(file_in_zip, file_path) { |entry| entry.encoding = 'UTF-8' }
  end

  # 获取文件类型
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

  # 创建目录压缩包
  def self.create_zip_from_directory(dir_path)
    temp_dir = File.join(Rails.root, 'tmp', 'downloads')
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