// Shared default live source. Override with NEXT_PUBLIC_LIVE_SOURCE_URL in Vercel;
// falls back to the connected Kamoa demo sheet. Used by the dashboard auto-connect
// and the server-side cron snapshot.
export const DEFAULT_LIVE_URL = (process.env.NEXT_PUBLIC_LIVE_SOURCE_URL
  || 'https://docs.google.com/spreadsheets/d/1tJg7E97GOzndqQZrH8wTKay3z7PRZj_9YAz-m3V6VU0/edit?gid=40456982#gid=40456982').trim();
