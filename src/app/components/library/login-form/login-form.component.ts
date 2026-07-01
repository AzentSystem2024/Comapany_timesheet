import { SystemServicesService } from './../../../pages/SYSTEM PAGES/system-services.service';
import { CommonModule } from '@angular/common';
import { Component, NgModule, Input, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { LoginOauthModule } from 'src/app/components/library/login-oauth/login-oauth.component';
import { DxFormModule } from 'devextreme-angular/ui/form';
import { DxLoadIndicatorModule } from 'devextreme-angular/ui/load-indicator';
import { DxButtonModule, DxButtonTypes } from 'devextreme-angular/ui/button';
import notify from 'devextreme/ui/notify';
import {
  AuthService,
  DataService,
  IResponse,
  ThemeService,
} from 'src/app/services';
import { SharedServiceService } from 'src/app/services/shared-service.service';
import { confirm } from 'devextreme/ui/dialog';
import { InactivityService } from 'src/app/services/inactivity.service';
import {
  DxLoadPanelModule,
  DxPopupModule,
  DxTextBoxModule,
} from 'devextreme-angular';
import { firstValueFrom } from 'rxjs';
import { UserService } from 'src/app/services/user.service';
import { MasterReportService } from 'src/app/pages/MASTER PAGES/master-report.service';

@Component({
  selector: 'app-login-form',
  templateUrl: './login-form.component.html',
  styleUrls: ['./login-form.component.scss'],
})
export class LoginFormComponent implements OnInit {
  @Input() resetLink = '/auth/reset-password';
  @Input() createAccountLink = '/auth/create-account';

  defaultAuthData!: IResponse;

  btnStylingMode!: DxButtonTypes.ButtonStyle;

  passwordMode = 'password';

  loading = false;

  formData: any = {};

  isPasswordVisible: boolean = false;

  loginResponse: any;
  SingleToken: boolean = false;
  securityPolicyData: any;

  is2FAState: boolean = false;
  isSetup2FA: boolean = false;
  showOTPInputForSetup: boolean = false;
  qrCodeUrl: string = '';
  manualEntryKey: string = '';
  secretKey: string = '';
  tempToken: string = '';
  otpCode: string = '';
  otpDigits: string[] = ['', '', '', '', '', ''];

  constructor(
    private authService: AuthService,
    private router: Router,
    private themeService: ThemeService,
    private sharedService: SharedServiceService,
    private inactive: InactivityService,
    private SystemService: SystemServicesService,
    private dataService: DataService,
    private userservice: MasterReportService,
  ) {
    this.formData = {};
    this.themeService.isDark.subscribe((value: boolean) => {
      this.btnStylingMode = value ? 'outlined' : 'contained';
    });
  }

  togglePasswordVisibility = () => {
    this.isPasswordVisible = !this.isPasswordVisible;
  };

  changePasswordMode() {
    debugger;
    this.passwordMode = this.passwordMode === 'text' ? 'password' : 'text';
  }

  async onSubmit(e: Event) {
    e.preventDefault();

    const { username, password } = this.formData;
    this.sharedService.triggerLoadComponent(true);

    try {
      const testRes: any = await firstValueFrom(
        this.authService.testConnection(),
      );

      if (testRes.status !== 200 && testRes.body?.flag !== 1) {
        this.showNotify('Server Error. Please try again later.', 'error');
        this.sharedService.triggerLoadComponent(false);
        return;
      }

      const version = this.dataService.get_version();
      const initResponse: any = await firstValueFrom(
        this.authService.initializeProject(version),
      );
      if (!initResponse) {
        this.sharedService.triggerLoadComponent(false);
        return;
      }

      await this.attemptLogin(username, password, false);
    } catch (err: any) {
      this.showNotify(
        'Server is not reachable. Please contact administrator.',
        'error',
      );
      this.sharedService.triggerLoadComponent(false);
    }
  }

  private async attemptLogin(
    username: string,
    password: string,
    forcelogin: boolean,
  ) {
    try {
      this.sharedService.triggerLoadComponent(true);
      const response: any = await firstValueFrom(
        this.authService.logIn(username, password, forcelogin),
      );
      this.loginResponse = response;

      if (response.flag == 1) {
        this.storeSession(response);
        await this.verify_PostOfficeCredencial_Data();
      } else if (response.flag == 10) {
        this.is2FAState = true;
        this.isSetup2FA = true;
        this.showOTPInputForSetup = false;
        this.tempToken = response.tempToken;
        this.sharedService.triggerLoadComponent(false);
        this.fetch2FASetupInfo();
      } else if (response.flag == 11) {
        this.is2FAState = true;
        this.isSetup2FA = false;
        this.showOTPInputForSetup = false;
        this.tempToken = response.tempToken;
        this.sharedService.triggerLoadComponent(false);
      } else if (response.flag == 2 && !forcelogin) {
        this.sharedService.triggerLoadComponent(false);
        const result = confirm(
          'You are already logged in on another device. Do you want to force the login process?',
          'Force Login',
        );

        result.then(async (dialogResult: boolean) => {
          if (dialogResult) {
            await this.attemptLogin(username, password, true);
          } else {
            this.showNotify(response.message, 'error');
            this.sharedService.triggerLoadComponent(false);
          }
        });
      } else {
        this.showNotify(response.message, 'error');
        this.sharedService.triggerLoadComponent(false);
      }
    } catch (err: any) {
      this.showNotify(`Error: ${err.message}`, 'error');
      this.sharedService.triggerLoadComponent(false);
    }
  }

  fetch2FASetupInfo() {
    this.sharedService.triggerLoadComponent(true);
    this.authService.get2FASetupInfo(this.tempToken).subscribe({
      next: (res: any) => {
        this.qrCodeUrl = res.qrCodeSetupImageUrl || res.QrCodeSetupImageUrl;
        this.manualEntryKey = res.manualEntryKey || res.ManualEntryKey;
        this.secretKey = res.secretKey || res.SecretKey;
        this.sharedService.triggerLoadComponent(false);
      },
      error: (err: any) => {
        this.showNotify('Failed to fetch 2FA setup info', 'error');
        this.sharedService.triggerLoadComponent(false);
      }
    });
  }

  onOtpInput(index: number, event: any) {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/[^0-9]/g, '');

    if (value.length > 1) {
      const chars = value.split('').slice(0, 6);
      for (let i = 0; i < chars.length; i++) {
        if (index + i < 6) {
          this.otpDigits[index + i] = chars[i];
          const nextInput = document.getElementById(`otp-${index + i}`) as HTMLInputElement;
          if (nextInput) nextInput.value = chars[i];
        }
      }
      this.otpCode = this.otpDigits.join('');
      const focusIndex = Math.min(index + chars.length, 5);
      const focusTarget = document.getElementById(`otp-${focusIndex}`);
      if (focusTarget) focusTarget.focus();
      return;
    }

    this.otpDigits[index] = value;
    input.value = value;
    this.otpCode = this.otpDigits.join('');

    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  }

  onOtpKeyDown(index: number, event: KeyboardEvent) {
    if (event.key === 'Backspace' && !this.otpDigits[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  }

  onNextToOTP() {
    this.showOTPInputForSetup = true;
  }

  onShowQRCode() {
    if (this.isSetup2FA) {
      this.showOTPInputForSetup = false;
    } else {
      this.isSetup2FA = true;
      this.showOTPInputForSetup = false;
      this.fetch2FASetupInfo();
    }
  }

  onVerifyOTP(e: Event) {
    e.preventDefault();
    if (!this.otpCode || this.otpCode.length < 6) {
      this.showNotify('Please enter a valid 6-digit code', 'error');
      return;
    }

    this.sharedService.triggerLoadComponent(true);
    this.authService.verify2FA(this.tempToken, this.otpCode, this.secretKey).subscribe({
      next: async (res: any) => {
        if (res.flag == 1) {
          this.storeSession(res);
          this.verify_PostOfficeCredencial_Data();
        } else {
          this.showNotify(res.message || 'Invalid code', 'error');
          this.sharedService.triggerLoadComponent(false);
        }
      },
      error: (err: any) => {
        this.showNotify('Verification failed', 'error');
        this.sharedService.triggerLoadComponent(false);
      }
    });
  }

  storeSession(response: any) {
    const { data, menus } = response;

    // ====== Store in session storage ======
    sessionStorage.setItem('loginName', data.LoginName);
    sessionStorage.setItem('UserID', data.UserID);
    sessionStorage.setItem('UserPhoto', data.PhotoFile);
    sessionStorage.setItem('AuthToken', data.Token);

    localStorage.setItem('logData', JSON.stringify(data));
    localStorage.setItem('Token', JSON.stringify(data.Token));
    localStorage.setItem('sidemenuItems', JSON.stringify(menus));

    this.authService.setUserData(data);
  }
  verify_PostOfficeCredencial_Data() {
    this.inactive.setUserlogginValue();
    this.sharedService.triggerLoadComponent(false);

    const logData = JSON.parse(localStorage.getItem('logData') || '{}');
    const email = logData.emailID || logData.EmailID || logData.emailId || '';
    const empName = logData.employeeName || logData.EmployeeName || '';

    const isAdmin = email === 'bimal@renazentit.com' || empName.toLowerCase() === 'bimal';

    if (isAdmin) {
      this.router.navigateByUrl('/employee-master');
    } else {
      this.router.navigateByUrl('/timesheet');
    }
  }


  private showNotify(message: string, type: 'success' | 'error') {
    notify(
      {
        message,
        position: { at: 'top right', my: 'top right' },
        displayTime: 5000,
      },
      type,
    );
  }

  onCreateAccountClick = () => {
    this.router.navigate([this.createAccountLink]);
  };

  async ngOnInit(): Promise<void> {
    this.getSecurityPolicyData();
  }

  getSecurityPolicyData() {
    this.userservice.getUserSecurityPolicityData().subscribe((res: any) => {
      this.securityPolicyData = res;
    });
  }

  onForgotPasswordClick(event: Event) {
    event.preventDefault();

    if (
      this.securityPolicyData?.EmailEnabled &&
      this.securityPolicyData?.IsEmailVerified &&
      this.securityPolicyData?.CanSendEmailOTP
    ) {
      this.router.navigate([this.resetLink]);
    } else {
      notify({
        message:
          'Password Reset is not allowed because Email service is disabled. Please contact your Administrator.',
        position: { at: 'top right', my: 'top right' },
        type: 'error',
      });
    }
  }
}
@NgModule({
  imports: [
    CommonModule,
    RouterModule,
    LoginOauthModule,
    DxFormModule,
    DxLoadIndicatorModule,
    DxButtonModule,
    DxPopupModule,
    DxTextBoxModule,
    DxLoadPanelModule,
  ],
  declarations: [LoginFormComponent],
  exports: [LoginFormComponent],
})
export class LoginFormModule { }
