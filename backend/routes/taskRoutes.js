const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const AgentTask = require('../models/AgentTask');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI((process.env.GEMINI_API_KEY || "").trim());

// @desc    Create and run a background agent task
// @route   POST /api/tasks
// @access  Private
router.post('/', protect, async (req, res) => {
    try {
        const { taskName, taskType, prompt } = req.body;
        if (!taskName || !prompt) return res.status(400).json({ message: 'taskName and prompt required' });

        const task = await AgentTask.create({
            userId: req.user._id,
            taskName,
            taskType: taskType || 'CUSTOM',
            status: 'RUNNING',
            progress: 10,
            logs: [`[${new Date().toISOString()}] Task created: ${taskName}`]
        });

        // Return task ID immediately so frontend can track
        res.status(201).json({ taskId: task._id, status: 'RUNNING' });

        // Run task asynchronously in background
        (async () => {
            try {
                const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
                
                task.logs.push(`[${new Date().toISOString()}] Gemini agent processing...`);
                task.progress = 50;
                await task.save();

                const result = await model.generateContent(prompt);
                const text = result.response.text();

                task.status = 'COMPLETED';
                task.progress = 100;
                task.result = text;
                task.logs.push(`[${new Date().toISOString()}] Task completed successfully.`);
                await task.save();
            } catch (err) {
                task.status = 'FAILED';
                task.logs.push(`[${new Date().toISOString()}] ERROR: ${err.message}`);
                await task.save();
            }
        })();

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get all tasks for current user
// @route   GET /api/tasks
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        const tasks = await AgentTask.find({ userId: req.user._id }).sort({ createdAt: -1 }).limit(20);
        res.json(tasks);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get single task status
// @route   GET /api/tasks/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
    try {
        const task = await AgentTask.findOne({ _id: req.params.id, userId: req.user._id });
        if (!task) return res.status(404).json({ message: 'Task not found' });
        res.json(task);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
