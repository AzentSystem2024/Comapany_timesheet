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
  ProjectNewFormComponent,
  ProjectNewFormModule,
} from '../../POP-UP_PAGES/project-new-form/project-new-form.component';
import {
  ProjectEditComponent,
  ProjectEditModule,
} from '../../POP-UP_PAGES/project-edit/project-edit.component';

@Component({
  selector: 'app-projects',
  templateUrl: './projects.component.html',
  styleUrls: ['./projects.component.scss'],
  providers: [MasterReportService, ReportService, DataService],
})
export class ProjectsComponent {
  @ViewChild(DxDataGridComponent, { static: true })
  dataGrid!: DxDataGridComponent;

  @ViewChild(ProjectNewFormComponent, { static: false })
  projectNewForm!: ProjectNewFormComponent;

  popupwidth: any = '35%';
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
  menuPrevilage: { CanAdd: boolean; CanEdit: boolean; CanDelete: boolean } = { CanAdd: false, CanEdit: false, CanDelete: false };
  employeeDataSource: any[] = [];

  datasource = new DataSource<any>({
    load: () =>
      new Promise((resolve, reject) => {
        this.service.get_Project_List().subscribe({
          next: (res: any) => {
            const logData = JSON.parse(localStorage.getItem('logData') || '{}');
            let data = res;
            resolve(data);
          },
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
    });

    this.service.get_Employee_List().subscribe({
      next: (res: any) => {
        if (res && res.data) {
          this.employeeDataSource = res.data;
        } else if (Array.isArray(res)) {
          this.employeeDataSource = res;
        }
      }
    });
  }

  toggleFilterRow = () => {
    this.isFilterRowVisible = !this.isFilterRowVisible;
  };

  getProjectRowId(rowData: any) {
    return rowData?.ProjectID ?? rowData?.ID ?? rowData?.UserID ?? rowData?.Id ?? rowData?.id;
  }

  onEditingRow(event: any): void {
    event.cancel = true;
    const Id = this.getProjectRowId(event.data);
    this.isEditPopupOpened = true;
    const rowIndex = event.component.getRowIndexByKey(event.key);
    this.selectedRowData = { ...event.data, SNo: rowIndex + 1 };
    this.cdr.detectChanges();
  }

  canShowDelete = (e: any): boolean => {
    return true;
  };

  isInactiveValue = (rowData: any): boolean => {
    return rowData.IsInactive === 1 || rowData.IsInactive === true;
  };

  show_new_Form() {
    this.isAddFormPopupOpened = true;
    this.cdr.detectChanges();
  }

  onClickSaveNewData() {
    const data = this.projectNewForm.getNewProjectData();
    console.log(data, 'PAYLOAD IN SAVE');

    this.service.insert_Project_Data(data).subscribe({
      next: (res: any) => {
        if (res.flag == "1") {
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
    this.projectNewForm.clearData();
  }

  onRowRemoving(event: any) {
    event.cancel = true;
    let SelectedRow = event.data || event.key;
    const Id = this.getProjectRowId(SelectedRow);

    this.service.Remove_Project_Row_Data(Id).subscribe({
      next: (res: any) => {
        if (res.flag == "1") {
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
    const fileName = 'projects';
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
    ProjectNewFormModule,
    DxPopupModule,
    ProjectEditModule,
  ],
  declarations: [ProjectsComponent],
})
export class ProjectsModule { }
