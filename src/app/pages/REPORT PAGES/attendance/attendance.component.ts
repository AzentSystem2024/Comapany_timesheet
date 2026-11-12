import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ReportService } from 'src/app/services/Report-data.service';
import notify from 'devextreme/ui/notify';

@Component({
  selector: 'app-attendance',
  templateUrl: './attendance.component.html',
  styleUrls: ['./attendance.component.scss'],
  providers: [ReportService]
})
export class AttendanceComponent implements OnInit {
  attendanceData: any[] = [];

  // Filter parameters
  years: number[] = [];
  months: any[] = [];
  selectedYear: number;
  selectedMonth: number;
  today: Date = new Date();

  isFilterRowVisible: boolean = false;

  constructor(private reportService: ReportService, private router: Router) {
    const currentYear = new Date().getFullYear();
    for (let i = currentYear - 5; i <= currentYear + 5; i++) {
      this.years.push(i);
    }
    // Filter out 'All' option from months since monthly attendance is month-specific
    this.months = (this.reportService.getMonths() as any[]).filter(m => m.value !== '' && m.value !== undefined);

    this.selectedYear = currentYear;
    this.selectedMonth = new Date().getMonth();
  }

  ngOnInit(): void {
    const logData = JSON.parse(localStorage.getItem('logData') || '{}');
    const isAdmin = logData.isAdmin === true || logData.isAdmin === 1;

    if (!isAdmin) {
      this.router.navigate(['/timesheet']);
      return;
    }

    this.fetchData();
  }

  onYearChanged(e: any): void {
    this.selectedYear = e.value;
  }

  onMonthChanged(e: any): void {
    this.selectedMonth = e.value;
  }

  toggleFilterRow = (): void => {
    this.isFilterRowVisible = !this.isFilterRowVisible;
  };

  refresh = (): void => {
    this.fetchData();
  };

  applyFilter(): void {
    this.fetchData();
  }

  fetchData(): void {
    const year = this.selectedYear || new Date().getFullYear();
    const month = (this.selectedMonth !== null && this.selectedMonth !== undefined)
      ? Number(this.selectedMonth) + 1
      : (new Date().getMonth() + 1);

    this.reportService.fetch_Monthly_Attendance_Data(year, month).subscribe({
      next: (res: any) => {
        if (res && res.data) {
          this.attendanceData = (res.data as any[]).filter(
            (item: any) => item.isAdmin !== true && item.IsAdmin !== true
          );
        } else {
          this.attendanceData = [];
        }
      },
      error: (err) => {
        console.error('Error fetching attendance data:', err);
        notify('Failed to load attendance data', 'error', 3000);
      }
    });
  }
}

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DxDataGridModule, DxDateBoxModule, DxSelectBoxModule, DxButtonModule, DxPopupModule } from 'devextreme-angular';

@NgModule({
  imports: [
    CommonModule,
    DxDataGridModule,
    DxDateBoxModule,
    DxSelectBoxModule,
    DxButtonModule,
    DxPopupModule
  ],
  declarations: [AttendanceComponent],
  exports: [AttendanceComponent]
})
export class AttendanceModule { }

