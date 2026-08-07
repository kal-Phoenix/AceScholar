import express from 'express';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const rawIp =
      (req.headers['fly-client-ip'] as string) ||
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.socket.remoteAddress ||
      '';

    let geoUrl = 'https://ipapi.co/json/';
    if (
      rawIp &&
      rawIp !== '127.0.0.1' &&
      rawIp !== '::1' &&
      !rawIp.startsWith('192.168.') &&
      !rawIp.startsWith('10.')
    ) {
      geoUrl = `https://ipapi.co/${rawIp}/json/`;
    }

    let response = await fetch(geoUrl).catch(() => null);
    if (!response || !response.ok) {
      const freeIpUrl =
        rawIp && rawIp !== '127.0.0.1' && rawIp !== '::1'
          ? `https://freeipapi.com/api/json/${rawIp}`
          : 'https://freeipapi.com/api/json';
      response = await fetch(freeIpUrl).catch(() => null);
    }

    if (response && response.ok) {
      const data: any = await response.json();
      const country = data.country_name || data.countryName || 'Ethiopia';
      const currency = data.currency || (country === 'Ethiopia' ? 'ETB' : 'USD');
      const city = data.city || data.cityName || 'Addis Ababa';

      const exchangeRates: Record<string, { rate: number; symbol: string }> = {
        ETB: { rate: 120, symbol: 'Br' },
        USD: { rate: 1, symbol: '$' },
        EUR: { rate: 0.92, symbol: '€' },
        GBP: { rate: 0.79, symbol: '£' },
        CAD: { rate: 1.36, symbol: 'CA$' },
        SAR: { rate: 3.75, symbol: 'SR' },
      };

      const { symbol, rate } = exchangeRates[currency] || { rate: 1, symbol: '$' };

      return res.json({
        country,
        currency,
        symbol,
        exchangeRate: rate,
        city,
      });
    }

    // Fallback if third-party GeoIP APIs fail
    return res.json({
      country: 'Ethiopia',
      currency: 'ETB',
      symbol: 'Br',
      exchangeRate: 120,
      city: 'Addis Ababa',
    });
  } catch (err) {
    return res.json({
      country: 'Ethiopia',
      currency: 'ETB',
      symbol: 'Br',
      exchangeRate: 120,
      city: 'Addis Ababa',
    });
  }
});

router.get('/rates', async (_req, res) => {
  const FALLBACK = { ETB: 120, GBP: 0.79, CAD: 1.36, EUR: 0.92, SAR: 3.75 };
  try {
    const response = await fetch('https://open.er-api.com/v6/latest/USD');
    if (response.ok) {
      const data: any = await response.json();
      if (data?.rates) {
        return res.json({
          ETB: data.rates.ETB ? parseFloat(data.rates.ETB.toFixed(2)) : FALLBACK.ETB,
          GBP: data.rates.GBP ? parseFloat(data.rates.GBP.toFixed(4)) : FALLBACK.GBP,
          CAD: data.rates.CAD ? parseFloat(data.rates.CAD.toFixed(4)) : FALLBACK.CAD,
          EUR: data.rates.EUR ? parseFloat(data.rates.EUR.toFixed(4)) : FALLBACK.EUR,
          SAR: data.rates.SAR ? parseFloat(data.rates.SAR.toFixed(4)) : FALLBACK.SAR,
        });
      }
    }
  } catch { /* fall through to defaults */ }
  return res.json(FALLBACK);
});

export default router;
