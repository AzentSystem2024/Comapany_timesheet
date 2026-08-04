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

  datasource = new DataSource<any>({
    load: () =>
      new Promise((resolve, reject) => {
        const logData = JSON.parse(localStorage.getItem('logData') || '{}');
        const logUserId = logData.UserID || logData.userId || logData.id || logData.ID || logData.EmployeeID || logData.employeeID || logData.employeeId;
        const logUserRole = logData.UserRoleName || logData.userRoleName || '';
        this.isAdmin = (logUserRole === 'Administrator');
        this.logUserId = logUserId;
        
        let reqDate: string | undefined = undefined;
        let reqEmployeeId: number | undefined = logUserId;
        let reqIsAdmin: boolean = this.isAdmin;
        
        if (this.selectedDate) {
           const selDate = new Date(this.selectedDate);
           reqDate = new Date(selDate.getTime() - (selDate.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
        }

        this.service.get_Timesheet_List(reqDate, reqEmployeeId, reqIsAdmin).subscribe({
          next: (res: any) => {
            let data = res && res.data ? res.data : res;
            this.allTimesheets = data;


            resolve(data);
          },
          error: (err) => reject(err),
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
    const selDate = new Date(this.selectedDate);
    const selectedDateStr = new Date(selDate.getTime() - (selDate.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
    const todayStr = new Date(this.todayDate.getTime() - (this.todayDate.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
    return selectedDateStr >= todayStr;
  }

  isPreviousDateDisabled(): boolean {
    if (!this.minDate) return false;
    const selDate = new Date(this.selectedDate);
    const selectedDateStr = new Date(selDate.getTime() - (selDate.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
    const minStr = new Date(this.minDate.getTime() - (this.minDate.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
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
    if (logUserRole === 'Administrator') {
      return true;
    }

    const rowData = e.row.data;
    if (!rowData || !rowData.TimesheetDate) return false;
    
    const timesheetDate = new Date(rowData.TimesheetDate);
    const today = new Date();
    
    const isSameDate = timesheetDate.getFullYear() === today.getFullYear() &&
                       timesheetDate.getMonth() === today.getMonth() &&
                       timesheetDate.getDate() === today.getDate();
                       
    const isBefore11PM = today.getHours() < 23;
    
    return isSameDate && isBefore11PM;
  };

  onEditingRow(event): void {
    event.cancel = true;

    const logData = JSON.parse(localStorage.getItem('logData') || '{}');
    if (logData.isWorking === false || logData.IsWorking === false) {
      notify({ message: 'You Must Be Working To Edit A TimeSheet', position: { at: 'top right', my: 'top right' }, displayTime: 3000 }, 'error');
      return;
    }

    if (!this.isEditDeleteAllowed({ row: { data: event.data } })) {
      notify({ message: 'Editing is only allowed on the day of creation until 11 PM.', position: { at: 'top right', my: 'top right' }, displayTime: 3000 }, 'error');
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

    if (!this.isAdmin && this.dataGrid && this.dataGrid.instance) {
      const allData = this.dataGrid.instance.getDataSource().items();
      const selDateStr = new Date(this.selectedDate.getTime() - (this.selectedDate.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
      const hasExisting = allData.some((x: any) => {
        const tsDate = x.timesheetDate || x.TimesheetDate;
        if (!tsDate) return false;
        const rowDateStr = new Date(tsDate).toISOString().split('T')[0];
        return rowDateStr === selDateStr;
      });
      if (hasExisting) {
        notify({ message: 'You have already created a timesheet for this date. Please edit it instead.', position: { at: 'top right', my: 'top right' }, displayTime: 3000 }, 'error');
        return;
      }
    }
    this.isAddFormPopupOpened = true;
  }

  formatTime(timeString: any): string {
    if (!timeString) return '';
    try {
      if (typeof timeString !== 'string') {
        if (timeString.Hours !== undefined && timeString.Minutes !== undefined) {
          timeString = `${timeString.Hours}:${timeString.Minutes}:00`;
        } else if (timeString.hours !== undefined && timeString.minutes !== undefined) {
          timeString = `${timeString.hours}:${timeString.minutes}:00`;
        } else {
          timeString = String(timeString);
        }
      }
      const parts = timeString.split(':');
      if (parts.length >= 2) {
        let hours = parseInt(parts[0], 10);
        let minInt = parseInt(parts[1], 10);
        
        // Add 5 hours and 30 minutes for IST
        minInt += 30;
        hours += 5;
        if (minInt >= 60) {
            hours += 1;
            minInt -= 60;
        }
        hours = hours % 24;

        const minutesStr = minInt.toString().padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12; 
        return `${hours}:${minutesStr} ${ampm}`;
      }
      return timeString;
    } catch(e) {
      return String(timeString);
    }
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

    if (this.dataGrid && this.dataGrid.instance) {
      const allData = this.dataGrid.instance.getDataSource().items();
      const selDateStr = new Date(data.TimeSheetDate.getTime() - (data.TimeSheetDate.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
      const hasExisting = allData.some((x: any) => {
        const tsDate = x.timesheetDate || x.TimesheetDate;
        const empId = x.employeeID || x.EmployeeID || x.employeeId || x.EmployeeId;
        if (!tsDate || !empId) return false;
        const rowDateStr = new Date(tsDate).toISOString().split('T')[0];
        return rowDateStr === selDateStr && empId.toString() === finalEmployeeId.toString();
      });
      if (hasExisting) {
        notify({ message: 'A timesheet already exists for this date. Please edit it instead.', position: { at: 'top right', my: 'top right' }, displayTime: 3000 }, 'error');
        if (this.newFormComponent) this.newFormComponent.isSaving = false;
        return;
      }
    }

    let adjustedTsDate = data.TimeSheetDate;
    if (adjustedTsDate instanceof Date) {
       adjustedTsDate = new Date(adjustedTsDate.getTime() - (adjustedTsDate.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
    } else if (typeof adjustedTsDate === 'string' && adjustedTsDate.includes('T')) {
       adjustedTsDate = adjustedTsDate.split('T')[0];
    }

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
