import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  NgModule,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import {
  DxDataGridModule,
  DxButtonModule,
  DxDropDownButtonModule,
  DxSelectBoxModule,
  DxTextBoxModule,
  DxLookupModule,
  DxDataGridComponent,
  DxPopupModule,
  DxDateBoxModule,
} from 'devextreme-angular';
import { FormPopupModule } from 'src/app/components';
import notify from 'devextreme/ui/notify';
import { ReportService } from 'src/app/services/Report-data.service';
import { MasterReportService } from '../master-report.service';
import {
  TimeSheetNewFormComponent,
  TimeSheetNewFormModule,
} from '../../POP-UP_PAGES/time-sheet-new-form/time-sheet-new-form.component';
import {
  TimeSheetEditFormComponent,
  TimeSheetEditFormModule,
} from '../../POP-UP_PAGES/time-sheet-edit-form/time-sheet-edit-form.component';
import DataSource from 'devextreme/data/data_source';
import { ActivatedRoute, Router } from '@angular/router';
import { DataService } from 'src/app/services';

@Component({
  selector: 'app-time-sheet',
  templateUrl: './time-sheet.component.html',
  styleUrls: ['./time-sheet.component.scss'],
  providers: [MasterReportService, ReportService, DataService],
})
export class TimeSheetComponent {
  @ViewChild(DxDataGridComponent, { static: false }) dataGrid!: DxDataGridComponent;
  @ViewChild(TimeSheetNewFormComponent) newFormComponent!: TimeSheetNewFormComponent;
  @ViewChild(TimeSheetEditFormComponent) editFormComponent!: TimeSheetEditFormComponent;

  @ViewChild(TimeSheetNewFormComponent, { static: false })
  TimeSheetNewForm!: TimeSheetNewFormComponent;

  popupwidth: any = '65%';

  isAddFormPopupOpened: boolean = false;
  isEditPopupOpened: boolean = false;
  isViewMode: boolean = false;
  selectedRowData: any;
  readonly allowedPageSizes: any = [5, 10, 'all'];
  displayMode: any = 'full';
  showPageSizeSelector = true;
  showInfo = true;
  showNavButtons = true;
  isAdmin: boolean = false;
  logUserId: any;
  allTimesheets: any[] = [];

  getLocalData() {
    const data = localStorage.getItem('timeSheetData');
    return data ? JSON.parse(data) : [];
  }

  saveLocalData(data: any[]) {
    localStorage.setItem('timeSheetData', JSON.stringify(data));
  }

  selectedDate: Date = new Date();

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

  datasource = new DataSource<any>({
    load: () =>
      new Promise((resolve, reject) => {
        const logData = JSON.parse(localStorage.getItem('logData') || '{}');
        const logUserId = logData.UserID || logData.userId || logData.id || logData.ID || logData.EmployeeID || logData.employeeID || logData.employeeId;
        const logUserRole = logData.UserRoleName || logData.userRoleName || '';
        this.isAdmin = (logUserRole === 'Administrator' || logData.isAdmin === true || logData.isAdmin === 1);
        this.logUserId = logUserId;
        
        let reqDate: string | undefined = undefined;
        let reqEmployeeId: number | undefined = logUserId;
        let reqIsAdmin: boolean = this.isAdmin;
        
        if (this.selectedDate) {
           reqDate = this.formatDate(this.selectedDate);
        }

        this.service.get_Timesheet_List(reqDate, reqEmployeeId, reqIsAdmin).subscribe({
          next: (res: any) => {
            let data = res && res.data ? res.data : res;
            this.allTimesheets = data;


            resolve(data);
          },
          error: (err) => {
            const errorMessage = err?.status === 0 || err?.status === 504
              ? 'Unable to connect to the server. Please ensure the backend API is running.'
              : (err?.error?.message || err?.message || 'Failed to load timesheet data.');
            reject(errorMessage);
          },
        });
      }),
  });

