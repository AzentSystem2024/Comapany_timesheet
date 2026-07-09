import { CommonModule } from '@angular/common';
import { Component, NgModule, OnInit, ViewChild } from '@angular/core';
import {
  DxButtonModule,
  DxDataGridModule,
  DxTextBoxModule,
  DxValidationGroupComponent,
  DxValidationGroupModule,
  DxValidatorModule,
  DxSwitchModule
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

  securityPolicyData: any;
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
    if (!this.checkPasswordStrength()) {
      this.isSaving = false;
      // Show error message if the password does not meet the security policy
      notify(
        {
          message: 'New password does not meet the security requirements.',
          position: { at: 'top right', my: 'top right' },
          displayTime: 500,
        },
        'error'
      );
      return; // Stop execution if the password does not meet the policy
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
    this.route.navigateByUrl('/employee-master');
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
  onPasswordInput(event: Event): void {
    const target = event.target as HTMLInputElement;

    // Remove spaces from the current value
    const sanitizedValue = target.value.replace(/\s/g, '');

    // Update the target value and the newPassword property
    target.value = sanitizedValue;
    this.newPassword = sanitizedValue; // Update the password value

    this.checkPasswordStrength(); // Call the function to check the strength of the password
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
    return this.securityPolicyData.SpecialCharacters
      ? /[!@#$%^&*(),.?":{}|<>]/.test(this.newPassword)
      : true;
  }

  checkMinimumLength(): boolean {
    return this.newPassword.length >= this.securityPolicyData.MinimumLength;
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
    DxSwitchModule
  ],
  providers: [],
  exports: [],
  declarations: [ChangePasswordComponent],
})
export class ChangePasswordModule {}
