/**
 * Chart.js text/grid colours follow the active theme. The chart config objects
 * hardcode black (#000) for ticks/legend, which disappears on a dark page, so
 * before a chart is created we overwrite those colours with the live theme ink
 * (read from the --ink custom property) and a matching grid colour.
 *
 * Charts are only ever built in the browser (ngOnInit), so reading the DOM here
 * is safe; the SSR fallback returns the light values.
 */
function readTheme(): { ink: string; grid: string } {
  if (typeof document === 'undefined') {
    return { ink: '#000', grid: 'rgba(0, 0, 0, 0.1)' };
  }
  const ink = getComputedStyle(document.documentElement).getPropertyValue('--ink').trim() || '#000';
  const dark = document.documentElement.classList.contains('dark');
  return { ink, grid: dark ? 'rgba(241, 237, 246, 0.16)' : 'rgba(0, 0, 0, 0.1)' };
}

/**
 * Mutate a Chart.js options object so its tick labels, legend labels, title and
 * grid lines use the current theme colours. Returns the same object for chaining
 * (`options: applyChartTheme(myOptions)`).
 */
export function applyChartTheme(options: any): any {
  const { ink, grid } = readTheme();
  options = options ?? {};

  const plugins = (options.plugins ??= {});
  if (plugins.legend) {
    plugins.legend.labels = { ...(plugins.legend.labels ?? {}), color: ink };
  }
  if (plugins.title) {
    plugins.title.color = ink;
  }

  if (options.scales) {
    for (const key of Object.keys(options.scales)) {
      const scale = options.scales[key];
      if (!scale) {
        continue;
      }
      scale.ticks = { ...(scale.ticks ?? {}), color: ink };
      scale.grid = { ...(scale.grid ?? {}), color: grid };
    }
  }

  return options;
}
