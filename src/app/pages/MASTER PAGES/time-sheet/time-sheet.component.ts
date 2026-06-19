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
  @ViewChild(DxDataGridComponent, { static: true })
  dataGrid!: DxDataGridComponent;

  @ViewChild(TimeSheetNewFormComponent, { static: false })
  TimeSheetNewForm!: TimeSheetNewFormComponent;

  popupwidth: any = '65%';

  isAddFormPopupOpened: boolean = false;
  isEditPopupOpened: boolean = false;
  selectedRowData: any;
  readonly allowedPageSizes: any = [5, 10, 'all'];
  displayMode: any = 'full';
  showPageSizeSelector = true;
  showInfo = true;
  showNavButtons = true;

  getLocalData() {
    const data = localStorage.getItem('timeSheetData');
    return data ? JSON.parse(data) : [];
  }

  saveLocalData(data: any[]) {
    localStorage.setItem('timeSheetData', JSON.stringify(data));
  }

  datasource = new DataSource<any>({
    load: () =>
      new Promise((resolve) => {
        resolve(this.getLocalData());
      }),
  });
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
      disabled: !this.menuPrevilage.CanAdd,
      onClick: () => this.show_new_Form(),
      elementAttr: { class: 'add-button' },
    };
  }

  toggleFilterRow = () => {
    this.isFilterRowVisible = !this.isFilterRowVisible;
  };

  onEditingRow(event): void {
    event.cancel = true;
    this.selectedRowData = { ...event.data };
    this.isEditPopupOpened = true;
    this.cdr.detectChanges(); // Ensure Angular picks up the change
  }

  canShowDelete = (e: any): boolean => {
    return false;
  };

  show_new_Form() {
    this.isAddFormPopupOpened = true;
  }

  onClickSaveNewData() {
    const data = this.TimeSheetNewForm.getNewUserData();
    const currentData = this.getLocalData();
    currentData.push(data);
    this.saveLocalData(currentData);

    notify(
      {
        message: 'data saved successfully',
        position: { at: 'top right', my: 'top right' },
        displayTime: 500,
      },
      'success'
    );
    this.dataGrid.instance.refresh();
    this.isAddFormPopupOpened = false;
  }

  onClearData() {
    this.TimeSheetNewForm.removeImage();
    this.TimeSheetNewForm.clearData();
  }

  onRowRemoving(event: any) {
    event.cancel = true; // Prevent default so we can handle it manually
    const selectedRowId = event.data.TimesheetId; // Use data to get the ID

    try {
      const currentData = this.getLocalData();
      const updatedData = currentData.filter((item: any) => item.TimesheetId !== selectedRowId);
      this.saveLocalData(updatedData);

      notify(
        {
          message: 'Delete operation successful',
          position: { at: 'top right', my: 'top right' },
          displayTime: 500,
        },
        'success'
      );
      this.dataGrid.instance.refresh();
    } catch (error) {
      notify(
        {
          message: 'Delete operation failed',
          position: { at: 'top right', my: 'top right' },
          displayTime: 500,
        },
        'error'
      );
    }
  }
  //=================== Page refreshing==========================
  refresh = () => {
    this.dataGrid.instance.refresh();
  };
  //========================Export data ==========================
  onExporting(event: any) {
    const fileName = 'user';
    this.reportService.exportDataGrid(event, fileName);
  }

  CloseEditForm() {
    this.isEditPopupOpened = false;
    // this.getUSerData();
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
  ],
  providers: [],
  exports: [],
  declarations: [TimeSheetComponent],
})
export class TimeSheetModule { }
