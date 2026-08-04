import { CommonModule } from '@angular/common';
import { Component, NgModule, OnInit, ViewChild } from '@angular/core';
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
  DxSwitchModule,
  DxValidationGroupModule,
  DxValidationGroupComponent
} from 'devextreme-angular';
import { SystemServicesService } from '../../SYSTEM PAGES/system-services.service';

@Component({
  selector: 'app-new-employeemaster',
  templateUrl: './new-employeemaster.component.html',
  styleUrls: ['./new-employeemaster.component.scss'],
})
export class NewEmployeemasterComponent implements OnInit {
  maxDateOfBirth: Date;
  designationOptions: any[] = [];
  countryCodes: any[] = [];
  @ViewChild('addValidationGroup') validationGroup!: DxValidationGroupComponent;
  @ViewChild('passwordTextBox') passwordTextBox!: any;

  passwordMode: 'password' | 'text' = 'password';

  passwordButtonOptions: any = {
    icon: 'eyeopen',
    stylingMode: 'text',
    onClick: () => {
      this.passwordMode = this.passwordMode === 'text' ? 'password' : 'text';
      this.passwordButtonOptions.icon = this.passwordMode === 'text' ? 'eyeclose' : 'eyeopen';
    }
  };

  generatePasswordButtonOptions: any = {
    icon: 'key',
    stylingMode: 'text',
    hint: 'Generate Random Password',
    onClick: () => {
      this.generateRandomPassword();
    }
  };

  generateRandomPassword() {
    let charset = "abcdefghijklmnopqrstuvwxyz";
    let password = "";

    if (this.securityPolicy && this.securityPolicy.PasswordValidationRequired) {
      if (this.securityPolicy.UppercaseCharacters) charset += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
      if (this.securityPolicy.Numbers) charset += "0123456789";
      if (this.securityPolicy.SpecialCharacters) charset += "!@#$%^&*()_+~`|}{[]:;?><,./-=";

      const length = this.securityPolicy.MinimumLength && this.securityPolicy.MinimumLength > 8 ? this.securityPolicy.MinimumLength : 8;

      if (this.securityPolicy.UppercaseCharacters) password += "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[Math.floor(Math.random() * 26)];
      if (this.securityPolicy.Numbers) password += "0123456789"[Math.floor(Math.random() * 10)];
      if (this.securityPolicy.SpecialCharacters) password += "!@#$%^&*"[Math.floor(Math.random() * 8)];
      if (this.securityPolicy.LowercaseCharacters) password += "abcdefghijklmnopqrstuvwxyz"[Math.floor(Math.random() * 26)];

      while (password.length < length) {
        password += charset[Math.floor(Math.random() * charset.length)];
      }

      password = password.split('').sort(() => 0.5 - Math.random()).join('');
    } else {
      charset += "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
      for (let i = 0; i < 8; i++) {
        password += charset[Math.floor(Math.random() * charset.length)];
      }
    }
    
    this.newEmployeeData.LoginPassword = password;
    this.passwordMode = 'text';
    if (this.passwordButtonOptions) {
      this.passwordButtonOptions.icon = 'eyeclose';
    }
  }

  preventTyping(e: any) {
    if (e.event) {
      e.event.preventDefault();
    }
  }

  securityPolicy: any = null;

  onRoleChanged(roleIsAdmin: boolean, e: any) {
    if (e.event) {
      if (e.value) {
        this.newEmployeeData.isAdmin = roleIsAdmin;
      } else {
        this.newEmployeeData.isAdmin = null;
      }
    }
  }

  validateForm(): boolean {
    return this.validationGroup ? this.validationGroup.instance.validate().isValid : true;
  }

  constructor(
    private masterReportService: MasterReportService,
    private systemServicesService: SystemServicesService
  ) {
    const today = new Date();
    this.maxDateOfBirth = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
  }

  ngOnInit(): void {
    this.systemServicesService.getCountryWithFlags().subscribe((res: any) => {
      this.countryCodes = res;
    });
    this.masterReportService.get_Designation_List().subscribe({
      next: (res: any) => {
        if (res.flag === "1" && res.data) {
          this.designationOptions = res.data;
        }
      },
      error: (err: any) => console.error("Failed to load designations", err)
    });

    const userId = sessionStorage.getItem('UserID') || '0';
    this.systemServicesService.get_securityPolicy_List(userId).subscribe({
      next: (res: any) => {
        if (res && res.data && res.data.length > 0) {
          this.securityPolicy = res.data[0];
        }
      },
      error: (err: any) => console.error("Failed to load security policy", err)
    });
  }

  validatePassword = (params: any) => {
    const password = params.value;
    if (!password) return true; // Required validation handles empty case
    if (!this.securityPolicy || !this.securityPolicy.PasswordValidationRequired) return true;

    if (this.securityPolicy.MinimumLength && password.length < this.securityPolicy.MinimumLength) {
      params.rule.message = `Password must be at least ${this.securityPolicy.MinimumLength} characters`;
      return false;
    }
    if (this.securityPolicy.Numbers && !/\d/.test(password)) {
      params.rule.message = 'Password must contain at least 1 number';
      return false;
    }
    if (this.securityPolicy.UppercaseCharacters && !/[A-Z]/.test(password)) {
      params.rule.message = 'Password must contain at least 1 uppercase character';
      return false;
    }
    if (this.securityPolicy.LowercaseCharacters && !/[a-z]/.test(password)) {
      params.rule.message = 'Password must contain at least 1 lowercase character';
      return false;
    }
    if (this.securityPolicy.SpecialCharacters && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      params.rule.message = 'Password must contain at least 1 special character';
      return false;
    }

    return true;
  };

  private defaultEmployeeData = {
    EmployeeName: '',
    Address1: '',
    MobileCountryCode: '+91',
    MobileNo: '',
    WhatsappCountryCode: '+91',
    WhatsappNo: '',
    EmailID: '',
    LoginPassword: '',
    DesignationID: null,
    Sex: null,
    DateOfJoin: null,
    IsWorking: true,
    isAdmin: false,
    IsTwoFactorEnabled: false,
    Remarks: '',
  };

  newEmployeeData: any = { ...this.defaultEmployeeData };

  sexOptions = ['Male', 'Female', 'Others'];

  emailPattern: any = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.com$/;

  getNewEmployeeData = () => {
    const data = { ...this.newEmployeeData };
    if (data.MobileNo) {
      data.MobileNo = data.MobileCountryCode + '-' + data.MobileNo;
    }
    if (data.WhatsappNo) {
      data.WhatsappNo = data.WhatsappCountryCode + '-' + data.WhatsappNo;
    }
    return data;
  };

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

  checkEmail = (params: any) => {
    return new Promise((resolve) => {
      const email = params.value;
      if (!email) {
        resolve(true);
        return;
      }
      this.masterReportService.checkEmailExists(email, 0).subscribe({
        next: (res: any) => {
          resolve(!res.exists);
        },
        error: () => resolve(true) // on error, let it pass or handle differently
      });
    });
  };
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
    DxSwitchModule,
    DxValidationGroupModule
  ],
  declarations: [NewEmployeemasterComponent],
  exports: [NewEmployeemasterComponent],
})
export class NewEmployeemasterModule { }
