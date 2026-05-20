import {
    articleCount2021,
    articleCount2022,
    articleCount2023,
    articleCount2024,
    articleCount2025,
    colorForYear
} from "./utils";

const currentYear = new Date().getFullYear();

export const articlesPerYearData =
{
    labels: ["2021", "2022", "2023", "2024", "2025", "Año actual"],
    datasets: [{
        data: [articleCount2021, articleCount2022, articleCount2023, articleCount2024, articleCount2025, 0],
        backgroundColor: [
            colorForYear(2021),
            colorForYear(2022),
            colorForYear(2023),
            colorForYear(2024),
            colorForYear(2025),
            colorForYear(currentYear)
        ],
        borderColor: [
            '#000000',
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