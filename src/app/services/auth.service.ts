import { HttpClient } from '@angular/common/http';
import { Token } from '@angular/compiler';
import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';

import { ConfigService } from './config.service';

export interface IUser {
  email: string;
  name?: string;
  avatarUrl?: string;
}

export interface IResponse {
  isOk: boolean;
  data?: IUser;
  message?: string;
}

const defaultPath = '/';
// const BaseURL = environment.PROJECTX_API_BASE_URL;

export const defaultUser: IUser = {
  email: 'Nithin@gmail.com',
  name: 'Nithin Sivadas',
  avatarUrl:
    'https://js.devexpress.com/Demos/WidgetsGallery/JSDemos/images/employees/01.png',
};

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private loggedin = new BehaviorSubject<boolean>(false);
  private menuData = new BehaviorSubject<any>(null);

  SideMenu: any;
  private _user: IUser | null = defaultUser;
  UserData: any;
  private _lastAuthenticatedPath: string = defaultPath;

  constructor(
    private router: Router,
    private http: HttpClient,
    private config: ConfigService,
  ) { }

  private get BaseURL(): string {
    return this.config.apiBaseUrl;
  }

  get loginName(): string {
    return sessionStorage.getItem('loginName') || '';
  }

  set loginName(value: string) {
    sessionStorage.setItem('loginName', value);
  }

  // Existing logic: based on user object
  get loggedIn(): boolean {
    return !!this._user;
  }

  //  New logic: based on localStorage token (for guard)
  get isTokenValid(): boolean {
    try {
      const token = sessionStorage.getItem('AuthToken') || '';
      console.log('Checking token validity:', token);
      return !!token;
    } catch {
      return false;
    }
  }

  set lastAuthenticatedPath(value: string) {
    this._lastAuthenticatedPath = value;
  }

  setUserData(data: any) {
    this.UserData = data;
  }

  getUserData() {
    return this.UserData;
  }

  getIPAddress() {
    return this.http.get('https://api.ipify.org/?format=json');
  }

  testConnection() {
    return this.http.get<any>(`${this.BaseURL}test`, { observe: 'response' });
  }

  initializeProject(version: any) {
    const data = {
      ProductVersion: version,
    };
    return this.http.post(`${this.BaseURL}CustomerInfo/getinfo`, data);
  }

  logIn(username: any, password: any, forcelogin: any) {
    const API_URL = `${this.BaseURL}Employee/login`;
    const ReqBody = {
      LoginName: username,
      Password: password,
    };
    return this.http.post<any>(API_URL, ReqBody);
  }

  get2FASetupInfo(tempToken: string) {
    const API_URL = `${this.BaseURL}Employee/setup-2fa`;
    return this.http.get<any>(API_URL, {
      headers: { Authorization: `Bearer ${tempToken}` }
    });
  }

  verify2FA(tempToken: string, code: string, secretKey: string = '') {
    const API_URL = `${this.BaseURL}Employee/verify-login-2fa`;
    const ReqBody = { TempToken: tempToken, Code: code, SecretKey: secretKey };
    return this.http.post<any>(API_URL, ReqBody, {
      headers: { Authorization: `Bearer ${tempToken}` }
    });
  }

  changePasswordTemp(tempToken: string, reqBody: any) {
    const API_URL = `${this.BaseURL}Employee/change-password`;
    return this.http.post<any>(API_URL, reqBody, {
      headers: { Authorization: `Bearer ${tempToken}` }
    });
  }

  getMenuData() {
    return this.menuData.asObservable();
  }

  isLoggedIn() {
    return this.loggedin.asObservable();
  }

  async getUser() {
    try {
      return {
        isOk: true,
        data: this._user,
      };
    } catch {
      return {
        isOk: false,
        data: null,
      };
    }
  }

  async createAccount(formData: any) {
    try {
      const API_URL = `${this.BaseURL}Employee/insert`;
      // Map formData to what the backend expects, though formData should already match
      // If the form has 'password' instead of 'LoginPassword', map it:
      if (formData.password) {
        formData.LoginPassword = formData.password;
      }
      if (formData.email) {
        formData.EmailID = formData.email;
      }

      const response: any = await this.http.post(API_URL, formData).toPromise();
      if (response && response.flag == "1") {
        return { isOk: true };
      } else {
        return { isOk: false, message: response.message || 'Failed to create account' };
      }
    } catch (err: any) {
      return {
        isOk: false,
        message: err.message || 'Server error',
      };
    }
  }

  updatePasswordAnd2FA(reqData: any) {
    const API_URL = `${this.BaseURL}Employee/change-password`;
    return this.http.post<any>(API_URL, reqData);
  }

  async changePassword(email: string, recoveryCode: string) {
    try {
      return {
        isOk: true,
      };
    } catch {
      return {
        isOk: false,
        message: 'Failed to change password',
      };
    }
  }

  async resetPassword(email: string) {
    try {
      return {
        isOk: true,
      };
    } catch {
      return {
        isOk: false,
        message: 'Failed to reset password',
      };
    }
  }

  logOut() {
    const API_URL = `${this.BaseURL}Employee/logout`;
    const token = JSON.parse(localStorage.getItem('logData') || '{}')?.Token;
    const ReqBody = { Token: token };
    return this.http.post(API_URL, ReqBody);
  }
}

@Injectable()
export class AuthGuardService implements CanActivate {
  constructor(
    private router: Router,
    private authService: AuthService,
  ) { }

  canActivate(route: ActivatedRouteSnapshot): boolean {
    const isLoggedIn = this.authService.isTokenValid;

    const isAuthForm = [
      'login',
      'reset-password',
      'create-account',
      'change-password/:recoveryCode',
    ].includes(route.routeConfig?.path || defaultPath);

    if (!isLoggedIn && !isAuthForm) {
      this.router.navigate(['/auth/login']);
      return false;
    }

    if (isLoggedIn) {
      this.authService.lastAuthenticatedPath =
        route.routeConfig?.path || defaultPath;
    }

    return true;
  }
}
