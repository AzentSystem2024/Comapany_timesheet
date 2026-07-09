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
import { confirm } from 'devextreme/ui/dialog';
import { ReportService } from 'src/app/services/Report-data.service';
import { MasterReportService } from '../master-report.service';
import {
  NewEmployeemasterComponent,
  NewEmployeemasterModule,
} from '../../POP-UP_PAGES/new-employeemaster/new-employeemaster.component';
import {
  EmployeemasterEditComponent,
  EmployeemasterEditModule,
} from '../../POP-UP_PAGES/employeemaster-edit/employeemaster-edit.component';
import DataSource from 'devextreme/data/data_source';
import { ActivatedRoute, Router } from '@angular/router';
import { DataService } from 'src/app/services';

@Component({
  selector: 'app-employee-master',
  templateUrl: './employee-master.component.html',
  styleUrls: ['./employee-master.component.scss'],
  providers: [MasterReportService, ReportService, DataService],
})
export class EmployeeMasterComponent {
  @ViewChild(DxDataGridComponent, { static: true })
  dataGrid!: DxDataGridComponent;

  @ViewChild(NewEmployeemasterComponent, { static: false })
  newEmployeeForm!: NewEmployeemasterComponent;

  popupwidth: any = '65%';

  isAddFormPopupOpened: boolean = false;
  isEditPopupOpened: boolean = false;
  selectedRowData: any;

  readonly allowedPageSizes: any = [5, 10, 'all'];
  displayMode: any = 'full';
  showPageSizeSelector = true;
  showInfo = true;
  showNavButtons = true;

  datasource = new DataSource<any>({
    load: () =>
      new Promise((resolve, reject) => {
        this.service.get_Employee_List().subscribe({
          next: (res: any) => resolve(res.data || res),
          error: (err: any) => reject(err),
        });
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
      disabled: false,
      onClick: () => this.show_new_Form(),
      elementAttr: { class: 'add-button' },
    };
  }

  toggleFilterRow = () => {
    this.isFilterRowVisible = !this.isFilterRowVisible;
  };

  getEmployeeRowId(rowData: any) {
    return rowData?.EmployeeID ?? rowData?.ID ?? rowData?.UserID;
  }

  onEditingRow(event: any): void {
    event.cancel = true;
    const Id = this.getEmployeeRowId(event.data);
    this.isEditPopupOpened = true;
    const rowIndex = event.component.getRowIndexByKey(event.key);
    this.selectedRowData = { ...event.data, SNo: rowIndex + 1 };
    this.cdr.detectChanges(); 
  }

  canShowDelete = (e: any): boolean => {
    return true;
  };
  
  show_new_Form() {
    this.isAddFormPopupOpened = true;
  }

  onClickSaveNewData() {
    const data = this.newEmployeeForm.getNewEmployeeData();
    console.log(data, 'PAYLOAD IN SAVE');
    
    this.service.insert_Employee_Data(data).subscribe({
      next: (res: any) => {
        if(res.flag == "1") {
          notify(
            { message: 'data saved successfully', position: { at: 'top right', my: 'top right' }, displayTime: 500 },
            'success'
          );
          this.isAddFormPopupOpened = false;
          this.dataGrid.instance.refresh();
        } else {
          notify(
            { message: res.message || 'Failed to save data', position: { at: 'top right', my: 'top right' }, displayTime: 500 },
            'error'
          );
        }
      },
      error: (err: any) => {
        notify(
          { message: 'Server error', position: { at: 'top right', my: 'top right' }, displayTime: 500 },
          'error'
        );
      }
    });
  }

  onClearData() {
    this.newEmployeeForm.clearData();
  }

  onRowRemoving(event: any) {
    event.cancel = true;
    let SelectedRow = event.key;
    const Id = this.getEmployeeRowId(SelectedRow);
    
    this.service.Remove_Employee_Row_Data(Id).subscribe({
      next: (res: any) => {
        if(res.flag == "1") {
          notify(
            { message: 'Delete operation successful', position: { at: 'top right', my: 'top right' }, displayTime: 500 },
            'success'
          );
          this.dataGrid.instance.refresh();
        } else {
          notify(
            { message: res.message || 'Failed to delete', position: { at: 'top right', my: 'top right' }, displayTime: 500 },
            'error'
          );
        }
      },
      error: (err: any) => {
        notify(
          { message: 'Server error', position: { at: 'top right', my: 'top right' }, displayTime: 500 },
          'error'
        );
      }
    });
  }
  refresh = () => {
    this.dataGrid.instance.refresh();
  };
  onExporting(event: any) {
    const fileName = 'employee-master';
    this.reportService.exportDataGrid(event, fileName);
  }

  CloseEditForm() {
    this.isEditPopupOpened = false;
    this.dataGrid.instance.refresh();
  }

  reset2FAClick = (e: any) => {
    const rowData = e.row.data;
    let result = confirm(`Are you sure you want to reset 2FA for ${rowData.EmployeeName}?`, "Confirm Reset");
    result.then((dialogResult) => {
      if (dialogResult) {
        this.service.reset2FA(rowData.ID).subscribe({
          next: (res: any) => {
            if (res.flag == "1") {
              notify(
                { message: '2FA reset successfully', position: { at: 'top right', my: 'top right' }, displayTime: 2000 },
                'success'
              );
              this.refresh();
            } else {
              notify(
                { message: res.message || 'Failed to reset 2FA', position: { at: 'top right', my: 'top right' }, displayTime: 2000 },
                'error'
              );
            }
          },
          error: (err: any) => {
            notify(
              { message: 'Server error while resetting 2FA', position: { at: 'top right', my: 'top right' }, displayTime: 2000 },
              'error'
            );
          }
        });
      }
    });
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
    NewEmployeemasterModule,
    DxPopupModule,
    EmployeemasterEditModule,
  ],
  providers: [],
  exports: [],
  declarations: [EmployeeMasterComponent],
})
export class EmployeeMasterModule {}