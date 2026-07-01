import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, NgModule, ViewChild } from '@angular/core';
import {
  DxButtonModule,
  DxDataGridComponent,
  DxDataGridModule,
  DxDropDownButtonModule,
  DxLookupModule,
  DxPopupModule,
  DxSelectBoxModule,
  DxTextBoxModule,
} from 'devextreme-angular';
import DataSource from 'devextreme/data/data_source';
import notify from 'devextreme/ui/notify';
import { ActivatedRoute, Router } from '@angular/router';
import { FormPopupModule } from 'src/app/components';
import { DataService } from 'src/app/services';
import { ReportService } from 'src/app/services/Report-data.service';
import { MasterReportService } from '../master-report.service';
import {
  DesignationNewFormComponent,
  DesignationNewFormModule,
} from '../../POP-UP_PAGES/designation-new-form/designation-new-form.component';
import {
  DesignationEditComponent,
  DesignationEditModule,
} from '../../POP-UP_PAGES/designation-edit/designation-edit.component';

@Component({
  selector: 'app-designation',
  templateUrl: './designation.component.html',
  styleUrls: ['./designation.component.scss'],
  providers: [MasterReportService, ReportService, DataService],
})
export class DesignationComponent {
  @ViewChild(DxDataGridComponent, { static: true })
  dataGrid!: DxDataGridComponent;

  @ViewChild(DesignationNewFormComponent, { static: false })
  designationNewForm!: DesignationNewFormComponent;

  popupwidth: any = '40%';
  isAddFormPopupOpened: boolean = false;
  isEditPopupOpened: boolean = false;
  selectedRowData: any;
  readonly allowedPageSizes: any = [5, 10, 'all'];
  displayMode: any = 'full';
  showPageSizeSelector = true;
  showInfo = true;
  showNavButtons = true;
  addButtonOptions: any;
  isFilterRowVisible: boolean = false;
  currentPathName: string;
  initialized: boolean;
  isAdmin: boolean = false;
  menuPrevilage: { CanAdd: boolean; CanEdit: boolean; CanDelete: boolean };

  datasource = new DataSource<any>({
    load: () =>
      new Promise((resolve, reject) => {
        const logData = JSON.parse(localStorage.getItem('logData') || '{}');
        this.service.get_Designation_List().subscribe({
          next: (res: any) => resolve(res.data || res),
          error: (err: any) => reject(err),
        });
      }),
  });

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
      this.menuPrevilage = this.dataService.getMenuPrevilages(fullUrl) || { CanAdd: false, CanEdit: false, CanDelete: false };
      const logData = JSON.parse(localStorage.getItem('logData') || '{}');
      this.isAdmin = logData.UserRoleName === 'Administrator';
    });
    this.addButtonOptions = {
      text: 'New',
      icon: 'bi bi-plus-circle',
      type: 'default',
      stylingMode: 'contained',
      hint: 'Add new entry',
      disabled: false,
      visible: true,
      onClick: () => this.show_new_Form(),
      elementAttr: { class: 'add-button' },
    };
  }

  toggleFilterRow = () => {
    this.isFilterRowVisible = !this.isFilterRowVisible;
  };

  getDesignationRowId(rowData: any) {
    return rowData?.DesignationID ?? rowData?.ID ?? rowData?.UserID ?? rowData?.Id ?? rowData?.id;
  }

  onEditingRow(event: any): void {
    event.cancel = true;
    const Id = this.getDesignationRowId(event.data);
    this.isEditPopupOpened = true;
    this.selectedRowData = event.data;
    this.cdr.detectChanges();
  }

  canShowDelete = (e: any): boolean => {
    return true;
  };

  show_new_Form() {
    this.isAddFormPopupOpened = true;
  }

  onClickSaveNewData() {
    const data = this.designationNewForm.getNewDesignationData();
    console.log(data, 'PAYLOAD IN SAVE');
    
    this.service.insert_Designation_Data(data).subscribe({
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
    this.designationNewForm.clearData();
  }

  onRowRemoving(event: any) {
    event.cancel = true;
    let SelectedRow = event.data || event.key;
    const Id = this.getDesignationRowId(SelectedRow);
    
    this.service.Remove_Designation_Row_Data(Id).subscribe({
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
    const fileName = 'designation';
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
    DxDropDownButtonModule,
    DxSelectBoxModule,
    DxTextBoxModule,
    DxLookupModule,
    FormPopupModule,
    DesignationNewFormModule,
    DxPopupModule,
    DesignationEditModule,
  ],
  declarations: [DesignationComponent],
})
export class DesignationModule {}