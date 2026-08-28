/**
 * Netlify Scheduled Function that invokes the retry worker in the Next.js app.
 * Netlify supplies URL for the production site's canonical URL.
 */
async function retryFailedJobs() {
  const siteUrl = process.env.URL;
  const secret = process.env.CRON_SECRET;

  if (!siteUrl || !secret) {
    throw new Error('URL or CRON_SECRET is not configured in Netlify');
  }

  const response = await fetch(`${siteUrl}/api/internal/retry-failed-jobs`, {
    headers: { Authorization: `Bearer ${secret}` },
  });

  if (!response.ok) {
    throw new Error(`Retry worker returned HTTP ${response.status}: ${await response.text()}`);
  }

  console.log('Print delivery retry completed:', await response.text());
}

export default retryFailedJobs;

export const config = {
  schedule: '*/5 * * * *',
};
