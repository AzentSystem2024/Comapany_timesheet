import { CommonModule } from '@angular/common';
import { Component, NgModule, OnInit, ViewChild } from '@angular/core';
import {
  DxButtonModule,
  DxDataGridModule,
  DxTextBoxModule,
  DxValidationGroupComponent,
  DxValidationGroupModule,
  DxValidatorModule,
  DxSwitchModule,
  DxPopupModule
} from 'devextreme-angular';
import { FormPopupModule } from 'src/app/components';
import { UserService } from 'src/app/services/user.service';
import { MasterReportService } from '../../MASTER PAGES/master-report.service';
import notify from 'devextreme/ui/notify';
import { AuthService } from 'src/app/services';
import { Router } from '@angular/router';
import { CustomReuseStrategy } from 'src/app/custom-reuse-strategy';

@Component({
  selector: 'app-change-password',
  templateUrl: './change-password.component.html',
  styleUrls: ['./change-password.component.scss'],
  providers: [CustomReuseStrategy],
})
export class ChangePasswordComponent implements OnInit {
  @ViewChild('validationGroup', { static: true })
  validationGroup: DxValidationGroupComponent;

  securityPolicyData: any = {
    Numbers: true,
    UppercaseCharacters: true,
    LowercaseCharacters: true,
    SpecialCharacters: true,
    MinimumLength: 8,
    PasswordValidationRequired: true
  };
  UserID: any;
  oldPassword: any;
  getOldPassword: any;
  newPassword: string = '';
  confirmPassword: string = '';
  confirmPasswordBorderColor: string = '1px solid #ddd'; // Default border color
  oldPasswordBorderColor: string = '1px solid #ddd'; // Default border color
  oldPasswordError: string = ''; // Error message for old password validation
  dummyId: any;
  showConfirmPassword: boolean = false;
  isPasswordVisible: boolean = false;
  isOldPasswordVisible: boolean = false;
  isConfirmPasswordVisible: boolean = false;
  isSaving: boolean = false; // Property to track saving state
  isTwoFactorEnabled: boolean = false;

  constructor(
    private service: MasterReportService,
    private authService: AuthService,
    private route: Router,
    private reuseStrategy: CustomReuseStrategy
  ) {
    this.UserID = sessionStorage.getItem('UserID');
    console.log(this.dummyId, 'dummy');
  }

  // isValid() {
  //   return this.validationGroup.instance.validate().isValid;
  // }

  validatePasswordMatch = (): boolean => {
    return this.newPassword === this.confirmPassword;
  };

  togglePasswordVisibility(): void {
    this.isPasswordVisible = !this.isPasswordVisible; // Toggle the visibility
  }
  toggleOldPasswordVisibility(): void {
    this.isOldPasswordVisible = !this.isOldPasswordVisible; // Toggle the visibility
  }

  saveNewPassword() {
    this.isSaving = true;

    // Validate the entire validation group
    const validationResult = this.validationGroup.instance.validate();

    // Check if the form is valid before proceeding
    if (!validationResult.isValid) {
      this.isSaving = false;
      return; // Stop execution if form is not valid; error messages will be shown next to the fields
    }

    // Check if the new password meets the security policy
    const policyError = this.getPasswordPolicyError();
    if (policyError) {
      this.isSaving = false;
      notify(
        {
          message: policyError,
          position: { at: 'top right', my: 'top right' },
          displayTime: 4000,
        },
        'error'
      );
      return;
    }

    const reqData = {
      UserID: parseInt(this.UserID),
      OldPassword: this.oldPassword,
      NewPassword: this.newPassword || '',
      IsTwoFactorEnabled: this.isTwoFactorEnabled
    };

    this.authService.updatePasswordAnd2FA(reqData).subscribe({
      next: (res: any) => {
        if (res.flag === '1') {
          notify({ message: 'Updated Successfully', position: {at: 'top right', my: 'top right'}, displayTime: 1500}, 'success');
          
          // Update 2FA state in localStorage
          const logDataStr = localStorage.getItem('logData');
          if (logDataStr) {
             try {
                const logData = JSON.parse(logDataStr);
                logData.IsTwoFactorEnabled = this.isTwoFactorEnabled;
                localStorage.setItem('logData', JSON.stringify(logData));
             } catch(e) {}
          }

          this.isSaving = false;
          this.closeChangePassword();
        } else {
          this.isSaving = false;
          notify({ message: res.message || 'Update failed', position: {at: 'top right', my: 'top right'}}, 'error');
        }
      },
      error: (err: any) => {
        this.isSaving = false;
        notify({ message: 'Operation failed', position: {at: 'top right', my: 'top right'}}, 'error');
      }
    });
  }

  closeChangePassword() {
    // Navigate to the user's first allowed route from their menu
    try {
      const menuItems = JSON.parse(localStorage.getItem('sidemenuItems') || '[]');
      const firstItem = menuItems.find((m: any) => m.path && m.path.trim() !== '');
      if (firstItem) {
        const route = firstItem.path.startsWith('/') ? firstItem.path : '/' + firstItem.path;
        this.route.navigateByUrl(route);
      } else {
        this.route.navigateByUrl('/timesheet');
      }
    } catch (e) {
      this.route.navigateByUrl('/timesheet');
    }
  }

