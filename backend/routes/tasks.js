const express = require('express');
const { body, validationResult } = require('express-validator');
const Task = require('../models/Task');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, async (req, res) => {
  try {
    const tasks = await Task.find({ organization: req.auth.user.organization })
      .populate('assignee', 'displayName email role')
      .sort({ dueDate: 1 });
    res.json(tasks);
  } catch (error) {
    console.error('Task fetch error:', error.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

router.post(
  '/',
  authenticate,
  body('title').isLength({ min: 3 }).withMessage('Title must be at least 3 characters'),
  body('assignee').isMongoId().withMessage('Valid assignee required'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const task = new Task({
        ...req.body,
        organization: req.auth.user.organization,
        createdBy: req.auth.user._id
      });
      await task.save();
      res.status(201).json(task);
    } catch (error) {
      console.error('Task create error:', error.message);
      res.status(500).json({ msg: 'Server error' });
    }
  }
);

router.put('/:id', authenticate, async (req, res) => {
  try {
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, organization: req.auth.user.organization },
      { ...req.body, updatedAt: new Date() },
      { new: true }
    );

    if (!task) {
      return res.status(404).json({ msg: 'Task not found' });
    }

    res.json(task);
  } catch (error) {
    console.error('Task update error:', error.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
