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
  DxValidationGroupComponent,
  DxSwitchModule,
  DxPopupModule
} from 'devextreme-angular';
import notify from 'devextreme/ui/notify';
import { custom } from 'devextreme/ui/dialog';
import { MasterReportService } from '../../MASTER PAGES/master-report.service';
import { SystemServicesService } from '../../SYSTEM PAGES/system-services.service';

@Component({
  selector: 'app-employeemaster-edit',
  templateUrl: './employeemaster-edit.component.html',
  styleUrls: ['./employeemaster-edit.component.scss'],
})
export class EmployeemasterEditComponent implements OnChanges, OnInit {
  @ViewChild('validationGroup', { static: true }) validationGroup!: DxValidationGroupComponent;
  @ViewChild('passwordTextBox') passwordTextBox!: any;
  @Input() formdata: any;
  @Output() closeForm = new EventEmitter();

  newEmployeeData: any = {};
  countryCodes: any[] = [];
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

      // Shuffle password
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
      // Allow Ctrl+C, Ctrl+A, Cmd+C, Cmd+A for copying
      if ((e.event.ctrlKey || e.event.metaKey) && (e.event.key.toLowerCase() === 'c' || e.event.key.toLowerCase() === 'a')) {
        return;
      }
      e.event.preventDefault();
    }
  }

  securityPolicy: any = null;

  constructor(
    private service: MasterReportService,
    private systemServicesService: SystemServicesService
  ) {
    const today = new Date();
    this.maxDateOfBirth = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
  }

  ngOnInit(): void {
    this.systemServicesService.getCountryWithFlags().subscribe((res: any) => {
      this.countryCodes = res;
    });
    this.service.get_Designation_List().subscribe({
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

  ngOnChanges(changes: SimpleChanges) {
    if (changes['formdata'] && changes['formdata'].currentValue) {
      this.newEmployeeData = { ...this.formdata };


      if (this.newEmployeeData.DateOfJoin) {
        this.newEmployeeData.DateOfJoin = new Date(this.newEmployeeData.DateOfJoin);
      }
      if (this.newEmployeeData.DateofRelieving) {
        this.newEmployeeData.DateofRelieving = new Date(this.newEmployeeData.DateofRelieving);
      }

      // Parse country codes
      if (this.newEmployeeData.MobileNo) {
        const parts = this.newEmployeeData.MobileNo.split('-');
        if (parts.length > 1) {
          this.newEmployeeData.MobileCountryCode = parts[0];
          this.newEmployeeData.MobileNo = parts[1];
        } else {
          this.newEmployeeData.MobileCountryCode = '+91';
        }
      } else {
        this.newEmployeeData.MobileCountryCode = '+91';
      }

      if (this.newEmployeeData.WhatsappNo) {
        const parts = this.newEmployeeData.WhatsappNo.split('-');
        if (parts.length > 1) {
          this.newEmployeeData.WhatsappCountryCode = parts[0];
          this.newEmployeeData.WhatsappNo = parts[1];
        } else {
          this.newEmployeeData.WhatsappCountryCode = '+91';
        }
      } else {
        this.newEmployeeData.WhatsappCountryCode = '+91';
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

  generatedPasswordToShow: string = '';

  copyPassword() {
    navigator.clipboard.writeText(this.generatedPasswordToShow).then(() => {
      notify({ message: 'Password copied to clipboard', position: { at: 'top right', my: 'top right' }, displayTime: 1000 }, 'success');
    });
  }

  onSaveClick() {
    const validationResult = this.validationGroup.instance.validate();
    if (!validationResult.isValid) return;

    const dataToSave = { ...this.newEmployeeData };
    if (dataToSave.MobileNo) {
      dataToSave.MobileNo = dataToSave.MobileCountryCode + '-' + dataToSave.MobileNo;
    }
    if (dataToSave.WhatsappNo) {
      dataToSave.WhatsappNo = dataToSave.WhatsappCountryCode + '-' + dataToSave.WhatsappNo;
    }

    this.service.update_Employee_Data(dataToSave).subscribe({
      next: (res: any) => {
        if (res.flag == "1") {
          notify(
            { message: 'data updated successfully', position: { at: 'top right', my: 'top right' }, displayTime: 500 },
            'success'
          );
          if (dataToSave.LoginPassword && dataToSave.LoginPassword.trim() !== '' && dataToSave.LoginPassword !== this.formdata.LoginPassword) {
            this.generatedPasswordToShow = dataToSave.LoginPassword;
            const myDialog = custom({
              title: "Password Reset Successful",
              messageHtml: `
                <p>Please copy the new password and provide it to the employee securely:</p>
                <div style="display: flex; align-items: center; justify-content: center; margin: 20px 0;">
                  <span style="font-size: 18px; letter-spacing: 1px; margin-right: 15px; background: #f0f0f0; padding: 5px 10px; border-radius: 4px;" id="copyPwdSpan">
                    ${this.generatedPasswordToShow}
                  </span>
                  <button id="copyPwdBtn" style="border: none; background: none; cursor: pointer; color: #337ab7; font-size: 18px;" title="Copy Password">
                    <i class="dx-icon-copy"></i>
                  </button>
                </div>
              `,
              buttons: [{
                text: "OK",
                onClick: (e) => {
                  return true;
                }
              }]
            });
            myDialog.show().then(() => {
              this.close();
            });

            setTimeout(() => {
              const btn = document.getElementById('copyPwdBtn');
              if (btn) {
                btn.onclick = () => {
                  this.copyPassword();
                };
              }
            }, 100);
          } else {
            this.close();
          }
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

  checkEmail = (params: any) => {
    return new Promise((resolve) => {
      const email = params.value;
      if (!email) {
        resolve(true);
        return;
      }
      const excludeId = this.newEmployeeData.ID || 0;
      this.service.checkEmailExists(email, excludeId).subscribe({
        next: (res: any) => {
          resolve(!res.exists);
        },
        error: () => resolve(true)
      });
    });
  };

  onRoleChanged(roleIsAdmin: boolean, e: any) {
    if (e.event) {
      if (e.value) {
        this.newEmployeeData.isAdmin = roleIsAdmin;
      } else {
        this.newEmployeeData.isAdmin = null;
      }
    }
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
    DxValidationGroupModule,
    DxSwitchModule,
    DxPopupModule
  ],
  declarations: [EmployeemasterEditComponent],
  exports: [EmployeemasterEditComponent],
})
export class EmployeemasterEditModule { }
