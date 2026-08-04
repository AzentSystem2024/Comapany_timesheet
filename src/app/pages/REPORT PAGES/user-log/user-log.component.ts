import { Component, NgModule, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { DxDataGridModule, DxButtonModule, DxDateBoxModule, DxPopupModule } from 'devextreme-angular';
import { ConfigService } from 'src/app/services/config.service';

@Component({
  selector: 'app-user-log',
  templateUrl: './user-log.component.html',
  styleUrls: ['./user-log.component.scss']
})
export class UserLogComponent implements OnInit {
  userLogData: any[] = [];
  selectedDate: Date = new Date();
  todayDate: Date = new Date();
  
  // Popup properties
  isPopupVisible: boolean = false;
  selectedEmployeeName: string = '';
  selectedEmployeeLogs: any[] = [];
  selectedDateString: string = '';
  refreshButtonOptions: any;

  minDate: Date | null = null;
  isAdmin: boolean = false;
  logUserId: number | null = null;

  constructor(
    private http: HttpClient,
    private configService: ConfigService,
    private router: Router
  ) {
    this.refreshButtonOptions = {
      icon: 'refresh',
      hint: 'Refresh Data',
      onClick: () => this.refreshData(),
      stylingMode: 'text',
      elementAttr: { class: 'commonButtons' }
    };
  }

  ngOnInit(): void {
    const logData = JSON.parse(localStorage.getItem('logData') || '{}');
    this.isAdmin = logData.isAdmin === true || logData.isAdmin === 1 || logData.UserRoleName === 'Administrator';
    this.logUserId = logData.UserID || logData.userId || logData.id || logData.ID || logData.EmployeeID;

    if (logData.DateOfJoin && !this.isAdmin) {
      this.minDate = new Date(logData.DateOfJoin);
      this.minDate.setHours(0, 0, 0, 0);
    }

    this.fetchUserLogs();
  }

  fetchUserLogs() {
    const dateStr = this.selectedDate.toISOString().split('T')[0];
    let url = `${this.configService.apiBaseUrl}Employee/GetUserLogsByDate?logDate=${dateStr}`;
    
    const logData = JSON.parse(localStorage.getItem('logData') || '{}');
    const myId = logData.ID || logData.id || logData.EmployeeID || logData.employeeId || logData.UserID || logData.userId;
    
    if (!this.isAdmin && myId && myId !== 'undefined' && myId !== 'null') {
      url += `&employeeId=${myId}`;
    }
    
    console.log('Requesting URL:', url);
    this.http.get<any>(url).subscribe({
      next: (res) => {
        if (res && res.success) {
          let data = res.data;
          if (!this.isAdmin && myId && myId !== 'undefined' && myId !== 'null') {
            data = data.filter((x: any) => String(x.EmployeeId) === String(myId) || String(x.employeeId) === String(myId) || String(x.EmployeeID) === String(myId));
          }
          this.userLogData = data;
        } else {
          this.userLogData = [];
        }
      },
      error: (err) => {
        console.error('Error fetching user logs', err);
        this.userLogData = [];
      }
    });
  }

  onDateChanged(e: any) {
    if (e.value) {
      this.selectedDate = e.value;
      this.fetchUserLogs();
    }
  }

  onPreviousDay() {
    if (this.isPreviousDateDisabled()) return;
    const prevDay = new Date(this.selectedDate);
    prevDay.setDate(prevDay.getDate() - 1);
    this.selectedDate = prevDay;
    this.fetchUserLogs();
  }

  onNextDay() {
    if (this.isNextDateDisabled()) return;
    const nextDay = new Date(this.selectedDate);
    nextDay.setDate(nextDay.getDate() + 1);
    this.selectedDate = nextDay;
    this.fetchUserLogs();
  }

  isNextDateDisabled(): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selected = new Date(this.selectedDate);
    selected.setHours(0, 0, 0, 0);
    return selected >= today;
  }

  isPreviousDateDisabled(): boolean {
    if (!this.minDate) return false;
    const selected = new Date(this.selectedDate);
    selected.setHours(0, 0, 0, 0);
    return selected <= this.minDate;
  }

  refreshData() {
    this.fetchUserLogs();
  }

  viewDetailedLog = (e: any) => {
    const data = e.row.data;
    this.selectedEmployeeName = data.EmployeeName;
    const dateStr = this.selectedDate.toISOString().split('T')[0];
    this.selectedDateString = this.selectedDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
    const url = `${this.configService.apiBaseUrl}Employee/GetDeviceLogs?employeeId=${data.EmployeeId}&logDate=${dateStr}`;
    
    this.http.get<any>(url).subscribe({
      next: (res) => {
        if (res && res.success) {
          this.selectedEmployeeLogs = res.data.map((timeStr: string) => ({ loginTime: timeStr }));
          this.isPopupVisible = true;
        }
      },
      error: (err) => {
        console.error('Error fetching detailed logs', err);
      }
    });
  }
}

@NgModule({
  imports: [
    CommonModule,
    DxDataGridModule,
    DxButtonModule,
    DxDateBoxModule,
    DxPopupModule
  ],
  declarations: [UserLogComponent],
  exports: [UserLogComponent]
})
export class UserLogModule { }
