// src/controllers/taskController.js
const { Task, User, Himpunan } = require('../models');
const { formatResponse } = require('../../utils/helpers');

// Get all tasks
exports.getAllTasks = async (req, res, next) => {
  try {
    const { himpunanId, status, priority } = req.query;
    const where = {};
    
    if (himpunanId) where.himpunanId = himpunanId;
    if (status) where.status = status;
    if (priority) where.priority = priority;
    
    const tasks = await Task.findAll({
      where,
      include: [
        {
          model: User,
          as: 'assignedTo',
          attributes: ['id', 'fullName', 'email']
        },
        {
          model: User,
          as: 'createdBy',
          attributes: ['id', 'fullName', 'email']
        },
        {
          model: Himpunan,
          as: 'himpunan',
          attributes: ['id', 'name', 'code']
        }
      ],
      order: [
        ['createdAt', 'DESC']
      ]
    });

    res.status(200).json(formatResponse(
      true,
      'Tasks berhasil diambil',
      tasks
    ));
  } catch (error) {
    console.error('Error in getAllTasks:', error);
    res.status(500).json(formatResponse(
      false,
      error.message || 'Terjadi kesalahan saat mengambil data tasks'
    ));
  }
};

// Get himpunan tasks
exports.getHimpunanTasks = async (req, res, next) => {
  try {
    const { himpunanId } = req.params;
    
    // Check if himpunan exists
    const himpunan = await Himpunan.findByPk(himpunanId);
    if (!himpunan) {
      return res.status(404).json(formatResponse(
        false,
        'Himpunan tidak ditemukan'
      ));
    }
    
    const tasks = await Task.findAll({
      where: { himpunanId },
      include: [
        {
          model: User,
          as: 'assignedTo',
          attributes: ['id', 'fullName', 'email']
        },
        {
          model: User,
          as: 'createdBy',
          attributes: ['id', 'fullName', 'email']
        }
      ],
      order: [
        ['createdAt', 'DESC']
      ]
    });

    res.status(200).json(formatResponse(
      true,
      'Tasks himpunan berhasil diambil',
      tasks
    ));
  } catch (error) {
    console.error('Error in getHimpunanTasks:', error);
    res.status(500).json(formatResponse(
      false,
      error.message || 'Terjadi kesalahan saat mengambil data tasks himpunan'
    ));
  }
};

// Get single task
exports.getTask = async (req, res, next) => {
  try {
    const task = await Task.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'assignedTo',
          attributes: ['id', 'fullName', 'email']
        },
        {
          model: User,
          as: 'createdBy',
          attributes: ['id', 'fullName', 'email']
        },
        {
          model: Himpunan,
          as: 'himpunan',
          attributes: ['id', 'name', 'code']
        }
      ]
    });

    if (!task) {
      return res.status(404).json(formatResponse(
        false,
        'Task tidak ditemukan'
      ));
    }

    res.status(200).json(formatResponse(
      true,
      'Task berhasil diambil',
      task
    ));
  } catch (error) {
    console.error('Error in getTask:', error);
    res.status(500).json(formatResponse(
      false,
      error.message || 'Terjadi kesalahan saat mengambil data task'
    ));
  }
};

// Create task
exports.createTask = async (req, res, next) => {
  try {
    const {
      title,
      description,
      himpunanId,
      assignedToId,
      priority,
      dueDate,
      startDate,
      scoreReward,
      category,
      tags
    } = req.body;

    // Validation
    if (!title || !himpunanId) {
      return res.status(400).json(formatResponse(
        false,
        'Judul dan himpunanId harus diisi'
      ));
    }

    // Check if himpunan exists
    const himpunan = await Himpunan.findByPk(himpunanId);
    if (!himpunan) {
      return res.status(404).json(formatResponse(
        false,
        'Himpunan tidak ditemukan'
      ));
    }

    // Check if assigned user exists if provide
    if (assignedToId) {
      const assignedUser = await User.findByPk(assignedToId);
      if (!assignedUser) {
        return res.status(404).json(formatResponse(
          false,
          'User yang ditugaskan tidak ditemukan'
        ));
      }
    }

    // Create task
    const task = await Task.create({
      title,
      description,
      himpunanId,
      assignedToId,
      createdById: req.user.id,
      priority: priority || 'medium',
      dueDate,
      startDate,
      status: 'pending',
      scoreReward: scoreReward || 0,
      category,
      tags: tags || []
    });

    const createdTask = await Task.findByPk(task.id, {
      include: [
        {
          model: User,
          as: 'assignedTo',
          attributes: ['id', 'fullName', 'email']
        },
        {
          model: User,
          as: 'createdBy',
          attributes: ['id', 'fullName', 'email']
        },
        {
          model: Himpunan,
          as: 'himpunan',
          attributes: ['id', 'name',]
        }
      ]
    });

    res.status(201).json(formatResponse(
      true,
      'Task berhasil dibuat',
      createdTask
    ));
  } catch (error) {
    console.error('Error in createTask:', error);
    next(error);
  }
};

