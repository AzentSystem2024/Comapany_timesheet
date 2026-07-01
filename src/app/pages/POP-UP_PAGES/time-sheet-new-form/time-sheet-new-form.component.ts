import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  AfterViewChecked,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewChild,
  NgModule
} from '@angular/core';
import {
  DxSelectBoxModule,
  DxTextBoxModule,
  DxButtonModule,
  DxValidatorModule,
  DxDateBoxModule,
  DxNumberBoxModule,
  DxValidationGroupComponent,
  DxValidationGroupModule,
  DxDataGridModule,
  DxDataGridComponent
} from 'devextreme-angular';
import { MasterReportService } from '../../MASTER PAGES/master-report.service';
import notify from 'devextreme/ui/notify';

@Component({
  selector: 'app-time-sheet-new-form',
  templateUrl: './time-sheet-new-form.component.html',
  styleUrls: ['./time-sheet-new-form.component.scss'],
  providers: [MasterReportService, ReactiveFormsModule],
})
export class TimeSheetNewFormComponent implements OnInit, AfterViewChecked {
  @ViewChild('validationGroup', { static: true }) validationGroup!: DxValidationGroupComponent;
  @ViewChild(DxDataGridComponent, { static: false }) dataGrid!: DxDataGridComponent;
  
  @Output() save = new EventEmitter<any>();
  @Output() close = new EventEmitter<void>();
  @Input() selectedDate: Date = new Date();
  @Input() existingTimesheets: any[] = [];

  loggedUserName: string = '';
  newUserData: any = {
    TimeSheetDate: new Date(),
    EmployeeId: null
  };

  timesheetEntries: any[] = [];
  projectList: any[] = [];
  activityList: any[] = [];
  userList: any[] = [];
  isAdmin: boolean = false;
  logUserId: any;

  constructor(
    private service: MasterReportService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const logData = JSON.parse(localStorage.getItem('logData') || '{}');
    this.loggedUserName = logData.EmployeeName || logData.UserName || 'Current User';
    const logUserRole = logData.UserRoleName || logData.userRoleName || '';
    this.isAdmin = (logUserRole === 'Administrator');
    this.logUserId = logData.UserID || logData.userId || logData.id || logData.ID || logData.EmployeeID || logData.employeeID || logData.employeeId;
    
    this.newUserData.TimeSheetDate = this.selectedDate;
    this.newUserData.EmployeeId = this.isAdmin ? null : this.logUserId;

    // Initialize with one blank row
    this.addRow();

    // Fetch master data
    this.get_ProjectList();
    this.get_ActivityList();
    if (this.isAdmin) {
      this.get_UserList();
    }
  }

  get_UserList() {
    this.service.get_Employee_List().subscribe({
      next: (res: any) => {
        if (res) {
          this.userList = res.data || res;
        }
      },
      error: (err) => console.error(err)
    });
  }

  ngAfterViewChecked() {
    this.cdr.detectChanges();
  }

  addRow() {
    this.timesheetEntries.push({
      ProjectID: null,
      ActivityID: null,
      Module: '',
      Remarks: '',
      Hour: 0,
      Minutes: 0
    });
  }

  removeRow(index: number) {
    if (this.timesheetEntries.length > 1) {
      this.timesheetEntries.splice(index, 1);
    } else {
      notify({ message: 'At least one entry is required.', position: { at: 'top right', my: 'top right' }, displayTime: 1500 }, 'warning');
    }
  }

  get_ProjectList() {
    this.service.get_Project_List().subscribe({
      next: (res: any) => {
        if (res) {
          this.projectList = res.data || res;
        }
      },
      error: (err) => {
        console.error(err);
      }
    });
  }

  get_ActivityList() {
    this.service.get_Activity_List().subscribe({
      next: (res: any) => {
        if (res) {
          this.activityList = res.data || res;
        }
      },
      error: (err) => {
        console.error(err);
      }
    });
  }

  validateForm(): boolean {
    if (this.validationGroup && this.validationGroup.instance) {
      const result = this.validationGroup.instance.validate();
      return result.isValid;
    }
    return true;
  }

  getNewUserData() {
    let currentEntries = this.timesheetEntries;
    if (this.dataGrid && this.dataGrid.instance) {
      const dataSource = this.dataGrid.instance.getDataSource();
      if (dataSource) {
        currentEntries = dataSource.items();
      }
    }

    return {
      TimeSheetDate: this.newUserData.TimeSheetDate,
      EmployeeId: this.newUserData.EmployeeId,
      entries: currentEntries
    };
  }

