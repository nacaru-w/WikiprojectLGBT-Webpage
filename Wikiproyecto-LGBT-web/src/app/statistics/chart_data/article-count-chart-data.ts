import {
    articleCount2021,
    articleCount2022,
    articleCount2023,
    articleCount2024
} from "./utils";

export const articlesPerYearData =
{
    labels: ["2021", "2022", "2023", "2024", "Año actual"],
    datasets: [{
        data: [articleCount2021, articleCount2022, articleCount2023, articleCount2024, 0],
        backgroundColor: [
            '#54de7d',
            '#fa7c7c',
            '#b3efff',
            '#fff574',
            '#a97cfa'
        ],
        borderColor: [
            '#000000',
            '#000000',
            '#000000',
            '#000000',
            '#000000',
        ],
        borderWidth: 3,
        borderRadius: 10,
        color: "#000"
    }]
};

export const articlesPerYearOptions = {
    maintainAspectRatio: false,
    plugins: {
        legend: {
            color: "#000",
            display: false,
            labels: {
                font: {
                    family: "'Lexend', sans-serif",
                    fontColor: "#000"
                },
            }
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
            ticks: {
                color: "#000",
                font: {
                    family: "'Lexend', sans-serif",
                }
            }
        }
    }
}