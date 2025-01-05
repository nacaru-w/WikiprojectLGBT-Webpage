function getCurrentYear() {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    return currentYear.toString();
}

export const thisYear = getCurrentYear();
export const lastYear = (+thisYear - 1).toString();
export const twoYearsAgo = (+lastYear - 1).toString();
export const threeYearsAgo = (+lastYear - 2).toString();

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
        {
            label: thisYear,
            data: [], // Will be populated through a MediaWiki API call
            fill: false,
            borderColor: '#000000',
            hoverBackgroundColor: '#ffe3ea',
            pointBackgroundColor: '#ffe3ea',
            tension: 0.1,
            borderWidth: 3,
        },
        {
            label: lastYear,
            data: [], // Will be populated through a MediaWiki API call
            fill: false,
            borderColor: '#9e9e9e',
            hoverBackgroundColor: '#bdbdbd',
            pointBackgroundColor: '#bdbdbd',
            tension: 0.1,
            borderWidth: 3,
        },
        {
            label: twoYearsAgo,
            data: [],
            fill: false,
            borderColor: '#cacaca',
            hoverBackgroundColor: '#f5f5f5',
            pointBackgroundColor: '#f5f5f5',
            tension: 0.1,
            borderWidth: 3,
        },
        {
            label: threeYearsAgo,
            data: [],
            fill: false,
            borderColor: '#d8d8d8',
            hoverBackgroundColor: '#eaeaea',
            pointBackgroundColor: '#eaeaea',
            tension: 0.1,
            borderWidth: 3,
        }
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