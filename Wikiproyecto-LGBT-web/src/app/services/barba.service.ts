import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class BarbaService {
  currentDate: Date;
  currentDay: number;
  currentMonth: number;
  currentBarba: string = '';

  constructor() {
    this.currentDate = new Date();
    this.currentDay = this.currentDate.getDay();
    this.currentMonth = this.currentDate.getMonth() - 1;
  }

  // getCurrentBarba(): string {
  //   if (this.currentBarba) {
  //     return this.currentBarba
  //   }

  //   switch(this.)

  // }

}
