import { CommonModule } from '@angular/common';
import { Component, NgModule, OnInit } from '@angular/core';
import { MasterReportService } from '../../MASTER PAGES/master-report.service';
import {
  DxCheckBoxModule,
  DxDateBoxModule,
  DxNumberBoxModule,
  DxSelectBoxModule,
  DxTextAreaModule,
  DxTextBoxModule,
  DxValidatorModule,
  DxButtonModule,
} from 'devextreme-angular';

@Component({
  selector: 'app-new-employeemaster',
  templateUrl: './new-employeemaster.component.html',
  styleUrls: ['./new-employeemaster.component.scss'],
})
export class NewEmployeemasterComponent implements OnInit {
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

  constructor(private masterReportService: MasterReportService) {
    const today = new Date();
    this.maxDateOfBirth = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
  }

  ngOnInit(): void {
    this.masterReportService.get_Designation_List().subscribe({
      next: (res: any) => {
        if (res.flag === "1" && res.data) {
          this.designationOptions = res.data;
        }
      },
      error: (err: any) => console.error("Failed to load designations", err)
    });
  }

  private defaultEmployeeData = {
    EmployeeName: '',
    Address1: '',
    MobileNo: '',
    WhatsappNo: '',
    EmailID: '',
    LoginPassword: '',
    DesignationID: null,
    Sex: null,
    DateOfJoin: null,
    IsWorking: true,
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
  ],
  declarations: [NewEmployeemasterComponent],
  exports: [NewEmployeemasterComponent],
})
export class NewEmployeemasterModule {}
