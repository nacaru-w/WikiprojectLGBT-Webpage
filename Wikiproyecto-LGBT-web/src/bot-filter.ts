import type { NextFunction, Request, Response } from 'express';
import { resolve } from 'node:path';
import { isbot } from 'isbot';

/**
 * Crawlers we deliberately keep on the full server-side render even though
 * `isbot` flags them as bots. Two groups matter here:
 *
 *  - Search engines, so the site stays indexable. SEO is not critical for this
 *    in-group (LGBT+ wiki project) audience, but there is no reason to throw it
 *    away when keeping it costs nothing.
 *  - Social/chat link-preview fetchers, so shared links unfurl with the right
 *    Open Graph tags — which is how this community actually spreads pages.
 *
 * Everything else `isbot` recognises (scrapers, AI training crawlers, generic
 * HTTP libraries, headless monitors, …) is treated as unwanted and steered to
 * the lightweight static shell instead of triggering an Angular SSR render.
 */
const ALLOWED_CRAWLERS =
  /Googlebot|Google-InspectionTool|Storebot-Google|AdsBot-Google|Mediapartners-Google|Bingbot|BingPreview|DuckDuckBot|DuckDuckGo|Slurp|Baiduspider|YandexBot|Applebot|facebookexternalhit|facebookcatalog|Twitterbot|LinkedInBot|WhatsApp|TelegramBot|Discordbot|Slackbot|Pinterest|redditbot|Embedly/i;

/** True when the request comes from a crawler we would rather not serve SSR to. */
export function isUnwantedCrawler(userAgent: string | undefined | null): boolean {
  if (!userAgent) {
    return false;
  }
  return isbot(userAgent) && !ALLOWED_CRAWLERS.test(userAgent);
}

/**
 * Express middleware that diverts unwanted crawlers away from the CPU-heavy
 * Angular SSR render and hands them the prebuilt `index.csr.html` shell
 * instead, sparing the Toolforge instance work for traffic that never becomes a
 * real visit. Humans and allow-listed crawlers fall through to the SSR handler.
 *
 * Mount this AFTER `express.static` (so bots still receive real assets) and
 * BEFORE the Angular catch-all handler.
 */
export function filterUnwantedCrawlers(browserDistFolder: string) {
  const csrShell = resolve(browserDistFolder, 'index.csr.html');

  return (req: Request, res: Response, next: NextFunction): void => {
    if (req.method !== 'GET' || !isUnwantedCrawler(req.get('user-agent'))) {
      next();
      return;
    }

    // The shell is an empty hydration target with no crawlable content, so tell
    // well-behaved bots not to index it, then skip SSR entirely.
    res.setHeader('X-Robots-Tag', 'noindex');
    res.sendFile(csrShell, (err) => {
      // If the shell is somehow missing, fall back to SSR rather than erroring.
      if (err) {
        next();
      }
    });
  };
}
