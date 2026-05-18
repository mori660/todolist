package com.todo.service;

import com.todo.mapper.UserMapper;
import com.todo.model.User;
import com.todo.util.MyBatisUtil;
import org.apache.ibatis.session.SqlSession;
import org.mindrot.jbcrypt.BCrypt;

public class UserService {

    /**
     * 用户注册
     */
    public User register(String username, String password) throws Exception {
        try (SqlSession session = MyBatisUtil.getSqlSession()) {
            UserMapper userMapper = session.getMapper(UserMapper.class);

            // 检查用户名是否已存在
            User existingUser = userMapper.findByUsername(username);
            if (existingUser != null) {
                throw new Exception("用户名已存在");
            }

            // 创建新用户
            User user = new User();
            user.setUsername(username);
            // 使用BCrypt加密密码
            user.setPassword(BCrypt.hashpw(password, BCrypt.gensalt()));
            user.setCreatedAt(new java.sql.Timestamp(System.currentTimeMillis()));

            userMapper.insert(user);
            session.commit();

            return user;
        }
    }

    /**
     * 用户登录
     */
    public User login(String username, String password) throws Exception {
        try (SqlSession session = MyBatisUtil.getSqlSession()) {
            UserMapper userMapper = session.getMapper(UserMapper.class);

            User user = userMapper.findByUsername(username);
            if (user == null) {
                throw new Exception("用户不存在");
            }

            // 验证密码
            if (!BCrypt.checkpw(password, user.getPassword())) {
                throw new Exception("密码错误");
            }

            return user;
        }
    }

    /**
     * 根据ID查询用户
     */
    public User findById(Integer id) {
        try (SqlSession session = MyBatisUtil.getSqlSession()) {
            UserMapper userMapper = session.getMapper(UserMapper.class);
            return userMapper.findById(id);
        }
    }

    /**
     * 根据用户名查询用户
     */
    public User findByUsername(String username) {
        try (SqlSession session = MyBatisUtil.getSqlSession()) {
            UserMapper userMapper = session.getMapper(UserMapper.class);
            return userMapper.findByUsername(username);
        }
    }
}