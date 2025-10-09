const express = require('express');
const { authenticate } = require('../middleware/auth');
const Lead = require('../models/Lead');
const Listing = require('../models/Listing');
const Task = require('../models/Task');
const Interaction = require('../models/Interaction');

const router = express.Router();

router.get('/summary', authenticate, async (req, res) => {
  try {
    const organizationId = req.auth.user.organization?._id || req.auth.user.organization;

    const [leadStages, listingStatuses, openTasks, recentInteractions] = await Promise.all([
      Lead.aggregate([
        { $match: { organization: organizationId } },
        { $group: { _id: '$stage', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      Listing.aggregate([
        { $match: { organization: organizationId } },
        { $group: { _id: '$status', count: { $sum: 1 }, totalValue: { $sum: { $ifNull: ['$listPrice', 0] } } } },
        { $sort: { count: -1 } }
      ]),
      Task.find({ organization: organizationId, status: { $ne: 'completed' } })
        .sort({ dueDate: 1 })
        .limit(5)
        .lean(),
      Interaction.find({ organization: organizationId })
        .sort({ occurredAt: -1 })
        .limit(10)
        .populate('lead', 'contact')
        .lean()
    ]);

    const totalLeads = leadStages.reduce((sum, item) => sum + item.count, 0);
    const totalListings = listingStatuses.reduce((sum, item) => sum + item.count, 0);

    res.json({
      leadStages,
      listingStatuses,
      totals: {
        leads: totalLeads,
        listings: totalListings
      },
      openTasks,
      recentInteractions
    });
  } catch (error) {
    console.error('Insights summary error:', error.message);
    res.status(500).json({ msg: 'Unable to load insights summary' });
  }
});

module.exports = router;
