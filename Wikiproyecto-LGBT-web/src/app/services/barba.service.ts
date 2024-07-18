import { Injectable } from '@angular/core';
import { LGBTDays } from './models/LGBTDays';

@Injectable({
  providedIn: 'root'
})
export class BarbaService {
  currentDate: Date;
  currentDay: number;
  currentMonth: number;
  currentBarba: string = '';

  dayDictionary: LGBTDays = {
    'Día Internacional de la Visibilidad Trans': {
      keyword: 'trans',
      month: 3,
      days: [31]
    },
    'Día de la Visibilidad Lésbica': {
      keyword: 'lesbian',
      month: 4,
      days: [26]
    },
    'Día Internacional de la Asexualidad': {
      keyword: 'asexual',
      month: 4,
      days: [6]
    },
    'Día Internacional contra la Homofobia, Transfobia y Bifobia': {
      keyword: 'bisexual',
      month: 5,
      days: [17]
    },
    'Día del Orgullo Ágenero': {
      keyword: 'agender',
      month: 5,
      days: [19]
    },
    'Día Internacional de las Personas No Binarias': {
      keyword: 'nb',
      month: 7,
      days: [14]
    },
    'Día de la Visibilidad Bisexual': {
      keyword: 'bisexual',
      month: 9,
      days: [23]
    },
    'Día Internacional de las Lesbianas': {
      keyword: 'lesbian',
      month: 10,
      days: [8]
    },
    'Día Internacional de los Pronombres': {
      keyword: 'nb',
      month: 10,
      days: this.getPronounsDay()
    },
    'Día de la Concienciación Intersexual': {
      keyword: 'intersex',
      month: 10,
      days: [26]
    },
    'Semana de la Concienciación Transgénero': {
      keyword: 'trans',
      month: 11,
      days: this.getTransgenderWeekDays()
    },
    'Día de la Memoria Intersexual': {
      keyword: 'intersex',
      month: 11,
      days: [8]
    },
    'Día de la Memoria Trans': {
      keyword: 'trans',
      month: 11,
      days: [20]
    }
  }



  constructor() {
    this.currentDate = new Date();
    this.currentDay = this.currentDate.getDate();
    this.currentMonth = this.currentDate.getMonth() + 1;
  }

  getCurrentBarba(): string {
    const today = this.currentDay;
    const thisMonth = this.currentMonth;

    if (this.currentBarba) {
      return this.currentBarba
    }

    for (let celebration in this.dayDictionary) {
      let currentCelebration = this.dayDictionary[celebration]
      if (thisMonth == currentCelebration.month) {
        for (let celebrationDay of currentCelebration.days) {
          if (today == celebrationDay) {
            const barba = currentCelebration.keyword
            this.currentBarba = barba
            return barba
          }
        }
      }
    }

    this.currentBarba = 'lgbt'
    return 'lgbt'

  }

  getTransgenderWeekDays(): number[] {
    const currentYear = new Date().getFullYear();
    const novemberFirst = new Date(currentYear, 10, 1); // November 1st

    // Get the day of the week for November 1st
    const firstDayOfWeek = novemberFirst.getDay();

    // Calculate the date of the first Monday in November
    // If November 1st is a Monday, first full week starts on November 1st
    let firstMonday = 1 + (8 - firstDayOfWeek) % 7;
    if (firstDayOfWeek === 0) {
      firstMonday = 2;
    }

    // Get the days of the first full week
    const weekDays: number[] = [];
    for (let i = 0; i < 7; i++) {
      weekDays.push(firstMonday + i);
    }

    return weekDays;
  }

  getPronounsDay(): number[] {
    const currentYear = new Date().getFullYear();
    const octoberFirst = new Date(currentYear, 9, 1); // October 1st

    // Get the day of the week for October 1st
    const firstDayOfWeek = octoberFirst.getDay();

    // Calculate the date of the first Wednesday in October
    const firstWednesday = 1 + (3 - firstDayOfWeek + 7) % 7;

    // Calculate the date of the third Wednesday in October
    const thirdWednesday = firstWednesday + 14;

    return [thirdWednesday];
  }

}
