const DsaEntry = require('../models/DsaEntry');

/**
 * Computes the current daily streak (consecutive days with at least one
 * solved problem, counting backwards from today). If nothing was solved
 * today yet, the streak still counts as "active" as long as yesterday had
 * an entry - it just hasn't been extended to today yet.
 */
function computeStreak(solvedDates) {
  // solvedDates: Set of 'YYYY-MM-DD' strings
  if (solvedDates.size === 0) return 0;

  const dayMs = 24 * 60 * 60 * 1000;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let streak = 0;
  let cursor = new Date(today);

  // If today has no entry yet, start counting from yesterday instead -
  // the streak isn't broken until a full day passes with nothing solved.
  if (!solvedDates.has(cursor.toISOString().slice(0, 10))) {
    cursor = new Date(cursor.getTime() - dayMs);
  }

  while (solvedDates.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor = new Date(cursor.getTime() - dayMs);
  }

  return streak;
}

/**
 * Identifies topics the user hasn't practiced (or has practiced least),
 * to power the "Practice X today" recommendation - fully deterministic,
 * no AI call required.
 */
function findWeakTopics(topicCounts, allTopics, limit = 3) {
  return [...allTopics]
    .sort((a, b) => (topicCounts[a] || 0) - (topicCounts[b] || 0))
    .slice(0, limit);
}

async function getSummary(userId, dailyGoal) {
  const entries = await DsaEntry.find({ user: userId }).sort({ solvedAt: -1 });

  const total = entries.length;
  const byDifficulty = { Easy: 0, Medium: 0, Hard: 0 };
  const byTopic = {};
  const solvedDates = new Set();

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(startOfToday.getTime() - 6 * 24 * 60 * 60 * 1000);

  let solvedToday = 0;
  let solvedThisWeek = 0;

  for (const entry of entries) {
    byDifficulty[entry.difficulty] = (byDifficulty[entry.difficulty] || 0) + 1;
    byTopic[entry.topic] = (byTopic[entry.topic] || 0) + 1;
    solvedDates.add(entry.solvedAt.toISOString().slice(0, 10));
    if (entry.solvedAt >= startOfToday) solvedToday += 1;
    if (entry.solvedAt >= startOfWeek) solvedThisWeek += 1;
  }

  const streak = computeStreak(solvedDates);
  const weakTopics = findWeakTopics(byTopic, DsaEntry.TOPICS, 3);

  const recommendations = weakTopics
    .filter((topic) => (byTopic[topic] || 0) === 0)
    .slice(0, 2)
    .map((topic) => `You haven't practiced ${topic} yet - try a problem today.`);

  if (recommendations.length === 0 && weakTopics.length > 0) {
    recommendations.push(`Your ${weakTopics[0]} count is behind your other topics - consider practicing it today.`);
  }
  if (solvedToday === 0) {
    recommendations.push(`You haven't solved anything today yet - your daily goal is ${dailyGoal}.`);
  }

  return {
    total,
    byDifficulty,
    byTopic,
    topics: DsaEntry.TOPICS,
    streak,
    solvedToday,
    solvedThisWeek,
    dailyGoal,
    dailyGoalProgress: Math.min(100, Math.round((solvedToday / dailyGoal) * 100)),
    weakTopics,
    recommendations,
  };
}

module.exports = { getSummary, computeStreak, findWeakTopics };
