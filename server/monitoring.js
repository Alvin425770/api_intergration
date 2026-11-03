const crypto = require('crypto');

const round = (value) => Math.round(value * 10) / 10;

function newRouteStats() {
  return {
    count: 0,
    clientErrors: 0,
    serverErrors: 0,
    totalMs: 0,
    maxMs: 0,
  };
}

const stats = {
  total: 0,
  clientErrors: 0,
  serverErrors: 0,
  totalMs: 0,
  maxMs: 0,
  routes: Object.create(null),
};

function callerLabel(req) {
  if (!req.apiKey) return 'none';

  const hash = crypto.createHash('sha256').update(req.apiKey).digest('hex');
  return `key-${hash.slice(0, 6)}`;
}

function monitor(req, res, next) {
  const start = process.hrtime.bigint();
  const requestPath = req.path;

  res.on('finish', () => {
    const ms = Number(process.hrtime.bigint() - start) / 1e6;
    const route = req.route ? req.baseUrl + req.route.path : '(no route)';
    const label = `${req.method} ${route}`;
    const routeStats = stats.routes[label] || newRouteStats();

    console.log(JSON.stringify({
      time: new Date().toISOString(),
      method: req.method,
      path: requestPath,
      status: res.statusCode,
      ms: round(ms),
      caller: callerLabel(req),
    }));

    stats.routes[label] = routeStats;
    stats.total += 1;
    stats.totalMs += ms;
    stats.maxMs = Math.max(stats.maxMs, ms);
    routeStats.count += 1;
    routeStats.totalMs += ms;
    routeStats.maxMs = Math.max(routeStats.maxMs, ms);

    if (res.statusCode >= 500) {
      stats.serverErrors += 1;
      routeStats.serverErrors += 1;
    } else if (res.statusCode >= 400) {
      stats.clientErrors += 1;
      routeStats.clientErrors += 1;
    }
  });

  next();
}

function statsHandler(req, res) {
  const routes = Object.fromEntries(
    Object.entries(stats.routes).map(([label, routeStats]) => [
      label,
      {
        count: routeStats.count,
        clientErrors: routeStats.clientErrors,
        serverErrors: routeStats.serverErrors,
        avgMs: round(routeStats.totalMs / routeStats.count),
        maxMs: round(routeStats.maxMs),
      },
    ])
  );

  res.json({
    total: stats.total,
    clientErrors: stats.clientErrors,
    serverErrors: stats.serverErrors,
    errorRatePercent: stats.total
      ? round((stats.serverErrors / stats.total) * 100)
      : 0,
    avgMs: stats.total ? round(stats.totalMs / stats.total) : 0,
    maxMs: round(stats.maxMs),
    routes,
  });
}

module.exports = { monitor, statsHandler };