// Update task
exports.updateTask = async (req, res, next) => {
  try {
    const {
      title,
      description,
      status,
      priority,
      assignedToId,
      dueDate,
      startDate,
      completionDate,
      scoreReward,
      category,
      tags
    } = req.body;

    // Find task
    const task = await Task.findByPk(req.params.id);
    if (!task) {
      return res.status(404).json(formatResponse(
        false,
        'Task tidak ditemukan'
      ));
    }

    // Check if assigned user exists if provided
    if (assignedToId) {
      const assignedUser = await User.findByPk(assignedToId);
      if (!assignedUser) {
        return res.status(404).json(formatResponse(
          false,
          'User yang ditugaskan tidak ditemukan'
        ));
      }
    }

    // Check if user is allowed to update
    const isSuperAdmin = req.user.role === 'super_admin';
    const isAdmin = req.user.role === 'admin';
    const isCreator = task.createdById === req.user.id;
    const isAssignee = task.assignedToId === req.user.id;
    
    if (!isSuperAdmin && !isAdmin && !isCreator && !isAssignee) {
      return res.status(403).json(formatResponse(
        false,
        'Tidak memiliki izin untuk mengubah task ini'
      ));
    }

    // Update score for user if task is being completed
    if (status === 'completed' && task.status !== 'completed' && task.assignedToId) {
      const user = await User.findByPk(task.assignedToId);
      if (user) {
        await user.update({
          score: user.score + task.scoreReward
        });
      }
    }

    // Update task
    await task.update({
      title: title || task.title,
      description: description || task.description,
      status: status || task.status,
      priority: priority || task.priority,
      assignedToId: assignedToId !== undefined ? assignedToId : task.assignedToId,
      dueDate: dueDate || task.dueDate,
      startDate: startDate || task.startDate,
      completionDate: status === 'completed' ? new Date() : completionDate || task.completionDate,
      scoreReward: scoreReward !== undefined ? scoreReward : task.scoreReward,
      category: category || task.category,
      tags: tags || task.tags
    });

    const updatedTask = await Task.findByPk(task.id, {
      include: [
        {
          model: User,
          as: 'assignedTo',
          attributes: ['id', 'fullName', 'email']
        },
        {
          model: User,
          as: 'createdBy',
          attributes: ['id', 'fullName', 'email']
        },
        {
          model: Himpunan,
          as: 'himpunan',
          attributes: ['id', 'name']
        }
      ]
    });

    res.status(200).json(formatResponse(
      true,
      'Task berhasil diupdate',
      updatedTask
    ));
  } catch (error) {
    console.error('Error in updateTask:', error);
    next(error);
  }
};

// Delete task
exports.deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findByPk(req.params.id);
    if (!task) {
      return res.status(404).json(formatResponse(
        false,
        'Task tidak ditemukan'
      ));
    }

    // Check if user is allowed to delete
    const isSuperAdmin = req.user.role === 'super_admin';
    const isAdmin = req.user.role === 'admin';
    const isCreator = task.createdById === req.user.id;
    
    if (!isSuperAdmin && !isAdmin && !isCreator) {
      return res.status(403).json(formatResponse(
        false,
        'Tidak memiliki izin untuk menghapus task ini'
      ));
    }

    // Delete task
    await task.destroy();

    res.status(200).json(formatResponse(
      true,
      'Task berhasil dihapus'
    ));
  } catch (error) {
    console.error('Error in deleteTask:', error);
    next(error);
  }
};

// Get tasks assigned to user
exports.getUserTasks = async (req, res, next) => {
  try {
    const userId = req.params.userId || req.user.id;
    
    const tasks = await Task.findAll({
      where: { assignedToId: userId },
      include: [
        {
          model: User,
          as: 'createdBy',
          attributes: ['id', 'fullName', 'email']
        },
        {
          model: Himpunan,
          as: 'himpunan',
          attributes: ['id', 'name']
        }
      ],
      order: [
        ['createdAt', 'DESC']
      ]
    });

    res.status(200).json(formatResponse(
      true,
      'Tasks user berhasil diambil',
      tasks
    ));
  } catch (error) {
    console.error('Error in getUserTasks:', error);
    res.status(500).json(formatResponse(
      false,
      error.message || 'Terjadi kesalahan saat mengambil data tasks user'
    ));
  }
};

exports.getCurrentUserTasks = async (req, res, next) => {
  try {
    const userId = req.user.id; // Gunakan user yang sedang login
    
    const tasks = await Task.findAll({
      where: { assignedToId: userId },
      include: [
        {
          model: User,
          as: 'createdBy',
          attributes: ['id', 'fullName', 'email']
        },
        {
          model: Himpunan,
          as: 'himpunan',
          attributes: ['id', 'name', 'aka']
        }
      ],
      order: [
        ['createdAt', 'DESC']
      ]
    });

    res.status(200).json(formatResponse(
      true,
      'Tasks user saat ini berhasil diambil',
      tasks
    ));
  } catch (error) {
    console.error('Error in getCurrentUserTasks:', error);
    res.status(500).json(formatResponse(
      false,
      error.message || 'Terjadi kesalahan saat mengambil data tasks user'
    ));
  }
};