  todayDate: Date = new Date();
  minDate: Date | null = null;

  ngOnInit(): void {
    const logData = JSON.parse(localStorage.getItem('logData') || '{}');
    const logUserRole = logData.UserRoleName || logData.userRoleName || '';
    this.isAdmin = (logUserRole === 'Administrator' || logData.isAdmin === true || logData.isAdmin === 1);
    if (logData.DateOfJoin && !this.isAdmin) {
      this.minDate = new Date(logData.DateOfJoin);
      this.minDate.setHours(0, 0, 0, 0);
    }
  }

  previousDate() {
    if (this.isPreviousDateDisabled()) return;
    const newDate = new Date(this.selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    this.selectedDate = newDate;
    this.dataGrid.instance.refresh();
  }

  isNextDateDisabled(): boolean {
    const selectedDateStr = this.formatDate(this.selectedDate);
    const todayStr = this.formatDate(this.todayDate);
    return selectedDateStr >= todayStr;
  }

  isPreviousDateDisabled(): boolean {
    if (!this.minDate) return false;
    const selectedDateStr = this.formatDate(this.selectedDate);
    const minStr = this.formatDate(this.minDate);
    return selectedDateStr <= minStr;
  }

  nextDate() {
    if (this.isNextDateDisabled()) return;
    const newDate = new Date(this.selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    this.selectedDate = newDate;
    this.dataGrid.instance.refresh();
  }

  onDateChanged(e: any) {
    if (e.value) {
      this.selectedDate = e.value;
      if (this.dataGrid && this.dataGrid.instance) {
        this.dataGrid.instance.refresh();
      }
    }
  }
  addButtonOptions: any;

  isFilterRowVisible: boolean = false;
  currentPathName: string;
  initialized: boolean;
  menuPrevilage: { CanAdd: boolean; CanEdit: boolean; CanDelete: boolean };

  constructor(
    private service: MasterReportService,
    private reportService: ReportService,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private dataService: DataService,
    private route: ActivatedRoute
  ) {
    this.route.url.subscribe((segments) => {
      const fullUrl = segments.map((s) => s.path).join('/');
      console.log(fullUrl);
      this.menuPrevilage = this.dataService.getMenuPrevilages(fullUrl);
    });
    this.addButtonOptions = {
      text: 'New',
      icon: 'bi bi-plus-circle',
      type: 'default',
      stylingMode: 'contained',
      hint: 'Add new entry',
      disabled: false, // Ensure the Add button is enabled for testing
      onClick: () => this.show_new_Form(),
      elementAttr: { class: 'add-button' },
    };
  }

  toggleFilterRow = () => {
    this.isFilterRowVisible = !this.isFilterRowVisible;
  };

  isEditDeleteAllowed = (e: any): boolean => {
    const logData = JSON.parse(localStorage.getItem('logData') || '{}');
    const logUserRole = logData.UserRoleName || logData.userRoleName || '';
    if (logUserRole === 'Administrator' || logData.isAdmin === true || logData.isAdmin === 1) {
      return true;
    }

    const rowData = e.row.data;
    if (!rowData || !rowData.TimesheetDate) return false;
    
    const timesheetDateStr = this.formatDate(rowData.TimesheetDate);
    const { istDateStr, istHour } = this.getISTNow();

    if (timesheetDateStr === istDateStr && istHour >= 23) {
      return false;
    }

    return true;
  };

  onEditingRow(event): void {
    event.cancel = true;

    const logData = JSON.parse(localStorage.getItem('logData') || '{}');
    if (logData.isWorking === false || logData.IsWorking === false) {
      notify({ message: 'You Must Be Working To Edit A TimeSheet', position: { at: 'top right', my: 'top right' }, displayTime: 3000 }, 'error');
      return;
    }

    const rowData = event.data;
    const timesheetDateStr = this.formatDate(rowData?.TimesheetDate);
    const { istDateStr, istHour } = this.getISTNow();

    if (timesheetDateStr === istDateStr && istHour >= 23) {
      notify({ message: "Today's Time is Over and you cannot update or add at that day.", position: { at: 'top right', my: 'top right' }, displayTime: 3000 }, 'error');
      return;
    }

    if (!this.isEditDeleteAllowed({ row: { data: event.data } })) {
      notify({ message: "Today's Time is Over and you cannot update or add at that day.", position: { at: 'top right', my: 'top right' }, displayTime: 3000 }, 'error');
      return;
    }
    
    this.selectedRowData = { ...event.data };
    this.isViewMode = false;
    this.isEditPopupOpened = true;
    this.cdr.detectChanges();
  }

  onViewClick = (e: any) => {
    const headerData = { ...e.row.data };
    
    this.service.get_TimesheetEntry_By_TimesheetId(headerData.id).subscribe({
      next: (res: any) => {
        if (res && res.flag === '1' && res.data) {
          this.selectedRowData = {
            EmployeeId: headerData.employeeID || headerData.EmployeeID,
            TimeSheetDate: headerData.timesheetDate || headerData.TimesheetDate,
            TimesheetId: headerData.id || headerData.ID,
            EmployeeName: headerData.employeeName || headerData.EmployeeName,
            Project_Id: res.data.ProjectID,
            Activity_Id: res.data.ActivityID,
            Remarks: res.data.Remarks,
            Mintes: res.data.Minutes
          };
        } else {
          this.selectedRowData = {
            EmployeeId: headerData.employeeID,
            TimeSheetDate: headerData.timesheetDate,
            TimesheetId: headerData.id,
            EmployeeName: headerData.employeeName || headerData.EmployeeName
          };
        }
        this.isViewMode = true;
        this.isEditPopupOpened = true;
        this.cdr.detectChanges();
      },
      error: () => {
        this.selectedRowData = {
            EmployeeId: headerData.employeeID,
            TimeSheetDate: headerData.timesheetDate,
            TimesheetId: headerData.id
        };
        this.isViewMode = true;
        this.isEditPopupOpened = true;
        this.cdr.detectChanges();
      }
    });
  };

  canShowDelete = (e: any): boolean => {
    return true;
  };

  show_new_Form() {
    const logData = JSON.parse(localStorage.getItem('logData') || '{}');
    if (logData.isWorking === false || logData.IsWorking === false) {
      notify({ message: 'You Must Be Working To Create A TimeSheet', position: { at: 'top right', my: 'top right' }, displayTime: 3000 }, 'error');
      return;
    }

    const { istDateStr, istHour } = this.getISTNow();
    const selDateStr = this.formatDate(this.selectedDate);

    if (selDateStr === istDateStr && istHour >= 23) {
      notify({ message: "Today's Time is Over and you cannot update or add at that day.", position: { at: 'top right', my: 'top right' }, displayTime: 3000 }, 'error');
      return;
    }

    if (!this.isAdmin) {
      const listToCheck = (this.allTimesheets && this.allTimesheets.length > 0)
        ? this.allTimesheets
        : (this.dataGrid && this.dataGrid.instance ? this.dataGrid.instance.getDataSource().items() : []);
      const selDateStr = this.formatDate(this.selectedDate);
      const hasExisting = listToCheck.some((x: any) => {
        const tsDate = x.timesheetDate || x.TimesheetDate;
        const empId = x.employeeID || x.EmployeeID || x.employeeId || x.EmployeeId;
        if (!tsDate) return false;
        const rowDateStr = this.formatDate(tsDate);
        const matchEmp = empId ? empId.toString() === this.logUserId?.toString() : true;
        return rowDateStr === selDateStr && matchEmp;
      });
      if (hasExisting) {
        notify({ message: 'You have already created a timesheet for this date. Please edit it instead.', position: { at: 'top right', my: 'top right' }, displayTime: 3000 }, 'error');
        return;
      }
    }
    this.isAddFormPopupOpened = true;
  }

 formatTime(utcTime: string): string {
  const date = new Date(`1970-01-01T${utcTime}Z`);

  return date.toLocaleTimeString('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}

  closeNewForm() {
    this.isAddFormPopupOpened = false;
  }

  onClickSaveNewData(data: any) {
    if (!data || !data.entries || data.entries.length === 0) {
      notify({ message: 'No entries to save.', position: { at: 'top right', my: 'top right' }, displayTime: 1500 }, 'error');
      if (this.newFormComponent) this.newFormComponent.isSaving = false;
      return;
    }

    const logData = JSON.parse(localStorage.getItem('logData') || '{}');
    const logUserId = logData.UserID || logData.userId || logData.id || logData.ID || logData.EmployeeID || logData.employeeID || logData.employeeId;
    
    const finalEmployeeId = data.EmployeeId ? data.EmployeeId : logUserId;
    
    let totalMinutesCount = 0;
    data.entries.forEach((entry: any) => {
       const h = entry.Hour ? parseInt(entry.Hour, 10) : 0;
       const m = entry.Minutes ? parseInt(entry.Minutes, 10) : 0;
       totalMinutesCount += (h * 60) + m;
    });

    const finalHours = Math.floor(totalMinutesCount / 60);
    const finalMins = totalMinutesCount % 60;
    const totalHoursFormatted = parseFloat(`${finalHours}.${finalMins < 10 ? '0' + finalMins : finalMins}`);

    const targetDate = data.TimeSheetDate || this.selectedDate;
    const selDateStr = this.formatDate(targetDate);
    const { istDateStr, istHour } = this.getISTNow();

    if (selDateStr === istDateStr && istHour >= 23) {
      notify({ message: "Today's Time is Over and you cannot update or add at that day.", position: { at: 'top right', my: 'top right' }, displayTime: 3000 }, 'error');
      if (this.newFormComponent) this.newFormComponent.isSaving = false;
      return;
    }

    const listToCheck = (this.allTimesheets && this.allTimesheets.length > 0)
      ? this.allTimesheets
      : (this.dataGrid && this.dataGrid.instance ? this.dataGrid.instance.getDataSource().items() : []);

    const hasExisting = listToCheck.some((x: any) => {
      const tsDate = x.timesheetDate || x.TimesheetDate;
      const empId = x.employeeID || x.EmployeeID || x.employeeId || x.EmployeeId;
      if (!tsDate || !empId) return false;
      const rowDateStr = this.formatDate(tsDate);
      return rowDateStr === selDateStr && empId.toString() === finalEmployeeId.toString();
    });
    if (hasExisting) {
      notify({ message: 'A timesheet already exists for this date. Please edit it instead.', position: { at: 'top right', my: 'top right' }, displayTime: 3000 }, 'error');
      if (this.newFormComponent) this.newFormComponent.isSaving = false;
      return;
    }

    const adjustedTsDate = selDateStr;

    const headerPayload = {
      EmployeeId: finalEmployeeId || 0,
      TimesheetDate: adjustedTsDate,
      Hours: totalHoursFormatted
    };

    this.service.insert_Timesheet_Data(headerPayload).subscribe({
      next: (res: any) => {
        if (res && res.flag === '1' && res.id) {
          
          let savedCount = 0;
          let hasError = false;

          data.entries.forEach((entry: any, index: number) => {
             const totalEntryMinutes = (entry.Hour ? parseFloat(entry.Hour) * 60 : 0) + (entry.Minutes ? parseFloat(entry.Minutes) : 0);

             const entryPayload = {
               TimesheetId: res.id,
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
                   notify({ message: 'Failed to save row ' + (index + 1) + ': ' + entryRes.message, position: { at: 'top right', my: 'top right' }, displayTime: 1500 }, 'error');
                 }

                 if (savedCount === data.entries.length) {
                    if (!hasError) {
                      notify({ message: 'All timesheet entries saved successfully!', position: { at: 'top right', my: 'top right' }, displayTime: 1500 }, 'success');
                      this.isAddFormPopupOpened = false;
                      if (targetDate) {
                        this.selectedDate = new Date(targetDate);
                      }
                      this.dataGrid.instance.refresh();
                    } else if (this.newFormComponent) {
                      this.newFormComponent.isSaving = false;
                    }
                 }
               },
               error: (err: any) => {
                 savedCount++;
                 hasError = true;
                 notify({ message: 'Error saving row ' + (index + 1) + ': ' + err.message, position: { at: 'top right', my: 'top right' }, displayTime: 1500 }, 'error');
                 if (savedCount === data.entries.length && this.newFormComponent) {
                   this.newFormComponent.isSaving = false;
                 }
               }
             });
          });

        } else {
          if (this.newFormComponent) this.newFormComponent.isSaving = false;
          notify({ message: 'Failed to save header: ' + res.message, position: { at: 'top right', my: 'top right' }, displayTime: 1500 }, 'error');
        }
      },
      error: (err: any) => {
        if (this.newFormComponent) this.newFormComponent.isSaving = false;
        notify({ message: 'Error saving header: ' + err.message, position: { at: 'top right', my: 'top right' }, displayTime: 1500 }, 'error');
      }
    });
  }

  onRowRemoving(event: any) {
    event.cancel = true; 
    
    if (!this.isEditDeleteAllowed({ row: { data: event.data } })) {
      notify({ message: 'Deleting is only allowed on the day of creation until 11 PM.', position: { at: 'top right', my: 'top right' }, displayTime: 3000 }, 'error');
      this.dataGrid.instance.refresh();
      return;
    }
    const selectedRowId = event.data.ID || event.data.id || event.data.TimesheetId; // Use data to get the ID

    if (!selectedRowId) {
      notify({ message: 'Error: Cannot find Timesheet ID for deletion', position: { at: 'top right', my: 'top right' }, displayTime: 1500 }, 'error');
      this.dataGrid.instance.refresh();
      return;
    }

    try {
      this.service.delete_Timesheet_Data(selectedRowId).subscribe({
        next: (res: any) => {
          if (res && res.flag === '1') {
            notify({ message: 'Delete operation successful', position: { at: 'top right', my: 'top right' }, displayTime: 500 }, 'success');
            this.dataGrid.instance.refresh();
          } else {
            notify({ message: res.message || 'Delete operation failed', position: { at: 'top right', my: 'top right' }, displayTime: 1500 }, 'error');
            this.dataGrid.instance.refresh(); // refresh to bring it back since it failed
          }
        },
        error: (err: any) => {
          notify({ message: 'Server error on delete', position: { at: 'top right', my: 'top right' }, displayTime: 1500 }, 'error');
          this.dataGrid.instance.refresh();
        }
      });
    } catch (error) {
      notify({ message: 'Delete operation failed', position: { at: 'top right', my: 'top right' }, displayTime: 500 }, 'error');
    }
  }
  refresh = () => {
    this.dataGrid.instance.refresh();
  };
  onExporting(event: any) {
    const fileName = 'user';
    this.reportService.exportDataGrid(event, fileName);
  }

  CloseEditForm() {
    this.isEditPopupOpened = false;
    this.dataGrid.instance.refresh();
  }
}
@NgModule({
  imports: [
    CommonModule,
    DxDataGridModule,
    DxButtonModule,
    DxDataGridModule,
    DxDropDownButtonModule,
    DxSelectBoxModule,
    DxTextBoxModule,
    DxLookupModule,
    FormPopupModule,
    TimeSheetNewFormModule,
    DxPopupModule,
    TimeSheetEditFormModule,
    DxDateBoxModule,
  ],
  providers: [],
  exports: [],
  declarations: [TimeSheetComponent],
})
export class TimeSheetModule { }
