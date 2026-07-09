import { CommonModule } from '@angular/common';
import {Component, EventEmitter, Input, NgModule, OnInit, Output, ViewChild} from '@angular/core';
import { DxFormModule } from 'devextreme-angular/ui/form';
import { DxLoadIndicatorModule } from 'devextreme-angular/ui/load-indicator';
import { DxSwitchModule } from 'devextreme-angular';
import {FormPopupComponent, FormPopupModule} from 'src/app/components/utils/form-popup/form-popup.component';
import notify from 'devextreme/ui/notify';
import { AuthService } from 'src/app/services/auth.service';

import {
  PasswordTextBoxComponent,
  PasswordTextBoxModule,
} from 'src/app/components/library/password-text-box/password-text-box.component';

import { ValidationRule } from 'devextreme-angular/common';

@Component({
  selector: 'change-profile-password-form',
  templateUrl: './change-profile-password-form.component.html',
  styleUrls: ['./change-profile-password-form.component.scss']
})
export class ChangeProfilePasswordFormComponent implements OnInit {
  @ViewChild(FormPopupComponent, { static: true }) formPopup;

  @ViewChild('confirmField', { static: true }) confirmField: PasswordTextBoxComponent;

  constructor(private authService: AuthService) {}

  ngOnInit() {
    const logDataStr = localStorage.getItem('logData');
    if (logDataStr) {
      try {
        const logData = JSON.parse(logDataStr);
        this.formData['isTwoFactorEnabled'] = logData.IsTwoFactorEnabled || logData.isTwoFactorEnabled || false;
      } catch (e) {}
    }
  }

  @Input() visible = false;

  @Output() visibleChange = new EventEmitter<boolean>();

  isSaveDisabled = true;

  formData: Record<string, any> = {};

  confirmPasswordValidators: ValidationRule[] = [
    {
      type: 'compare',
      message: 'Passwords do not match',
      comparisonTarget: () => this.formData.password,
    },
  ];

  async onFieldChanged() {
    const hasCurrentPassword = !!this.formData['currentPassword'];
    const hasNewPassword = !!this.formData['password'];
    const hasConfirmPassword = !!this.formData['confirmedPassword'];
    
    // If they type a new password, they MUST confirm it
    if (hasNewPassword && !hasConfirmPassword) {
      this.isSaveDisabled = true;
      return;
    }

    this.isSaveDisabled = !hasCurrentPassword || !this.formPopup.isValid();
  }

  saveNewPassword(): void {
    const reqData = {
      OldPassword: this.formData['currentPassword'],
      NewPassword: this.formData['password'] || '',
      IsTwoFactorEnabled: !!this.formData['isTwoFactorEnabled']
    };

    this.authService.updatePasswordAnd2FA(reqData).subscribe({
      next: (res: any) => {
        if (res.flag === "1") {
          notify({ message: 'Updated Successfully', position: {at: 'bottom center', my: 'bottom center'}}, 'success');
          const logDataStr = localStorage.getItem('logData');
          if (logDataStr) {
             const logData = JSON.parse(logDataStr);
             logData.IsTwoFactorEnabled = !!reqData.IsTwoFactorEnabled;
             localStorage.setItem('logData', JSON.stringify(logData));
          }
          this.changeVisible(false);
          this.formData = {}; // reset
        } else {
          notify({ message: res.message || 'Update failed', position: {at: 'bottom center', my: 'bottom center'}}, 'error');
        }
      },
      error: (err: any) => {
        notify({ message: 'Server error', position: {at: 'bottom center', my: 'bottom center'}}, 'error');
      }
    });
  }

  checkConfirm(): void {
    this.confirmField.revalidate();
  }

  onNewPasswordChanged() {
    this.checkConfirm();
    this.onFieldChanged();
  }

  changeVisible(visible: boolean): void {
    this.visible = visible;
    this.visibleChange.emit(this.visible);
  }
}

@NgModule({
  imports: [
    CommonModule,
    DxFormModule,
    DxLoadIndicatorModule,
    PasswordTextBoxModule,
    FormPopupModule,
    DxSwitchModule
  ],
  declarations: [ChangeProfilePasswordFormComponent],
  exports: [ChangeProfilePasswordFormComponent],
})
export class ChangeProfilePasswordFormModule { }
