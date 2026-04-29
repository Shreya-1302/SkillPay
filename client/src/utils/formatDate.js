export const formatDate = (isoString) => {
  if (!isoString) return '';
  const date = new Date(isoString);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
};

export const timeAgo = (isoString) => {
  if (!isoString) return '';
  const date = new Date(isoString);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);

  let interval = Math.floor(seconds / 31536000);
  if (interval >= 1) return interval + 'y ago';

  interval = Math.floor(seconds / 2592000);
  if (interval >= 1) return interval + 'mo ago';

  interval = Math.floor(seconds / 86400);
  if (interval >= 1) return interval + 'd ago';

  interval = Math.floor(seconds / 3600);
  if (interval >= 1) return interval + 'h ago';

  interval = Math.floor(seconds / 60);
  if (interval >= 1) return interval + 'm ago';

  return Math.floor(seconds) + 's ago';
};

export const daysLeft = (deadlineIso) => {
  if (!deadlineIso) return 0;
  const deadline = new Date(deadlineIso);
  const now = new Date();
  const diffTime = Math.abs(deadline - now);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
  return diffDays;
};