  isSaving: boolean = false;

  async saveEntries() {
    if (this.isSaving) return;
    this.isSaving = true;

    if (this.dataGrid && this.dataGrid.instance) {
      await this.dataGrid.instance.saveEditData();
    }
    
    if (this.validateForm()) {
      let currentEntries = this.timesheetEntries;
      if (this.dataGrid && this.dataGrid.instance) {
        const dataSource = this.dataGrid.instance.getDataSource();
        if (dataSource) {
          currentEntries = dataSource.items();
        }
      }

      let isValid = true;
      let totalMinutesCount = 0;
      for (const entry of currentEntries) {
        if (!entry.Hour && !entry.Minutes) {
          notify({ message: 'Please enter Hours or Minutes for all entries.', position: { at: 'top right', my: 'top right' }, displayTime: 2500 }, 'error');
          isValid = false;
          break;
        }
        const h = entry.Hour ? parseInt(entry.Hour, 10) : 0;
        const m = entry.Minutes ? parseInt(entry.Minutes, 10) : 0;
        totalMinutesCount += (h * 60) + m;
      }
      
      if (isValid && totalMinutesCount > 1440) {
        notify({ message: 'Invalid timesheet: Total working hours cannot exceed 24 hours per day.', position: { at: 'top right', my: 'top right' }, displayTime: 3000 }, 'error');
        isValid = false;
      }

      if (isValid) {
        this.save.emit(this.getNewUserData());
      } else {
        this.isSaving = false;
      }
    } else {
      this.isSaving = false;
    }
  }

  onKeyDown(e: any) {
    if (e.event.key === 'Enter') {
      setTimeout(() => {
        this.dataGrid.instance.addRow();
      }, 50);
    }
  }

  calculateTotalTime = (options: any) => {
    if (options.name === 'totalTime') {
      if (options.summaryProcess === 'start') {
        options.totalValue = { hours: 0, minutes: 0 };
      } else if (options.summaryProcess === 'calculate') {
        const h = (options.value && options.value.Hour) ? parseInt(options.value.Hour, 10) : 0;
        const m = (options.value && options.value.Minutes) ? parseInt(options.value.Minutes, 10) : 0;
        options.totalValue.hours += h;
        options.totalValue.minutes += m;
      } else if (options.summaryProcess === 'finalize') {
        const totalMinutes = (options.totalValue.hours * 60) + options.totalValue.minutes;
        const finalHours = Math.floor(totalMinutes / 60);
        const finalMins = totalMinutes % 60;
        options.totalValue = `${finalHours}h ${finalMins}m`;
      }
    }
  };

  exitForm() {
    this.close.emit();
  }

  onEmployeeOrDateChanged() {
    if (this.newUserData.EmployeeId && this.newUserData.TimeSheetDate) {
      const selDateStr = new Date(this.newUserData.TimeSheetDate.getTime() - (this.newUserData.TimeSheetDate.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
      
      const existing = this.existingTimesheets.find(x => {
        const tsDate = x.timesheetDate || x.TimesheetDate;
        const empId = x.employeeID || x.EmployeeID || x.employeeId || x.EmployeeId;
        if (!tsDate || !empId) return false;
        const rowDateStr = new Date(tsDate).toISOString().split('T')[0];
        return rowDateStr === selDateStr && empId.toString() === this.newUserData.EmployeeId.toString();
      });

      if (existing) {
        const empName = existing.employeeName || existing.EmployeeName || 'This employee';
        notify({ message: `${empName} Already Have Timesheet At This Day Please Edit it`, position: { at: 'top right', my: 'top right' }, displayTime: 3000 }, 'error');
        
        setTimeout(() => {
          this.newUserData.EmployeeId = null;
        }, 100);
      }
    }
  }
}

@NgModule({
  imports: [
    CommonModule,
    DxSelectBoxModule,
    DxTextBoxModule,
    DxButtonModule,
    DxValidatorModule,
    DxDateBoxModule,
    DxValidationGroupModule,
    DxNumberBoxModule,
    ReactiveFormsModule,
    DxDataGridModule
  ],
  providers: [],
  declarations: [TimeSheetNewFormComponent],
  exports: [TimeSheetNewFormComponent],
})
export class TimeSheetNewFormModule {}
