import { CommonModule } from '@angular/common';
import { Component, NgModule } from '@angular/core';
import {
  DxCheckBoxModule,
  DxDateBoxModule,
  DxNumberBoxModule,
  DxSelectBoxModule,
  DxTextAreaModule,
  DxTextBoxModule,
  DxValidatorModule,
} from 'devextreme-angular';

import { MasterReportService } from '../../MASTER PAGES/master-report.service';

@Component({
  selector: 'app-project-new-form',
  templateUrl: './project-new-form.component.html',
  styleUrls: ['./project-new-form.component.scss'],
})
export class ProjectNewFormComponent {
  isAdmin: boolean = false;
  currentUserId: number | null = null;
  employeeDataSource: any[] = [];
  statusList = [{ id: 0, text: 'Active' }, { id: 1, text: 'Inactive' }];

  constructor(private service: MasterReportService) {
    const logData = JSON.parse(localStorage.getItem('logData') || '{}');
    this.isAdmin = logData.UserRoleName === 'Administrator';
    this.currentUserId = logData.UserID ? parseInt(logData.UserID, 10) : null;

    if (this.isAdmin) {
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
  }
  private defaultProjectData = {
    ProjectCode: '',
    ProjectName: '',
    IsInactive: 0,
    EmployeeId: null,
  };

  newProjectData: any = { ...this.defaultProjectData };

  getNewProjectData = () => {
    const data = { ...this.newProjectData };
    data.IsInactive = data.IsInactive ? 1 : 0;
    if (!this.isAdmin && this.currentUserId) {
      data.EmployeeId = this.currentUserId;
    }
    return data;
  };

  clearData() {
    this.newProjectData = { ...this.defaultProjectData };
  }
}

@NgModule({
  imports: [
    CommonModule,
    DxCheckBoxModule,
    DxDateBoxModule,
    DxNumberBoxModule,
    DxSelectBoxModule,
    DxTextAreaModule,
    DxTextBoxModule,
    DxValidatorModule,
  ],
  declarations: [ProjectNewFormComponent],
  exports: [ProjectNewFormComponent],
})
export class ProjectNewFormModule { }
