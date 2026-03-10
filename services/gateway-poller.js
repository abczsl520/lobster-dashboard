let latestState = null;
let onUpdateCb = null;
let activityLog = [];
const MAX_LOG = 200;

// CST timezone offset helper
function nowCST() {
  return new Date(Date.now() + 8 * 3600000);
}

function todayStartCST() {
  const d = nowCST();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())).getTime();
}

function pushState(data) {
  if (!data || !Array.isArray(data.sessions)) return;

  const now = Date.now();

  // Clean activity log: remove entries from before today (CST)
  const todayMs = todayStartCST();
  activityLog = activityLog.filter(a => a.ts >= todayMs);

  const sessions = data.sessions.map(s => {
    const age = s.updatedAt ? (now - s.updatedAt) : (s.ageMs || 999999999);
    let status = 'offline';
    if (age < 60000) status = 'active';
    else if (age < 300000) status = 'idle';

    let channel = 'unknown';
    const keyParts = (s.key || '').split(':');
    if (keyParts.length >= 3) channel = keyParts[2];

    let displayName = s.resolvedName || s.key.replace('agent:main:', '');

    return {
      key: s.key,
      sessionId: s.sessionId,
      displayName,
      channel,
      chatType: s.kind || 'unknown',
      model: s.model || 'unknown',
      status,
      updatedAt: s.updatedAt,
      ageMs: age,
      lastMsg: s.lastMsg || '',
      lastTool: s.lastTool || '',
      aborted: s.abortedLastRun || false,
      tokens: s.totalTokens || 0,
      contextTokens: s.contextTokens || 0,
      inputTokens: s.inputTokens || 0,
      outputTokens: s.outputTokens || 0
    };
  });

  const order = { active: 0, idle: 1, offline: 2 };
  sessions.sort((a, b) => (order[a.status] || 9) - (order[b.status] || 9));

  // Detect changes for activity log
  if (latestState && latestState.sessions) {
    const oldMap = {};
    for (const s of latestState.sessions) oldMap[s.key] = s;

    for (const s of sessions) {
      const old = oldMap[s.key];
      if (!old) {
        addActivity(s.displayName, 'online', 'green', s.channel);
      } else if (old.status !== s.status) {
        if (s.status === 'active') addActivity(s.displayName, 'active', 'green', s.channel);
        else if (s.status === 'idle') addActivity(s.displayName, 'idle', 'yellow', s.channel);
      } else if (s.lastTool && s.lastTool !== old.lastTool) {
        addActivity(s.displayName, 'using ' + s.lastTool, 'blue', s.channel);
      }
    }
  } else {
    for (const s of sessions) {
      if (s.status === 'active') addActivity(s.displayName, 'active', 'green', s.channel);
      else if (s.status === 'idle') addActivity(s.displayName, 'idle', 'yellow', s.channel);
    }
  }

  // Token stats
  let totalTokensAll = 0;
  let totalInputTokens = 0;
  let totalOutputTokens = 0;
  for (const s of sessions) {
    totalTokensAll += s.tokens;
    totalInputTokens += s.inputTokens;
    totalOutputTokens += s.outputTokens;
  }

  latestState = {
    timestamp: now,
    gatewayOk: true,
    totalSessions: sessions.length,
    activeSessions: sessions.filter(s => s.status === 'active').length,
    idleSessions: sessions.filter(s => s.status === 'idle').length,
    tokenStats: {
      total: totalTokensAll,
      input: totalInputTokens,
      output: totalOutputTokens
    },
    sessions,
    activityLog: activityLog.slice(0, 50)
  };

  if (onUpdateCb) onUpdateCb(latestState);
}

function addActivity(agent, action, color, channel) {
  const d = nowCST();
  const h = String(d.getUTCHours()).padStart(2, '0');
  const m = String(d.getUTCMinutes()).padStart(2, '0');
  const sec = String(d.getUTCSeconds()).padStart(2, '0');
  activityLog.unshift({
    time: h + ':' + m + ':' + sec,
    agent, action, color, channel,
    ts: Date.now()
  });
  if (activityLog.length > MAX_LOG) activityLog.length = MAX_LOG;
}

function startPoller(gwConfig, onUpdate) {
  onUpdateCb = onUpdate;
}

function getLatestState() { return latestState; }

module.exports = { startPoller, getLatestState, pushState };
