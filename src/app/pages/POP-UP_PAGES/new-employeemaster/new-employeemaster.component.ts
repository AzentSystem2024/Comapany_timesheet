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

@Component({
  selector: 'app-new-employeemaster',
  templateUrl: './new-employeemaster.component.html',
  styleUrl: './new-employeemaster.component.scss',
})
export class NewEmployeemasterComponent {
  maxDateOfBirth: Date;

  constructor() {
    const today = new Date();
    this.maxDateOfBirth = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
  }

  private defaultEmployeeData = {
    Employee_Number: '',
    Enrollment_No: '',
    EmployeeName: '',
    DateOfBirth: null,
    Address1: '',
    Mobile: '',
    WhatsappNo: '',
    Emailid: '',
    AlternateContactNo: '',
    DesignationID: null,
    sex: '',
    DateOfJoin: null,
    IsWorking: true,
    DateofRelieving: null,
    Remarks: '',
  };

  newEmployeeData: any = { ...this.defaultEmployeeData };

  sexOptions = ['Male', 'Female', 'Others'];

  emailPattern: any = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.com$/;

  getNewEmployeeData = () => ({ ...this.newEmployeeData });

  clearData() {
    this.newEmployeeData = { ...this.defaultEmployeeData };
  }

  onEmployeeNameInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    const sanitizedValue = target.value
      .replace(/[^a-zA-Z\s]/g, '')
      .replace(/\s{2,}/g, ' ')
      .replace(/^\s+/g, '')
      .toUpperCase();

    target.value = sanitizedValue;
    this.newEmployeeData.EmployeeName = sanitizedValue;
  }

  onPhoneInput(event: Event, fieldName: string): void {
    const target = event.target as HTMLInputElement;
    const sanitizedValue = target.value.replace(/[^\d+]/g, '');

    target.value = sanitizedValue;
    this.newEmployeeData[fieldName] = sanitizedValue;
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
  declarations: [NewEmployeemasterComponent],
  exports: [NewEmployeemasterComponent],
})
export class NewEmployeemasterModule {}
