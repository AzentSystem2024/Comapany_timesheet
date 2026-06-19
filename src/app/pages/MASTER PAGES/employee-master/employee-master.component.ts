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
        const storedData = JSON.parse(localStorage.getItem('EmployeeMasterData') || '[]');
        resolve(storedData);
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

  getEmployeeRowId(rowData: any) {
    return rowData?.EmployeeID ?? rowData?.ID ?? rowData?.UserID;
  }

  onEditingRow(event): void {
    event.cancel = true;
    const Id = this.getEmployeeRowId(event.data);
    this.isEditPopupOpened = true;
    const storedData = JSON.parse(localStorage.getItem('EmployeeMasterData') || '[]');
    this.selectedRowData = storedData.find((item: any) => this.getEmployeeRowId(item) === Id) || event.data;
    this.cdr.detectChanges(); // Ensure Angular picks up the change
  }

  canShowDelete = (e: any): boolean => {
    return this.menuPrevilage.CanDelete;
  };
  
  show_new_Form() {
    this.isAddFormPopupOpened = true;
  }

  onClickSaveNewData() {
    const data = this.newEmployeeForm.getNewEmployeeData();
    console.log(data, 'PAYLOAD IN SAVE');
    
    let storedData = JSON.parse(localStorage.getItem('EmployeeMasterData') || '[]');
    data.EmployeeID = new Date().getTime(); // give an ID
    storedData.push(data);
    localStorage.setItem('EmployeeMasterData', JSON.stringify(storedData));

    notify(
      {
        message: 'data saved successfully',
        position: { at: 'top right', my: 'top right' },
        displayTime: 500,
      },
      'success'
    );
    this.dataGrid.instance.refresh();
  }

  onClearData() {
    this.newEmployeeForm.clearData();
  }

  onRowRemoving(event: any) {
    event.cancel = true;
    let SelectedRow = event.key;
    const Id = this.getEmployeeRowId(SelectedRow);
    
    let storedData = JSON.parse(localStorage.getItem('EmployeeMasterData') || '[]');
    storedData = storedData.filter((item: any) => this.getEmployeeRowId(item) !== Id);
    localStorage.setItem('EmployeeMasterData', JSON.stringify(storedData));

    notify(
      {
        message: 'Delete operation successful',
        position: { at: 'top right', my: 'top right' },
        displayTime: 500,
      },
      'success'
    );
    this.dataGrid.instance.refresh();
  }
  //=================== Page refreshing==========================
  refresh = () => {
    this.dataGrid.instance.refresh();
  };
  //========================Export data ==========================
  onExporting(event: any) {
    const fileName = 'employee-master';
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
    NewEmployeemasterModule,
    DxPopupModule,
    EmployeemasterEditModule,
  ],
  providers: [],
  exports: [],
  declarations: [EmployeeMasterComponent],
})
export class EmployeeMasterModule {}