import { newParticipants2021, newParticipants2022, newParticipants2023 } from "./utils"

export const participantCountData = {
    labels: [
        'Año actual',
        '2023',
        '2022',
        '2021',
        'Resto del tiempo',
    ],
    datasets: [{
        data: [0, newParticipants2023, newParticipants2022, newParticipants2021, 0],
        backgroundColor: [
            '#54de7d',
            '#fa7c7c',
            '#b3efff',
            '#fff574',
            '#ccacfd'
        ],
        borderColor: [
            '#000000',
            '#000000',
            '#000000',
            '#000000',
            '#000000',
        ],
        borderWidth: 2,
        borderRadius: 3,
    }],
}

export const participantCountOptions = {
    maintainAspectRatio: false,
    plugins: {
        legend: {
            labels: {
                color: "#000000",
                font: {
                    family: "'Lexend', sans-serif",

                },
                borderRadius: 3
            }
        }
    }
}