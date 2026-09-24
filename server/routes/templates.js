const express = require('express');
const router = express.Router();
const { listTemplates, DEFAULT_TEMPLATE_ID } = require('../templates');

router.get('/', (req, res) => {
  res.json({ templates: listTemplates(), default: DEFAULT_TEMPLATE_ID });
});

module.exports = router;
