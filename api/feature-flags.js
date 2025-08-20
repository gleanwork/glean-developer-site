const { get } = require('@vercel/edge-config');

module.exports = async function handler(req, res) {
  try {
    let flags = {};
    try {
      const data = await get('feature-flags');
      if (data && typeof data === 'object') flags = data;
    } catch {}

    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    res.status(200).json({ flags });
  } catch (e) {
    res.status(200).json({ flags: {} });
  }
};



