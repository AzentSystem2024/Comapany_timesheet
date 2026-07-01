import { CommonModule } from '@angular/common';
import { Component, NgModule, Input, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';

import { LoginOauthModule } from 'src/app/components/library/login-oauth/login-oauth.component';
import { ValidationCallbackData } from 'devextreme-angular/common';
import { DxFormModule } from 'devextreme-angular/ui/form';
import { DxLoadIndicatorModule } from 'devextreme-angular/ui/load-indicator';
import { DxSelectBoxModule } from 'devextreme-angular/ui/select-box';
import notify from 'devextreme/ui/notify';
import { AuthService, IResponse } from 'src/app/services';
import { MasterReportService } from '../../../pages/MASTER PAGES/master-report.service';

@Component({
  selector: 'app-create-account-form',
  templateUrl: './create-account-form.component.html',
  styleUrls: ['./create-account-form.component.scss'],
})
export class CreateAccountFormComponent implements OnInit {
  @Input() redirectLink = '/auth/login';
  @Input() buttonLink = '/auth/login';
  loading = false;

  defaultAuthData: IResponse;

  formData: any = {};
  designationOptions: any[] = [];

  constructor(
    private authService: AuthService, 
    private router: Router,
    private masterReportService: MasterReportService
  ) { }

  async onSubmit(e: Event) {
    e.preventDefault();
    this.loading = true;
    const result = await this.authService.createAccount(this.formData);
    this.loading = false;

    if (result.isOk) {
      this.router.navigate([this.buttonLink]);
    } else {
      notify(result.message, 'error', 2000);
    }
  }

  confirmPassword = (e: ValidationCallbackData) => e.value === this.formData.password;

  async ngOnInit(): Promise<void> {
    this.defaultAuthData = await this.authService.getUser();
    this.masterReportService.get_Designation_List().subscribe({
      next: (res: any) => {
        if (res.flag === "1" && res.data) {
          this.designationOptions = res.data;
        }
      },
      error: (err: any) => console.error("Failed to load designations", err)
    });
  }
}
@NgModule({
  imports: [
    CommonModule,
    RouterModule,
    LoginOauthModule,
    DxFormModule,
    DxLoadIndicatorModule,
    DxSelectBoxModule,
  ],
  declarations: [CreateAccountFormComponent],
  exports: [CreateAccountFormComponent],
})
export class CreateAccountFormModule { }
