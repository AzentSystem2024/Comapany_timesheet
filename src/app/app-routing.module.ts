import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { BrowserModule } from '@angular/platform-browser';
import {
  LoginFormComponent,
  ResetPasswordFormComponent,
  CreateAccountFormComponent,
  ChangePasswordFormComponent,
} from './components';
import { AuthGuardService } from './services';
import {
  SideNavOuterToolbarComponent,
  UnauthenticatedContentComponent,
} from './layouts';
import { AnalyticsDashboardComponent } from './pages/HOME/analytics-dashboard/analytics-dashboard.component';
import { AppSignInComponent } from './pages/sign-in-form/sign-in-form.component';
import { AppSignUpComponent } from './pages/sign-up-form/sign-up-form.component';
import { AppResetPasswordComponent } from './pages/reset-password-form/reset-password-form.component';
import { UserLevelMasterComponent } from './pages/MASTER PAGES/user-role-master/user-role-master.component';
import { UserComponent } from './pages/MASTER PAGES/user/user.component';
import { TimeSheetComponent } from './pages/MASTER PAGES/time-sheet/time-sheet.component';
import { ChangePasswordComponent } from './pages/PROFILE PAGES/change-password/change-password.component';
import { TwoStepVerificationComponent } from './components/library/two-step-verification/two-step-verification.component';
import { AboutPageComponent } from './pages/about-page/about-page.component';
import { SecurityPolicyComponent } from './pages/SYSTEM PAGES/security-policy/security-policy.component';
import { EmployeeMasterComponent } from './pages/MASTER PAGES/employee-master/employee-master.component';
import { DesignationComponent } from './pages/MASTER PAGES/designation/designation.component';
import { ProjectsComponent } from './pages/MASTER PAGES/projects/projects.component';
import { TimesheetSummaryComponent } from './pages/REPORT PAGES/timesheet-summary/timesheet-summary.component';
import { UserLogComponent } from './pages/REPORT PAGES/user-log/user-log.component';
import { ReportDesignerComponent } from './report-designer/report-designer.component';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'auth/login',
    pathMatch: 'full',
  },
  {
    path: 'auth',
    component: UnauthenticatedContentComponent,
    children: [
      {
        path: 'login',
        component: LoginFormComponent,
        canActivate: [AuthGuardService],
      },
      {
        path: 'reset-password',
        component: ResetPasswordFormComponent,
        canActivate: [AuthGuardService],
      },
      {
        path: 'create-account',
        component: CreateAccountFormComponent,
        canActivate: [AuthGuardService],
      },
      {
        path: 'change-password/:recoveryCode',
        component: ChangePasswordFormComponent,
        canActivate: [AuthGuardService],
      },
      {
        path: 'two-step-verification',
        component: TwoStepVerificationComponent,
        canActivate: [AuthGuardService],
      },
      {
        path: '**',
        redirectTo: 'login',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: '',
    component: SideNavOuterToolbarComponent,
    children: [
      {
        path: 'security-policy',
        component: SecurityPolicyComponent,
        canActivate: [AuthGuardService],
      },
      {
        path: 'user-levels-Master',
        component: UserLevelMasterComponent,
        canActivate: [AuthGuardService],
      },
      {
        path: 'timesheet',
        component: TimeSheetComponent,
        canActivate: [AuthGuardService],
      },
      {
        path: 'user',
        component: UserComponent,
        canActivate: [AuthGuardService],
      },
      {
        path: 'facility-page',
        component: EmployeeMasterComponent,
        canActivate: [AuthGuardService],
      },
      {
        path: 'employee-master',
        component: EmployeeMasterComponent,
        canActivate: [AuthGuardService],
      },
      {
        path: 'projects',
        component: ProjectsComponent,
        canActivate: [AuthGuardService],
      },
      {
        path: 'designation',
        component: DesignationComponent,
        canActivate: [AuthGuardService],
      },
      {
        path: 'change-password',
        component: ChangePasswordComponent,
      },
      {
        path: 'user-log',
        component: UserLogComponent,
        canActivate: [AuthGuardService],
      },
      {
        path: 'speciality',
        redirectTo: 'projects',
        pathMatch: 'full'
      },
      {
        path: 'clinician-profession',
        redirectTo: 'timesheet',
        pathMatch: 'full'
      },
      {
        path: 'clinician-category',
        redirectTo: 'designation',
        pathMatch: 'full'
      },

      {
        path: 'analytics-dashboard',
        component: AnalyticsDashboardComponent,
        canActivate: [AuthGuardService],
      },
      {
        path: 'sign-in-form',
        component: AppSignInComponent,
        canActivate: [AuthGuardService],
      },
      {
        path: 'sign-up-form',
        component: AppSignUpComponent,
        canActivate: [AuthGuardService],
      },
      {
        path: 'reset-password-form',
        component: AppResetPasswordComponent,
        canActivate: [AuthGuardService],
      },
      {
        path: 'about',
        component: AboutPageComponent,
        canActivate: [AuthGuardService],
      },
      {
        path: 'timesheet-summary',
        component: TimesheetSummaryComponent,
        canActivate: [AuthGuardService],
      },
      {
        path: 'report-designer',
        component: ReportDesignerComponent,
        canActivate: [AuthGuardService],
      },
      {
        path: 'report-dashboard',
        loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent),
        canActivate: [AuthGuardService],
      },
      {
        path: 'report-viewer/:reportName',
        loadComponent: () => import('./pages/viewer/viewer.component').then(m => m.ViewerComponent),
        canActivate: [AuthGuardService],
      },
      {
        path: '**',
        redirectTo: 'employee-master',
        pathMatch: 'full',
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: true }), BrowserModule],
  providers: [AuthGuardService],
  exports: [RouterModule],
  declarations: [],
})
export class AppRoutingModule {}
