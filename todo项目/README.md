# TODO 待办事项管理系统

做了一个基于 Java Web 技术栈的待办事项管理系统，提供用户注册登录、任务管理、日历视图和 AI 助手等功能。
ai助手能够进行增删改查。用户与用户之间做了数据隔离。相较于上一版本的todolist，这一版本加入了更多的互动样式，提升了页面美观度。
相应todo状态逻辑也更加完善了
1. 状态判定基准：以「当前系统的真实北京时间」与Todo的「截至时间」对比为核心依据
2. 过期Todo状态自动更新规则：
   - 场景1：若Todo的「截至时间」< 当前时间，且Todo原状态为「待完成」→ 强制自动更新为「未完成」（禁止保留「待完成」状态）
   - 场景2：若Todo的「截至时间」< 当前时间，且Todo原状态为「已完成」→ 不做任何修改（保留「已完成」状态）
   - 场景3：若Todo的「截至时间」≥ 当前时间 → 保持原有状态（待完成/已完成均不修改）
3. 手动修改权限保留：
   - 允许用户手动将「已过期且自动标记为未完成」的Todo，修改为「已完成」（支持纠错/补录完成状态）
   - 用户手动修改后的状态，不受后续「过期自动更新」逻辑影响（即手动改完的「已完成」，即使过期也不再变回「未完成」）


apikey和apiurl都没改，部署后可以直接使用。
## 功能特性

### 用户管理
- 用户注册与登录
- 密码加密存储（BCrypt）
- 会话管理与登录状态保持

### 任务管理
- 创建、编辑、删除待办事项
- 任务状态管理（待办、进行中、已完成）
- 截止日期设置
- 任务搜索与筛选

### 日历视图
- 月视图展示任务分布
- 日视图查看详细任务
- 直观的任务时间线展示

### AI 助手
- 智能对话助手
- 任务管理辅助
- 基于 Mimo API 的 AI 集成

### 数据导入导出
- CSV 文件批量导入任务
- 数据备份与恢复

## 技术栈

### 后端
- **Java 21** - 编程语言
- **Servlet 6.0** - Web 框架
- **JSP 3.1** - 页面模板
- **JSTL 3.0** - 标签库
- **MyBatis 3.5** - ORM 框架
- **PostgreSQL** - 数据库
- **BCrypt** - 密码加密

### 前端
- **HTML5/CSS3** - 页面结构与样式
- **JavaScript** - 交互逻辑
- **Tailwind CSS** - 实用优先的 CSS 框架
- **Remix Icon** - 图标库
- **Google Fonts** - 字体支持

### 开发工具
- **Maven** - 项目构建与依赖管理
- **Tomcat 10** - Web 服务器（内嵌）
- **JUnit 5** - 单元测试

## 项目结构

```
todo项目/
├── java/
│   ├── pom.xml                    # Maven 配置文件
│   ├── create-todo-table.sql      # 数据库建表脚本
│   ├── fix-database.sql           # 数据库修复脚本
│   ├── insert-user.sql            # 用户数据初始化
│   ├── restart-server.cmd         # 服务器重启脚本
│   └── src/
│       └── main/
│           ├── java/com/todo/
│           │   ├── filter/        # 过滤器
│           │   │   └── LoginFilter.java
│           │   ├── mapper/        # MyBatis Mapper
│           │   │   ├── TodoMapper.java
│           │   │   └── UserMapper.java
│           │   ├── model/         # 数据模型
│           │   │   ├── Todo.java
│           │   │   └── User.java
│           │   ├── service/       # 业务逻辑层
│           │   │   ├── AiChatService.java
│           │   │   ├── TodoService.java
│           │   │   └── UserService.java
│           │   ├── servlet/       # Servlet 控制器
│           │   │   ├── AiChatServlet.java
│           │   │   ├── TodoServlet.java
│           │   │   ├── UploadServlet.java
│           │   │   └── UserServlet.java
│           │   └── util/          # 工具类
│           │       ├── MimoApiClient.java
│           │       └── MyBatisUtil.java
│           ├── resources/         # 配置文件
│           │   ├── mybatis-config.xml
│           │   └── com/todo/mapper/
│           │       ├── TodoMapper.xml
│           │       └── UserMapper.xml
│           └── webapp/            # Web 资源
│               ├── css/           # 样式文件
│               ├── js/            # JavaScript 文件
│               ├── lib/           # 第三方库
│               ├── WEB-INF/       # Web 应用配置
│               ├── index.jsp      # 主页面
│               ├── login.jsp      # 登录页面
│               └── register.jsp   # 注册页面
└── README.md                      # 项目说明文档
```

