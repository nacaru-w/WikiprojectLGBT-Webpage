function getCurrentYear() {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    return currentYear.toString();
}

export const thisYear = getCurrentYear()
export const lastYear = (+getCurrentYear() - 1).toString()

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