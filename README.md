# FileTransfer

一个基于 Ruby on Rails 8.0 的文件传输应用。
## 安装步骤

1. 克隆项目：
```bash
git clone [项目地址]
cd FileTransfer
```

2. 安装依赖：
```bash
bundle install
```

3. 配置域名/IP地址：
在 `config/environments/development.rb` 文件中添加以下配置：
```ruby
config.hosts << "your-IP-address"  # 替换为你的域名或IP地址
```

4. 启动开发服务器：
```bash
rails server
```