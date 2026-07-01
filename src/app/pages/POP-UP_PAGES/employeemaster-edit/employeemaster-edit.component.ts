import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, NgModule, OnChanges, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import {
  DxCheckBoxModule,
  DxDateBoxModule,
  DxNumberBoxModule,
  DxSelectBoxModule,
  DxTextAreaModule,
  DxTextBoxModule,
  DxValidatorModule,
  DxButtonModule,
  DxValidationGroupModule,
  DxValidationGroupComponent
} from 'devextreme-angular';
import notify from 'devextreme/ui/notify';
import { MasterReportService } from '../../MASTER PAGES/master-report.service';

@Component({
  selector: 'app-employeemaster-edit',
  templateUrl: './employeemaster-edit.component.html',
  styleUrls: ['./employeemaster-edit.component.scss'],
})
export class EmployeemasterEditComponent implements OnChanges, OnInit {
  @ViewChild('validationGroup', { static: true }) validationGroup!: DxValidationGroupComponent;
  @Input() formdata: any;
  @Output() closeForm = new EventEmitter();

  newEmployeeData: any = {};
  sexOptions = ['Male', 'Female', 'Others'];

  emailPattern: any = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.com$/;
  maxDateOfBirth: Date;
  designationOptions: any[] = [];
  passwordMode: 'password' | 'text' = 'password';
  passwordButtonOptions: any = {
    icon: 'eyeopen',
    stylingMode: 'text',
    onClick: () => {
      this.passwordMode = this.passwordMode === 'text' ? 'password' : 'text';
      this.passwordButtonOptions.icon = this.passwordMode === 'text' ? 'eyeclose' : 'eyeopen';
    }
  };

  constructor(private service: MasterReportService) {
    const today = new Date();
    this.maxDateOfBirth = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
  }

  ngOnInit(): void {
    this.service.get_Designation_List().subscribe({
      next: (res: any) => {
        if (res.flag === "1" && res.data) {
          this.designationOptions = res.data;
        }
      },
      error: (err: any) => console.error("Failed to load designations", err)
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['formdata'] && changes['formdata'].currentValue) {
      this.newEmployeeData = { ...this.formdata };
      

      if (this.newEmployeeData.DateOfJoin) {
        this.newEmployeeData.DateOfJoin = new Date(this.newEmployeeData.DateOfJoin);
      }
      if (this.newEmployeeData.DateofRelieving) {
        this.newEmployeeData.DateofRelieving = new Date(this.newEmployeeData.DateofRelieving);
      }
    }
  }

  onEmployeeNameInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    const sanitizedValue = target.value
      .replace(/[^a-zA-Z\s]/g, '')
      .replace(/\s{2,}/g, ' ')
      .replace(/^\s+/g, '');

    target.value = sanitizedValue;
    this.newEmployeeData.EmployeeName = sanitizedValue;
  }

  onPhoneInput(event: Event, fieldName: string): void {
    const target = event.target as HTMLInputElement;
    const sanitizedValue = target.value.replace(/\D/g, '');
    target.value = sanitizedValue;
    this.newEmployeeData[fieldName] = sanitizedValue;
  }

  onSaveClick() {
    const validationResult = this.validationGroup.instance.validate();
    if (!validationResult.isValid) return;

    this.service.update_Employee_Data(this.newEmployeeData).subscribe({
      next: (res: any) => {
        if(res.flag == "1") {
          notify(
            { message: 'data updated successfully', position: { at: 'top right', my: 'top right' }, displayTime: 500 },
            'success'
          );
          this.close();
        } else {
          notify(
            { message: res.message || 'Failed to update data', position: { at: 'top right', my: 'top right' }, displayTime: 500 },
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
    DxDateBoxModule,
    DxNumberBoxModule,
    DxSelectBoxModule,
    DxTextAreaModule,
    DxTextBoxModule,
    DxValidatorModule,
    DxButtonModule,
    DxValidationGroupModule
  ],
  declarations: [EmployeemasterEditComponent],
  exports: [EmployeemasterEditComponent],
})
export class EmployeemasterEditModule {}
