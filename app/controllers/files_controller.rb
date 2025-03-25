class FilesController < ApplicationController
  def index
    @title = "文件管理"
    @message = "文件管理页面"
    @current_path = params[:path] || '/'
    @files = get_files_in_directory(@current_path)
  end

  private

  def get_files_in_directory(path)
    full_path = Rails.root.join('public', 'root', path.gsub(/^\/+/, ''))
    return [] unless Dir.exist?(full_path)

    Dir.entries(full_path).map do |entry|
      next if entry.start_with?('.')
      full_entry_path = File.join(full_path, entry)
      {
        name: entry,
        path: File.join(path, entry),
        is_directory: File.directory?(full_entry_path),
        size: File.size(full_entry_path),
        modified: File.mtime(full_entry_path),
        icon: get_file_icon(entry)
      }
    end.compact
  end

  def get_file_icon(filename)
    extension = File.extname(filename).downcase
    case extension
    when '.txt'
      'fa-file-alt'
    when '.pdf'
      'fa-file-pdf'
    when '.doc', '.docx'
      'fa-file-word'
    when '.xls', '.xlsx'
      'fa-file-excel'
    when '.ppt', '.pptx'
      'fa-file-powerpoint'
    when '.jpg', '.jpeg', '.png', '.gif', '.bmp'
      'fa-file-image'
    when '.zip', '.rar', '.7z', '.tar', '.gz'
      'fa-file-archive'
    when '.mp4', '.avi', '.mov', '.wmv'
      'fa-file-video'
    when '.mp3', '.wav', '.ogg'
      'fa-file-audio'
    when '.html', '.htm', '.css', '.js', '.php', '.py', '.rb', '.java', '.cpp', '.c', '.h'
      'fa-file-code'
    else
      'fa-file'
    end
  end
end 