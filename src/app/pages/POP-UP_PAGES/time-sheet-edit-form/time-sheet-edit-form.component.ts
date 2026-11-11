import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
} from '@angular/forms';
import {
  AfterViewChecked,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  NgModule,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import notify from 'devextreme/ui/notify';
import {
  DxSelectBoxModule,
  DxTextBoxModule,
  DxButtonModule,
  DxValidatorModule,
  DxDateBoxModule,
  DxValidationGroupModule,
  DxNumberBoxModule,
  DxValidationGroupComponent,
  DxDataGridModule,
  DxDataGridComponent
} from 'devextreme-angular';
import { MasterReportService } from '../../MASTER PAGES/master-report.service';
import { BrowserModule } from '@angular/platform-browser';

@Component({
  selector: 'app-time-sheet-edit-form',
  templateUrl: './time-sheet-edit-form.component.html',
  styleUrls: ['./time-sheet-edit-form.component.scss'],
})
export class TimeSheetEditFormComponent implements OnChanges, OnInit, AfterViewChecked {
  @ViewChild('validationGroup', { static: true })
  validationGroup!: DxValidationGroupComponent;

  @ViewChild(DxDataGridComponent, { static: false }) dataGrid!: DxDataGridComponent;

  @Input() formdata: any;
  @Input() isReadOnly: boolean = false;

  @Output() closeForm = new EventEmitter();

  loggedUserName: string = '';
  newUserData: any = {};
  
  timesheetEntries: any[] = [];
  projectList: any[] = [];
  activityList: any[] = [];
  dummyLoginTimes: any[] = [];

  formatDate(dateVal: any): string {
    if (!dateVal) return '';
    if (typeof dateVal === 'string' && /^\d{4}-\d{2}-\d{2}/.test(dateVal)) {
      return dateVal.substring(0, 10);
    }
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return '';
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  getISTNow(): { istDateStr: string; istHour: number } {
    const now = new Date();
    try {
      const istDateStr = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
      const istTimeStr = now.toLocaleTimeString('en-GB', { timeZone: 'Asia/Kolkata', hour12: false });
      const istHour = parseInt(istTimeStr.split(':')[0], 10);
      if (istDateStr && !isNaN(istHour)) {
        return { istDateStr, istHour };
      }
    } catch (e) {}
    const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
    const istDate = new Date(utcTime + (330 * 60000));
    const year = istDate.getFullYear();
    const month = String(istDate.getMonth() + 1).padStart(2, '0');
    const day = String(istDate.getDate()).padStart(2, '0');
    return {
      istDateStr: `${year}-${month}-${day}`,
      istHour: istDate.getHours()
    };
  }

  constructor(
    private service: MasterReportService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes.formdata && changes.formdata.currentValue) {
      this.newUserData = {
        TimesheetId: this.formdata.TimesheetId || this.formdata.ID || this.formdata.id,
        EmployeeId: this.formdata.EmployeeId || this.formdata.EmployeeID || this.formdata.employeeID,
        TimeSheetDate: this.formdata.TimeSheetDate || this.formdata.TimesheetDate || this.formdata.timesheetDate
      };
      
      this.loggedUserName = this.formdata.EmployeeName || this.formdata.employeeName || this.formdata.EmployeeNo || this.formdata.employeeNo;

      if (!this.loggedUserName) {
         const logData = JSON.parse(localStorage.getItem('logData') || '{}');
         this.loggedUserName = logData.EmployeeName || logData.UserName || 'Current User';
      }

      this.fetchEntries(this.newUserData.TimesheetId);
      this.fetchDeviceLogs(this.newUserData.EmployeeId, this.newUserData.TimeSheetDate);
    }
  }

  fetchDeviceLogs(employeeId: number, logDate: string) {
    if (employeeId && logDate) {
      // Clear before fetching
      this.dummyLoginTimes = [];
      this.service.getDeviceLogs(employeeId, logDate).subscribe({
        next: (res: any) => {
          if (res && res.success && res.data) {
            this.dummyLoginTimes = res.data.map((timeStr: string) => ({ loginTime: timeStr }));
            this.cdr.detectChanges();
          }
        },
        error: (err) => {
          console.error("Error fetching device logs:", err);
        }
      });
    }
  }

  ngOnInit() {
    this.service.get_Project_List().subscribe({
      next: (res: any) => {
        if (res) {
          this.projectList = res.data || res;
        }
      }
    });
    this.service.get_Activity_List().subscribe({
      next: (res: any) => {
        if (res) {
          this.activityList = res.data || res;
        }
      }
    });
  }

  ngAfterViewChecked() {
    this.cdr.detectChanges();
  }

  fetchEntries(timesheetId: number) {
    if (!timesheetId) return;
    this.service.get_TimesheetEntry_By_TimesheetId(timesheetId).subscribe({
      next: (res: any) => {
        if (res && res.flag === '1' && res.data) {
          const entries = Array.isArray(res.data) ? res.data : [res.data];
          this.timesheetEntries = entries.map((entry: any) => {
            const totalMinutes = entry.Minutes || 0;
            const hour = Math.floor(totalMinutes / 60);
            const minutes = totalMinutes % 60;
            return {
              ID: entry.ID,
              ProjectID: entry.ProjectID,
              ActivityID: entry.ActivityID,
              Module: entry.Module,
              Remarks: entry.Remarks,
              Hour: hour,
              Minutes: minutes
            };
          });
          
          if (this.timesheetEntries.length === 0 && !this.isReadOnly) {
            this.addRow();
          }
        } else {
           this.timesheetEntries = [];
           if (!this.isReadOnly) this.addRow();
        }
      },
      error: () => {
        this.timesheetEntries = [];
        if (!this.isReadOnly) this.addRow();
      }
    });
  }

  addRow() {
    if (this.isReadOnly) return;
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
    if (this.isReadOnly) return;
    if (this.timesheetEntries.length > 1) {
      this.timesheetEntries.splice(index, 1);
    } else {
      notify({ message: 'At least one entry is required.', position: { at: 'top right', my: 'top right' }, displayTime: 1500 }, 'warning');
    }
  }

  validateForm(): boolean {
    if (this.validationGroup && this.validationGroup.instance) {
      return this.validationGroup.instance.validate().isValid;
    }
    return true;
  }

  isSaving: boolean = false;

  async saveEntries() {
    if (this.isSaving) return;
    this.isSaving = true;

    if (this.dataGrid && this.dataGrid.instance) {
      await this.dataGrid.instance.saveEditData();
    }
    
    const targetDateStr = this.formatDate(this.newUserData.TimeSheetDate);
    const { istDateStr, istHour } = this.getISTNow();

    if (targetDateStr === istDateStr && istHour >= 23) {
      notify({ message: "Today's Time is Over and you cannot update or add at that day.", position: { at: 'top right', my: 'top right' }, displayTime: 3000 }, 'error');
      this.isSaving = false;
      return;
    }

    if (!this.validateForm()) {
      this.isSaving = false;
      return;
    }

    let currentEntries = this.timesheetEntries;
    if (this.dataGrid && this.dataGrid.instance) {
      const dataSource = this.dataGrid.instance.getDataSource();
      if (dataSource) {
        currentEntries = dataSource.items();
      }
    }
    
    let totalMinutesCount = 0;
    let isValid = true;
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
    
    if (!isValid) {
      this.isSaving = false;
      return;
    }

    const finalHours = Math.floor(totalMinutesCount / 60);
    const finalMins = totalMinutesCount % 60;
    const totalHoursFormatted = parseFloat(`${finalHours}.${finalMins < 10 ? '0' + finalMins : finalMins}`);

    const timesheetId = this.newUserData.TimesheetId;

    let adjustedTsDate = this.newUserData.TimeSheetDate;
    if (adjustedTsDate instanceof Date) {
       adjustedTsDate = new Date(adjustedTsDate.getTime() - (adjustedTsDate.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
    } else if (typeof adjustedTsDate === 'string' && adjustedTsDate.includes('T')) {
       adjustedTsDate = adjustedTsDate.split('T')[0];
    }

    const headerPayload = {
      ID: timesheetId,
      EmployeeId: this.newUserData.EmployeeId,
      TimesheetDate: adjustedTsDate,
      Hours: totalHoursFormatted
    };

    this.service.update_Timesheet_Data(headerPayload).subscribe({
      next: (headerRes: any) => {
        if (headerRes && headerRes.flag === '1') {
          // 2. Delete old entries
          this.service.delete_TimesheetEntry_By_TimesheetId(timesheetId).subscribe({
            next: (delRes: any) => {
              // 3. Insert new entries
              let savedCount = 0;
              let hasError = false;

              if (currentEntries.length === 0) {
                 notify({ message: 'Timesheet updated successfully', position: { at: 'top right', my: 'top right' }, displayTime: 1000 }, 'success');
                 this.exitForm();
                 return;
              }

              currentEntries.forEach((entry: any, index: number) => {
                const totalEntryMinutes = (entry.Hour ? parseFloat(entry.Hour) * 60 : 0) + (entry.Minutes ? parseFloat(entry.Minutes) : 0);
                const entryPayload = {
                  TimesheetId: timesheetId,
                  ProjectId: entry.ProjectID || 0,
                  ActivityId: entry.ActivityID || 0,
                  Remarks: entry.Remarks,
                  Minutes: totalEntryMinutes,
                  Module: entry.Module
                };

                this.service.insert_TimesheetEntry_Data(entryPayload).subscribe({
                  next: (entryRes: any) => {
                    savedCount++;
                    if (entryRes && entryRes.flag !== '1') {
                      hasError = true;
                      notify({ message: 'Failed to save row ' + (index + 1), position: { at: 'top right', my: 'top right' }, displayTime: 1500 }, 'error');
                    }
                    if (savedCount === currentEntries.length) {
                      if (!hasError) {
                        notify({ message: 'Timesheet updated successfully!', position: { at: 'top right', my: 'top right' }, displayTime: 1500 }, 'success');
                        this.exitForm();
                      } else {
                        this.isSaving = false;
                      }
                    }
                  },
                  error: () => {
                     savedCount++;
                     hasError = true;
                     if (savedCount === currentEntries.length) {
                       this.isSaving = false;
                       this.exitForm();
                     }
                  }
                });
              });
            },
            error: () => {
              this.isSaving = false;
              notify({ message: 'Error deleting old entries.', position: { at: 'top right', my: 'top right' }, displayTime: 1500 }, 'error')
            }
          });
        } else {
          this.isSaving = false;
          notify({ message: headerRes.message || 'Update failed', position: { at: 'top right', my: 'top right' }, displayTime: 1500 }, 'error');
        }
      },
      error: () => {
        this.isSaving = false;
        notify({ message: 'Server error on update', position: { at: 'top right', my: 'top right' }, displayTime: 1500 }, 'error')
      }
    });
  }

  onKeyDown(e: any) {
    if (e.event.key === 'Enter') {
      setTimeout(() => {
        if (!this.isReadOnly) {
          this.dataGrid.instance.addRow();
        }
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
    this.closeForm.emit();
  }
}

@NgModule({
  imports: [
    CommonModule,
    DxTextBoxModule,
    DxButtonModule,
    DxValidatorModule,
    DxDateBoxModule,
    BrowserModule,
    ReactiveFormsModule,
    DxValidationGroupModule,
    DxNumberBoxModule,
    DxSelectBoxModule,
    DxDataGridModule
  ],
  declarations: [TimeSheetEditFormComponent],
  exports: [TimeSheetEditFormComponent],
})
export class TimeSheetEditFormModule {}
