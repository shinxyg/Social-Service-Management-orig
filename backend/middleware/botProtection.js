
module.exports = function botProtection(req, res, next) {
  try {
    const body = req.body || {};

    if (typeof body.interactionTimeMs === 'number' && body.interactionTimeMs > 0) {

      if (body.interactionTimeMs < 150) {
        console.warn(`[BOT PROTECTION] Blocked ultra-fast script submission (${body.interactionTimeMs}ms).`);
        return res.status(400).json({
          success: false,
          isBotBlocked: true,
          message: 'Submission was too fast. Please fill the form manually.',
        });
      }
    }

    const ua = (req.headers['user-agent'] || '').toLowerCase();
    const badAgents = ['curl', 'wget', 'python-requests', 'scrapy', 'headlesschrome', 'phantomjs'];
    if (badAgents.some(agent => ua.includes(agent))) {
      console.warn(`[BOT PROTECTION] Blocked suspicious User-Agent: ${ua}`);
      return res.status(403).json({
        success: false,
        isBotBlocked: true,
        message: 'Direct script access is restricted.',
      });
    }

    next();
  } catch (err) {
    console.error('Error in botProtection middleware:', err);
    next();
  }
};
