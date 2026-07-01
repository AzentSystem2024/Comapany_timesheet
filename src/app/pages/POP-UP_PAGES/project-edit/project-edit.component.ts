import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, NgModule, OnChanges, Output, SimpleChanges, ViewChild } from '@angular/core';
import {
  DxCheckBoxModule,
  DxTextBoxModule,
  DxValidatorModule,
  DxButtonModule,
  DxValidationGroupModule,
  DxValidationGroupComponent,
  DxNumberBoxModule,
  DxSelectBoxModule
} from 'devextreme-angular';
import notify from 'devextreme/ui/notify';

import { MasterReportService } from '../../MASTER PAGES/master-report.service';

@Component({
  selector: 'app-project-edit',
  templateUrl: './project-edit.component.html',
  styleUrls: ['./project-edit.component.scss'],
})
export class ProjectEditComponent implements OnChanges {
  @ViewChild('validationGroup', { static: true }) validationGroup!: DxValidationGroupComponent;
  @Input() formdata: any;
  @Output() closeForm = new EventEmitter();

  newProjectData: any = {};
  employeeDataSource: any[] = [];
  statusList = [{ id: 0, text: 'Active' }, { id: 1, text: 'Inactive' }];

  constructor(private service: MasterReportService) {
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

  ngOnChanges(changes: SimpleChanges) {
    if (changes['formdata'] && changes['formdata'].currentValue) {
      this.newProjectData = { ...this.formdata };
      this.newProjectData.IsInactive = (this.formdata.IsInactive === 1 || this.formdata.IsInactive === true) ? 1 : 0;
    }
  }

  onSaveClick() {
    const validationResult = this.validationGroup.instance.validate();
    if (!validationResult.isValid) return;

    const dataToSave = { ...this.newProjectData };
    dataToSave.IsInactive = dataToSave.IsInactive ? 1 : 0;

    this.service.update_Project_data(dataToSave).subscribe({
      next: (res: any) => {
        if (res.flag == "1") {
          notify(
            { message: 'data updated successfully', position: { at: 'top right', my: 'top right' }, displayTime: 500 },
            'success'
          );
          this.close();
        } else {
          notify(
            { message: res.message || 'Failed to update', position: { at: 'top right', my: 'top right' }, displayTime: 500 },
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

  close() {
    this.closeForm.emit();
  }
}

@NgModule({
  imports: [
    CommonModule,
    DxCheckBoxModule,
    DxTextBoxModule,
    DxValidatorModule,
    DxButtonModule,
    DxValidationGroupModule,
    DxNumberBoxModule,
    DxSelectBoxModule
  ],
  declarations: [ProjectEditComponent],
  exports: [ProjectEditComponent],
})
export class ProjectEditModule { }
