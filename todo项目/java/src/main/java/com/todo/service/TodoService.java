package com.todo.service;

import com.todo.mapper.TodoMapper;
import com.todo.model.Todo;
import com.todo.util.MyBatisUtil;
import org.apache.ibatis.session.SqlSession;

import java.sql.Timestamp;
import java.util.List;

public class TodoService {

    /**
     * 根据用户ID查询TODO列表
     */
    public List<Todo> findByUserId(Integer userId) {
        try (SqlSession session = MyBatisUtil.getSqlSession()) {
            TodoMapper todoMapper = session.getMapper(TodoMapper.class);
            return todoMapper.findByUserId(userId);
        }
    }

    /**
     * 根据ID查询TODO
     */
    public Todo findById(Integer id) {
        try (SqlSession session = MyBatisUtil.getSqlSession()) {
            TodoMapper todoMapper = session.getMapper(TodoMapper.class);
            return todoMapper.findById(id);
        }
    }

    /**
     * 新增TODO
     */
    public Todo addTodo(Integer userId, String title, String content, String status, Timestamp startTime, Timestamp dueDate) {
        try (SqlSession session = MyBatisUtil.getSqlSession()) {
            TodoMapper todoMapper = session.getMapper(TodoMapper.class);

            Todo todo = new Todo();
            todo.setUserId(userId);
            todo.setTitle(title);
            todo.setContent(content);
            todo.setStatus(status != null ? status : "PENDING");
            todo.setStartTime(startTime);
            todo.setDueDate(dueDate);
            todo.setCreatedAt(new Timestamp(System.currentTimeMillis()));
            todo.setUpdatedAt(new Timestamp(System.currentTimeMillis()));

            todoMapper.insert(todo);
            session.commit();

            return todo;
        }
    }

    /**
     * 更新TODO
     */
    public Todo updateTodo(Integer id, Integer userId, String title, String content, String status, Timestamp startTime, Timestamp dueDate) throws Exception {
        try (SqlSession session = MyBatisUtil.getSqlSession()) {
            TodoMapper todoMapper = session.getMapper(TodoMapper.class);

            Todo existingTodo = todoMapper.findById(id);
            if (existingTodo == null) {
                throw new Exception("TODO不存在");
            }
            if (!existingTodo.getUserId().equals(userId)) {
                throw new Exception("无权修改此TODO");
            }

            existingTodo.setTitle(title);
            existingTodo.setContent(content);
            existingTodo.setStatus(status);
            existingTodo.setStartTime(startTime);
            existingTodo.setDueDate(dueDate);
            existingTodo.setUpdatedAt(new Timestamp(System.currentTimeMillis()));

            todoMapper.update(existingTodo);
            session.commit();

            return existingTodo;
        }
    }

    /**
     * 删除TODO
     */
    public void deleteTodo(Integer id, Integer userId) throws Exception {
        try (SqlSession session = MyBatisUtil.getSqlSession()) {
            TodoMapper todoMapper = session.getMapper(TodoMapper.class);

            // 检查TODO是否存在且属于当前用户
            Todo existingTodo = todoMapper.findById(id);
            if (existingTodo == null) {
                throw new Exception("TODO不存在");
            }
            if (!existingTodo.getUserId().equals(userId)) {
                throw new Exception("无权删除此TODO");
            }

            todoMapper.deleteById(id);
            session.commit();
        }
    }

    /**
     * 批量删除TODO
     */
    public int batchDelete(List<Integer> ids, Integer userId) throws Exception {
        try (SqlSession session = MyBatisUtil.getSqlSession()) {
            TodoMapper todoMapper = session.getMapper(TodoMapper.class);

            // 验证所有TODO都属于当前用户
            for (Integer id : ids) {
                Todo existingTodo = todoMapper.findById(id);
                if (existingTodo == null) {
                    throw new Exception("TODO不存在: " + id);
                }
                if (!existingTodo.getUserId().equals(userId)) {
                    throw new Exception("无权删除此TODO: " + id);
                }
            }

            int count = todoMapper.deleteByIds(ids);
            session.commit();
            return count;
        }
    }

    /**
     * 批量导入TODO
     */
    public int batchImport(Integer userId, List<Todo> todoList) {
        try (SqlSession session = MyBatisUtil.getSqlSession()) {
            TodoMapper todoMapper = session.getMapper(TodoMapper.class);

            // 设置用户ID和时间戳
            Timestamp now = new Timestamp(System.currentTimeMillis());
            for (Todo todo : todoList) {
                todo.setUserId(userId);
                if (todo.getStatus() == null) {
                    todo.setStatus("PENDING");
                }
                if (todo.getStartTime() == null && todo.getDueDate() != null) {
                    todo.setStartTime(todo.getDueDate());
                }
                todo.setCreatedAt(now);
                todo.setUpdatedAt(now);
            }

            int count = todoMapper.batchInsert(todoList);
            session.commit();

            return count;
        }
    }

    /**
     * 导出用户的所有TODO
     */
    public List<Todo> exportTodos(Integer userId) {
        try (SqlSession session = MyBatisUtil.getSqlSession()) {
            TodoMapper todoMapper = session.getMapper(TodoMapper.class);
            return todoMapper.findByUserId(userId);
        }
    }

    /**
     * 批量更新过期TODO状态为INCOMPLETE
     */
    public int updateOverdueStatus(Integer userId) {
        try (SqlSession session = MyBatisUtil.getSqlSession()) {
            TodoMapper todoMapper = session.getMapper(TodoMapper.class);
            int count = todoMapper.updateOverdueStatus(userId);
            session.commit();
            return count;
        }
    }
}