## 快速开始

### 环境要求

- **JDK 21** 或更高版本
- **Maven 3.8** 或更高版本
- **PostgreSQL 12** 或更高版本

### 数据库配置

1. 创建 PostgreSQL 数据库：

```sql
CREATE DATABASE todo_db;
```

2. 执行建表脚本：

```bash
psql -U postgres -d todo_db -f java/create-todo-table.sql
```

3. 修改数据库连接配置（位于 `src/main/resources/mybatis-config.xml`）：

```xml
<environment id="development">
    <transactionManager type="JDBC"/>
    <dataSource type="POOLED">
        <property name="driver" value="org.postgresql.Driver"/>
        <property name="url" value="jdbc:postgresql://localhost:5432/todo_db"/>
        <property name="username" value="your_username"/>
        <property name="password" value="your_password"/>
    </dataSource>
</environment>
```

### 构建与运行

1. 进入项目目录：

```bash
cd java
```

2. 编译项目：

```bash
mvn clean compile
```

3. 运行项目（使用内嵌 Tomcat）：

```bash
mvn cargo:run
```

4. 访问应用：

打开浏览器访问 http://localhost:8080

### 使用重启脚本

Windows 用户可以使用提供的重启脚本：

```bash
restart-server.cmd
```

## 使用说明

### 首次使用

1. 访问 http://localhost:8080
2. 点击"注册"创建新账号
3. 使用注册的账号登录
4. 开始创建和管理待办事项

### 任务管理

- **创建任务**：点击"+"按钮，填写任务标题、内容、优先级和截止日期
- **编辑任务**：点击任务卡片进入编辑模式
- **删除任务**：在任务详情页点击删除按钮
- **状态变更**：拖拽任务或使用状态切换按钮

### 日历视图

- 切换到日历标签页
- 月视图展示任务分布
- 点击日期查看当日任务详情

### AI 助手

- 点击右下角 AI 助手图标
- 输入问题或指令
- AI 将协助管理任务或回答问题

## API 接口

### 用户相关

- `POST /user?action=register` - 用户注册
- `POST /user?action=login` - 用户登录
- `GET /user?action=logout` - 用户登出

### 任务相关

- `GET /todo?action=list` - 获取任务列表
- `POST /todo?action=add` - 添加任务
- `POST /todo?action=update` - 更新任务
- `POST /todo?action=delete` - 删除任务

### 文件上传

- `POST /upload?action=import` - CSV 导入任务

### AI 对话

- `POST /ai-chat` - AI 对话接口

## 配置说明

### 数据库连接池

MyBatis 配置了连接池，可在 `mybatis-config.xml` 中调整：

```xml
<dataSource type="POOLED">
    <property name="pool.maximumActiveConnections" value="10"/>
    <property name="pool.maximumIdleConnections" value="5"/>
    <property name="pool.maximumCheckoutTime" value="20000"/>
</dataSource>
```

### 服务器端口

默认端口为 8080，可在 `pom.xml` 中修改：

```xml
<cargo.servlet.port>8080</cargo.servlet.port>
```

## 常见问题

### 数据库连接失败

检查 PostgreSQL 服务是否启动，以及 `mybatis-config.xml` 中的连接配置是否正确。

### 端口被占用

修改 `pom.xml` 中的端口配置，或关闭占用 8080 端口的程序。

### 编译错误

确保安装了正确版本的 JDK（21+）和 Maven（3.8+）。

## 开发指南

### 添加新功能

1. 在 `model` 包中创建数据模型
2. 在 `mapper` 包中创建 Mapper 接口和 XML
3. 在 `service` 包中实现业务逻辑
4. 在 `servlet` 包中创建控制器
5. 在 `webapp` 中创建前端页面

### 代码规范

- 使用中文注释说明业务逻辑
- 遵循 Java 命名规范
- 保持代码简洁，避免过度设计

## 许可证

本项目仅供学习和个人使用。

## 联系方式
如有问题或建议，请通过 GitHub Issues 反馈。
