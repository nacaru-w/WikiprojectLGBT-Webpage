export const articleCount2021: number = 181;
export const articleCount2022: number = 366;
export const articleCount2023: number = 758;
export const articleCount2024: number = 1177;
export const articleCount2025: number = 1061;

export const newParticipants2021: number = 16;
export const newParticipants2022: number = 35;
export const newParticipants2023: number = 45;
export const newParticipants2024: number = 73;
export const newParticipants2025: number = 31;

// Shared palette for the statistics charts: a given year always renders in the
// same colour across both the "Artículos por año" bar chart and the monthly
// line chart. Indexed cyclically by year so it keeps working as years roll over
// without manual edits. The blue and yellow entries are darker than the bar
// chart's original fills (#b3efff, #fff574) because the line chart's lines have
// no black contour, so the pale versions were hard to see.
const yearPalette = [
    '#fa7c7c', // year % 6 === 0  (e.g. 2022)
    '#3aa8d4', // year % 6 === 1  (e.g. 2023) — darkened from #b3efff
    '#d9a900', // year % 6 === 2  (e.g. 2024) — darkened from #fff574
    '#ff6fb7', // year % 6 === 3  (e.g. 2025)
    '#3ac78f', // year % 6 === 4  (e.g. 2026)
    '#a97cfa', // year % 6 === 5  (e.g. 2021)
];

export function colorForYear(year: string | number): string {
    return yearPalette[Number(year) % yearPalette.length];
}

function hexToRgb(hex: string): [number, number, number] {
    const value = hex.replace('#', '');
    return [
        parseInt(value.substring(0, 2), 16),
        parseInt(value.substring(2, 4), 16),
        parseInt(value.substring(4, 6), 16),
    ];
}

// A pale tint of a year's chart colour: the same hue blended heavily toward
// white so UI controls (e.g. the year-filter switches) can echo each line's
// colour without competing with it.
export function palerColorForYear(year: string | number): string {
    const [r, g, b] = hexToRgb(colorForYear(year));
    const toward = (channel: number) => Math.round(channel + (255 - channel) * 0.7);
    return `rgb(${toward(r)}, ${toward(g)}, ${toward(b)})`;
}