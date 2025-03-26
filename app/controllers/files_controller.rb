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
    when '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg', '.ico'
      'fa-file-image'
    when '.zip', '.rar', '.7z', '.tar', '.gz'
      'fa-file-archive'
    when '.mp4', '.avi', '.mov', '.wmv', '.flv', '.mkv', '.webm', '.m4v'
      'fa-file-video'
    when '.mp3', '.wav', '.ogg', '.flac', '.m4a', '.aac', '.wma'
      'fa-file-audio'
    when '.html', '.htm'
      'fa-file-code'
    when '.css'
      'fa-file-code'
    when '.js', '.ts', '.jsx', '.tsx'
      'fa-file-code'
    when '.php'
      'fa-file-code'
    when '.py'
      'fa-file-code'
    when '.rb'
      'fa-file-code'
    when '.java'
      'fa-file-code'
    when '.cpp', '.c', '.h', '.hpp'
      'fa-file-code'
    when '.go'
      'fa-file-code'
    when '.rs'
      'fa-file-code'
    when '.cs'
      'fa-file-code'
    when '.swift'
      'fa-file-code'
    when '.kt'
      'fa-file-code'
    when '.scala'
      'fa-file-code'
    when '.r'
      'fa-file-code'
    when '.sql'
      'fa-file-code'
    when '.vue'
      'fa-file-code'
    when '.svelte'
      'fa-file-code'
    when '.ex', '.erl'
      'fa-file-code'
    when '.hs'
      'fa-file-code'
    when '.ml'
      'fa-file-code'
    when '.clj'
      'fa-file-code'
    when '.lua'
      'fa-file-code'
    when '.pl'
      'fa-file-code'
    when '.rkt'
      'fa-file-code'
    when '.dart'
      'fa-file-code'
    when '.nim'
      'fa-file-code'
    when '.zig'
      'fa-file-code'
    when '.v'
      'fa-file-code'
    when '.cr'
      'fa-file-code'
    else
      'fa-file'
    end
  end
end 