  validateField(fieldName: string): boolean {
    // Trigger validation for a specific field
    const instance = (
      document.getElementById(fieldName) as any
    ).dxValidator?.instance();
    if (instance) {
      return instance.validate().isValid;
    }
    return false;
  }

  ngOnInit(): void {
    this.getSecurityPolicyData();
    const logDataStr = localStorage.getItem('logData');
    if (logDataStr) {
      try {
        const logData = JSON.parse(logDataStr);
        this.isTwoFactorEnabled = logData.IsTwoFactorEnabled || logData.isTwoFactorEnabled || false;
      } catch (e) {}
    }
  }

  onOldPasswordValueChanged(event: any): void {
    this.oldPassword = event.value;
  }

  // Custom validation function for old password
  validateOldPassword = (params: any): boolean => {
    return true; // We rely on backend for validation
  };

  toggleShowConfirmPassword(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.isConfirmPasswordVisible = !this.isConfirmPasswordVisible;
  }

  getUserPassword() {
  }

  getSecurityPolicyData() {
    this.service.getUserSecurityPolicityData().subscribe((res: any) => {
      this.securityPolicyData = res.data[0];
      console.log(res, 'secpolicy');
      console.log('hhh');
      console.log('user security policy data', this.securityPolicyData);
    });
  }
  onNewPasswordChanged(event: any): void {
    const cleaned = (event.value || '').replace(/\s/g, '');
    this.newPassword = cleaned;
  }

  onConfirmPasswordKeyDown(event: KeyboardEvent): void {
    // Capture current input value
    const target = event.target as HTMLInputElement;
    setTimeout(() => {
      this.confirmPassword = target.value; // Get the updated password after keydown
      this.validateConfirmPassword(); // Call the function to check the strength of the password
    }, 0);
  }

  // Function to check if the password meets all security requirements
  checkPasswordStrength(): boolean {
    if (
      !this.securityPolicyData ||
      !this.securityPolicyData.PasswordValidationRequired
    ) {
      return true;
    }

    // Fail validation if no new password is provided but validation is required
    if (!this.newPassword) return false;

    return (
      this.checkNumbers() &&
      this.checkUppercase() &&
      this.checkLowercase() &&
      this.checkSpecialCharacters() &&
      this.checkMinimumLength()
    );
  }

  validateConfirmPassword(): void {
    // Validate if confirmPassword matches newPassword
    if (this.confirmPassword === this.newPassword) {
      this.confirmPasswordBorderColor = '2px solid green'; // Set border color to green
    } else {
      this.confirmPasswordBorderColor = '2px solid red'; // Set border color to red
    }
  }

  checkNumbers(): boolean {
    return this.securityPolicyData.Numbers ? /\d/.test(this.newPassword) : true;
  }

  checkUppercase(): boolean {
    return this.securityPolicyData.UppercaseCharacters
      ? /[A-Z]/.test(this.newPassword)
      : true;
  }

  checkLowercase(): boolean {
    return this.securityPolicyData.LowercaseCharacters
      ? /[a-z]/.test(this.newPassword)
      : true;
  }

  checkSpecialCharacters(): boolean {
    if (!this.securityPolicyData || !this.securityPolicyData.SpecialCharacters) return true;
    return /[!@#$%^&*(),.?":{}|<>\-_=+\[\]\\;'`~@]/.test(this.newPassword || '');
  }

  // Returns specific error message for which policy rule the password violates
  getPasswordPolicyError(): string | null {
    if (!this.securityPolicyData || !this.securityPolicyData.PasswordValidationRequired) {
      return null;
    }
    const pwd = this.newPassword || '';
    if (!pwd) return 'Password cannot be empty.';
    if (this.securityPolicyData.MinimumLength && pwd.length < Number(this.securityPolicyData.MinimumLength)) {
      return `Password must be at least ${this.securityPolicyData.MinimumLength} characters long.`;
    }
    if (this.securityPolicyData.Numbers && !/\d/.test(pwd)) {
      return 'Password must contain at least 1 number.';
    }
    if (this.securityPolicyData.UppercaseCharacters && !/[A-Z]/.test(pwd)) {
      return 'Password must contain at least 1 uppercase letter.';
    }
    if (this.securityPolicyData.LowercaseCharacters && !/[a-z]/.test(pwd)) {
      return 'Password must contain at least 1 lowercase letter.';
    }
    if (this.securityPolicyData.SpecialCharacters && !/[!@#$%^&*(),.?":{}|<>\-_=+\[\]\\;'`~@]/.test(pwd)) {
      return 'Password must contain at least 1 special character.';
    }
    return null;
  }

  checkMinimumLength(): boolean {
    if (!this.securityPolicyData || !this.securityPolicyData.MinimumLength) return true;
    return (this.newPassword || '').length >= Number(this.securityPolicyData.MinimumLength);
  }
}

@NgModule({
  imports: [
    CommonModule,
    DxDataGridModule,
    DxButtonModule,
    DxTextBoxModule,
    FormPopupModule,
    DxValidatorModule,
    DxValidationGroupModule,
    DxSwitchModule,
    DxPopupModule
  ],
  providers: [],
  exports: [],
  declarations: [ChangePasswordComponent],
})
export class ChangePasswordModule {}
