class User
  include ActiveModel::Model
  include ActiveModel::Attributes
  include ActiveModel::Validations
  include ActiveModel::SecurePassword

  attribute :username, :string
  attribute :password_digest, :string
  attribute :password, :string, default: nil

  validates :username, presence: true
  validates :password, presence: true, length: { minimum: 6 }, if: :password_required?

  has_secure_password

  def self.find_by_username(username)
    users = load_users
    user_data = users[username]
    return nil unless user_data

    new(username: username, password_digest: user_data['password_digest'])
  end

  def self.save_user(username, password)
    users = load_users
    # 检查用户名是否已存在
    return false if users.key?(username)
    
    user = new(username: username, password: password)
    return false unless user.valid?

    users[username] = { 'password_digest' => user.password_digest }
    save_users(users)
    true
  end

  def self.load_users
    file_path = Rails.root.join('config', 'users.yml')
    return {} unless File.exist?(file_path)

    YAML.load_file(file_path, permitted_classes: [BCrypt::Password], aliases: true) || {}
  end

  def self.save_users(users)
    file_path = Rails.root.join('config', 'users.yml')
    File.write(file_path, users.to_yaml)
  end

  private

  def password_required?
    password.present? || password_digest.blank?
  end
end 