import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, NgModule, OnChanges, Output, SimpleChanges, ViewChild } from '@angular/core';
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

@Component({
  selector: 'app-employeemaster-edit',
  templateUrl: './employeemaster-edit.component.html',
  styleUrl: './employeemaster-edit.component.scss',
})
export class EmployeemasterEditComponent implements OnChanges {
  @ViewChild('validationGroup', { static: true }) validationGroup!: DxValidationGroupComponent;
  @Input() formdata: any;
  @Output() closeForm = new EventEmitter();

  newEmployeeData: any = {};
  sexOptions = ['Male', 'Female', 'Others'];

  emailPattern: any = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.com$/;
  maxDateOfBirth: Date;

  constructor() {
    const today = new Date();
    this.maxDateOfBirth = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['formdata'] && changes['formdata'].currentValue) {
      this.newEmployeeData = { ...this.formdata };
      
      if (this.newEmployeeData.DateOfBirth) {
        this.newEmployeeData.DateOfBirth = new Date(this.newEmployeeData.DateOfBirth);
      }
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

  onSaveClick() {
    const validationResult = this.validationGroup.instance.validate();
    if (!validationResult.isValid) return;

    let storedData = JSON.parse(localStorage.getItem('EmployeeMasterData') || '[]');
    const index = storedData.findIndex((item: any) => 
      (item.EmployeeID || item.ID) === (this.newEmployeeData.EmployeeID || this.newEmployeeData.ID)
    );
    
    if (index !== -1) {
      storedData[index] = { ...this.newEmployeeData };
      localStorage.setItem('EmployeeMasterData', JSON.stringify(storedData));
      notify(
        { message: 'data updated successfully', position: { at: 'top right', my: 'top right' }, displayTime: 500 },
        'success'
      );
      this.close();
    } else {
      notify(
        { message: 'Employee not found', position: { at: 'top right', my: 'top right' }, displayTime: 500 },
        'error'
      );
    }
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
