export const monthlyCountData = {
    labels: [
        'Enero',
        'Febrero',
        'Marzo',
        'Abril',
        'Mayo',
        'Junio',
        'Julio',
        'Agosto'
    ],
    datasets: [{
        label: 'Artículos en este mes',
        data: [], // Will be populated through a MediaWiki API call
        fill: false,
        borderColor: '#000000',
        hoverBackgroundColor: '#ffe3ea',
        pointBackgroundColor: '#ffe3ea',
        tension: 0.1,
        borderWidth: 3,
    }]
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