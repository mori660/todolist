package com.todo.mapper;

import com.todo.model.User;
import org.apache.ibatis.annotations.Param;

public interface UserMapper {
    /**
     * 根据用户名查询用户
     */
    User findByUsername(@Param("username") String username);

    /**
     * 根据ID查询用户
     */
    User findById(@Param("id") Integer id);

    /**
     * 插入新用户
     */
    int insert(User user);

    /**
     * 更新用户信息
     */
    int update(User user);

    /**
     * 删除用户
     */
    int deleteById(@Param("id") Integer id);
}