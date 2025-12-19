export default function truncateTitle(title, words = 3) {
  if (!title) return '';
  const parts = String(title).trim().split(/\s+/);
  if (parts.length <= words) return title;
  return parts.slice(0, words).join(' ') + '...';
}
