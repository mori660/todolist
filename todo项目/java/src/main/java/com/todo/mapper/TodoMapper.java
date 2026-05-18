package com.todo.mapper;

import com.todo.model.Todo;
import org.apache.ibatis.annotations.Param;

import java.util.List;

public interface TodoMapper {
    /**
     * 根据用户ID查询TODO列表
     */
    List<Todo> findByUserId(@Param("userId") Integer userId);

    /**
     * 根据ID查询TODO
     */
    Todo findById(@Param("id") Integer id);

    /**
     * 插入新TODO
     */
    int insert(Todo todo);

    /**
     * 更新TODO
     */
    int update(Todo todo);

    /**
     * 删除TODO
     */
    int deleteById(@Param("id") Integer id);

    /**
     * 批量删除TODO
     */
    int deleteByIds(@Param("list") List<Integer> ids);

    /**
     * 根据用户ID删除所有TODO
     */
    int deleteByUserId(@Param("userId") Integer userId);

    /**
     * 批量插入TODO
     */
    int batchInsert(@Param("list") List<Todo> todoList);

    /**
     * 批量更新过期TODO状态为INCOMPLETE
     * 当前时间 > due_date 且 status = 'PENDING' 时强制改为INCOMPLETE
     * 已完成(COMPLETED)的任务不受影响
     */
    int updateOverdueStatus(@Param("userId") Integer userId);
}
