function formatPlaytime(minutes) {
  const hours = (minutes / 60).toFixed(1);
  return { hours, minutes };
}

module.exports = { formatPlaytime };
