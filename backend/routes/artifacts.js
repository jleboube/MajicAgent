const express = require('express');
const { body, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const Artifact = require('../models/Artifact');
const { authenticate } = require('../middleware/auth');
const { 
  generateUploadUrl, 
  generatePresignedUrl, 
  deleteFromS3, 
  getUserRoot 
} = require('../config/storage');

const router = express.Router();

router.get('/', authenticate, async (req, res) => {
  try {
    const artifacts = await Artifact.find({ organization: req.auth.user.organization })
      .sort({ createdAt: -1 });

    const withUrls = await Promise.all(
      artifacts.map(async (artifact) => {
        const data = artifact.toObject();
        if (artifact.key) {
          try {
            data.downloadUrl = await generatePresignedUrl(artifact.key);
          } catch (error) {
            console.warn(`Failed to generate download URL for artifact ${artifact._id}: ${error.message}`);
            data.downloadUrl = null;
          }
        }
        return data;
      })
    );

    res.json(withUrls);
  } catch (error) {
    console.error('Artifact list error:', error.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

router.post(
  '/sign-upload',
  authenticate,
  body('fileName').isLength({ min: 1 }).withMessage('fileName required'),
  body('fileType').isLength({ min: 1 }).withMessage('fileType required'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { fileName, fileType } = req.body;
      const key = `${getUserRoot(req.auth.user._id.toString(), req.auth.user.organization)}/artifacts/${uuidv4()}-${fileName}`;
      const uploadUrl = await generateUploadUrl({ key, contentType: fileType });

      res.json({ key, uploadUrl });
    } catch (error) {
      console.error('Artifact pre-sign error:', error.message);
      res.status(500).json({ msg: 'Unable to sign upload URL' });
    }
  }
);

router.post(
  '/',
  authenticate,
  body('key').isLength({ min: 1 }).withMessage('key required'),
  body('fileName').isLength({ min: 1 }).withMessage('fileName required'),
  body('fileType').isLength({ min: 1 }).withMessage('fileType required'),
  body('fileSize').isInt({ min: 1 }).withMessage('fileSize required'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const checksum = req.body.checksum || uuidv4();
      const artifact = new Artifact({
        organization: req.auth.user.organization,
        owner: req.auth.user._id,
        ...req.body,
        checksum
      });
      await artifact.save();
      res.status(201).json(artifact);
    } catch (error) {
      console.error('Artifact create error:', error.message);
      res.status(500).json({ msg: 'Server error' });
    }
  }
);

router.delete('/:id', authenticate, async (req, res) => {
  try {
    const artifact = await Artifact.findOneAndDelete({
      _id: req.params.id,
      organization: req.auth.user.organization
    });

    if (!artifact) {
      return res.status(404).json({ msg: 'Artifact not found' });
    }

    await deleteFromS3(artifact.key);
    res.json({ msg: 'Artifact deleted' });
  } catch (error) {
    console.error('Artifact delete error:', error.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
