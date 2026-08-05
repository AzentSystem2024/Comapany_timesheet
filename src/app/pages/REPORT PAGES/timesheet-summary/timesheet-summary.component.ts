import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ReportService } from 'src/app/services/Report-data.service';
import notify from 'devextreme/ui/notify';

@Component({
  selector: 'app-timesheet-summary',
  templateUrl: './timesheet-summary.component.html',
  styleUrls: ['./timesheet-summary.component.scss'],
  providers: [ReportService]
})
export class TimesheetSummaryComponent implements OnInit {

  timesheetData: any[] = [];
  timesheetDetailsData: any[] = [];
  isDetailsPopupVisible: boolean = false;
  detailsPopupTitle: string = 'Timesheet Details';

  // Date filter controls
  years: number[] = [];
  months: any[] = [];

  selectedYear: number | null = null;
  selectedMonth: number | string | null = null;
  startDate: Date | null = null;
  endDate: Date | null = null;
  today: Date = new Date();

  constructor(private reportService: ReportService, private router: Router) {
    const currentYear = new Date().getFullYear();
    for (let i = currentYear - 5; i <= currentYear + 5; i++) {
      this.years.push(i);
    }
    this.months = this.reportService.getMonths();

    this.selectedYear = currentYear;
    this.selectedMonth = ''; // 'All'
    this.startDate = new Date(currentYear, 0, 1);
    this.endDate = this.today;
  }

  ngOnInit() {
    const logData = JSON.parse(localStorage.getItem('logData') || '{}');
    const email = logData.emailID || logData.EmailID || logData.emailId || '';
    const empName = logData.employeeName || logData.EmployeeName || '';
    const isAdmin = logData.isAdmin === true || logData.isAdmin === 1;

    if (!isAdmin) {
      this.router.navigate(['/timesheet']);
      return;
    }

    this.fetchData();
  }

  onYearChanged(e: any) {
    this.selectedYear = e.value;
    this.updateDateRangeFromYearMonth();
  }

  onMonthChanged(e: any) {
    this.selectedMonth = e.value;
    this.updateDateRangeFromYearMonth();
  }

  isFilterRowVisible: boolean = false;
  isContentVisible: boolean = true;

  updateDateRangeFromYearMonth() {
    if (this.selectedYear) {
      if (this.selectedMonth !== null && this.selectedMonth !== '') {
        const monthIndex = Number(this.selectedMonth);
        this.startDate = new Date(this.selectedYear, monthIndex, 1);

        let calculatedEnd = new Date(this.selectedYear, monthIndex + 1, 0); // last day of month
        this.endDate = calculatedEnd > this.today ? this.today : calculatedEnd;
      } else {
        this.startDate = new Date(this.selectedYear, 0, 1);
        let calculatedEnd = new Date(this.selectedYear, 11, 31);
        this.endDate = calculatedEnd > this.today ? this.today : calculatedEnd;
      }
    }
  }

  toggleFilterRow = () => {
    this.isFilterRowVisible = !this.isFilterRowVisible;
  }

  toggleContent() {
    this.isContentVisible = !this.isContentVisible;
  }

  refresh = () => {
    this.fetchData();
  }

  applyFilter() {
    this.isContentVisible = false; // Hide filter parameters on apply
    this.fetchData();
  }

  fetchData() {
    const startStr = this.startDate ? this.reportService.formatDate(this.startDate) : '';
    const endStr = this.endDate ? this.reportService.formatDate(this.endDate) : '';

    this.reportService.fetch_Timesheet_Summary_Data(startStr, endStr).subscribe({
      next: (res: any) => {
        if (res && res.data) {
          this.timesheetData = res.data;
        } else {
          this.timesheetData = [];
        }
      },
      error: (err) => {
        console.error('Error fetching summary:', err);
        notify('Failed to load report data', 'error', 3000);
      }
    });
  }

  calculateCustomSummary(options: any) {
    if (options.name === 'totalHoursSummary') {
      if (options.summaryProcess === 'start') {
        options.totalValue = 0;
      }
      if (options.summaryProcess === 'calculate') {
        const val = options.value ? parseFloat(options.value) : 0;
        if (val) {
          const hours = Math.floor(val);
          const minutes = Math.round((val - hours) * 100);
          options.totalValue += (hours * 60) + minutes;
        }
      }
      if (options.summaryProcess === 'finalize') {
        const totalMinutes = options.totalValue;
        const h = Math.floor(totalMinutes / 60);
        const m = totalMinutes % 60;
        options.totalValue = parseFloat(`${h}.${m < 10 ? '0' + m : m}`).toFixed(2);
      }
    }
  }

  showDetailsPopup(e: any) {
    const rowData = e.row.data;
    const projectName = rowData.ProjectName || rowData.project || rowData.Project;
    const employeeName = rowData.EmployeeName || rowData.employee || rowData.Employee;
    const activityName = rowData.ActivityName || rowData.activity || rowData.Activity;
    
    const startStr = this.startDate ? this.reportService.formatDate(this.startDate) : '';
    const endStr = this.endDate ? this.reportService.formatDate(this.endDate) : '';

    let title = `Details: ${projectName} - ${employeeName}`;
    if (startStr && endStr) {
      title += ` (${startStr} to ${endStr})`;
    } else if (startStr) {
      title += ` (From ${startStr})`;
    } else if (endStr) {
      title += ` (Until ${endStr})`;
    }
    this.detailsPopupTitle = title;

    this.reportService.fetch_Timesheet_Summary_Details_Data(projectName, employeeName, activityName, startStr, endStr).subscribe({
      next: (res: any) => {
        if (res && res.data) {
          this.timesheetDetailsData = res.data;
          this.isDetailsPopupVisible = true;
        } else {
          this.timesheetDetailsData = [];
        }
      },
      error: (err) => {
        console.error('Error fetching details:', err);
        notify('Failed to load report details', 'error', 3000);
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
  declarations: [TimesheetSummaryComponent],
  exports: [TimesheetSummaryComponent]
})
export class TimesheetSummaryModule { }
