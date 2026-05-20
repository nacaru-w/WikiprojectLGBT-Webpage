import { colorForYear } from "./utils";

function getCurrentYear() {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    return currentYear.toString();
}

export const thisYear = getCurrentYear();
export const lastYear = (+thisYear - 1).toString();
export const twoYearsAgo = (+lastYear - 1).toString();
export const threeYearsAgo = (+lastYear - 2).toString();

// One line per year. Colours come from the shared palette so they mirror each
// year's colour in the "Artículos por año" chart (see colorForYear in utils.ts).
function yearDataset(year: string) {
    const color = colorForYear(year);
    return {
        label: year,
        data: [] as number[], // Will be populated through a MediaWiki API call
        fill: false,
        borderColor: color,
        hoverBackgroundColor: color,
        pointBackgroundColor: color,
        pointBorderColor: '#000000',
        pointBorderWidth: 2,
        pointRadius: 4,
        tension: 0.1,
        borderWidth: 3,
    };
}

export const monthlyCountData = {
    labels: [
        'Enero',
        'Febrero',
        'Marzo',
        'Abril',
        'Mayo',
        'Junio',
        'Julio',
        'Agosto',
        'Septiembre',
        'Octubre',
        'Noviembre',
        'Diciembre'
    ],
    datasets: [
        yearDataset(thisYear),
        yearDataset(lastYear),
        yearDataset(twoYearsAgo),
        yearDataset(threeYearsAgo),
    ]
}

export const monthlyCountOptions = {
    maintainAspectRatio: false,
    plugins: {
        legend: {
            display: false
        }
    },
    scales: {
        x: {
            ticks: {
                color: "#000",
                font: {
                    family: "'Lexend', sans-serif",
                }
            }
        },
        y: {
            beginAtZero: true,
            ticks: {
                color: "#000",
                font: {
                    family: "'Lexend', sans-serif",
                }
            }
        }
    }
}