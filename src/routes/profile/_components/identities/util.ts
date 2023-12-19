export function formatDate(d: string | undefined) {
  const date = new Date(d as string);
  return date.toLocaleString(undefined, {
    timeStyle: 'full',
    dateStyle: 'long'
  });
}