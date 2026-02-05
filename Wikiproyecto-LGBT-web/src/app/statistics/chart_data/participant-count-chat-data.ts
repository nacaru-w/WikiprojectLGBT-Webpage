import { newParticipants2021, newParticipants2022, newParticipants2023, newParticipants2024, newParticipants2025 } from "./utils"

export const participantCountData = {
    labels: [
        'Año actual',
        '2025',
        '2024',
        '2023',
        '2022',
        '2021',
        'Resto del tiempo',
    ],
    datasets: [{
        data: [0, newParticipants2025, newParticipants2024, newParticipants2023, newParticipants2022, newParticipants2021, 0],
        backgroundColor: [
            '#3ac78f',
            '#ff6fb7',
            '#fff574',
            '#b1efff',
            '#fa7c7c',
            '#a97cfa',
            '#ffad5c'
        ],
        borderColor: [
            '#000000',
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