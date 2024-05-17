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
        label: 'My First Dataset',
        data: [], // Will be populated through a MediaWiki API call
        fill: false,
        borderColor: '#000000',
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