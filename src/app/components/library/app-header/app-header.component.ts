import {
  Component,
  NgModule,
  Input,
  Output,
  EventEmitter,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';

import { DxButtonModule } from 'devextreme-angular/ui/button';
import { DxToolbarModule } from 'devextreme-angular/ui/toolbar';

import { UserPanelModule } from '../user-panel/user-panel.component';
import { AuthService, DataService, IUser } from 'src/app/services';
import { ThemeSwitcherModule } from 'src/app/components/library/theme-switcher/theme-switcher.component';
import { DxTooltipModule } from 'devextreme-angular';
import { Router } from '@angular/router';
import { CustomReuseStrategy } from 'src/app/custom-reuse-strategy';

@Component({
  selector: 'app-header',
  templateUrl: 'app-header.component.html',
  styleUrls: ['./app-header.component.scss'],
  providers: [CustomReuseStrategy],
})
export class AppHeaderComponent implements OnInit {
  @Output()
  menuToggle = new EventEmitter<boolean>();

  @Input()
  menuToggleEnabled = false;

  @Input()
  title!: string;

  user: IUser | null = { email: '' };

  userMenuItems = [
    {
      text: 'Change Password',
      icon: 'key',
      onClick: () => {
        this.changePassword();
      },
    },
    {
      text: 'Logout',
      icon: 'runner',
      onClick: () => {
        this.reuseStrategy.clearStoredData();
        // Call the logout service
        this.authService.logOut().subscribe((response: any) => {
          if (response) {
            // Clear storage
            localStorage.removeItem('sidemenuItems');
            localStorage.clear();
            sessionStorage.clear();
            // Clear stored routes again to ensure no leftovers
            this.reuseStrategy.clearStoredData();
            // Navigate to the login page directly for a smooth refresh
            window.location.href = '/auth/login';
          }
        });
      },
    },
  ];
  customerInfo: any;

  constructor(
    private authService: AuthService,
    private router: Router,
    private reuseStrategy: CustomReuseStrategy,
    private dataservice: DataService,
  ) {}

  ngOnInit() {
    // Fetch the user and set the loginName
    this.authService.getUser().then((response) => {
      if (response.isOk && response.data) {
        this.user = response.data;
        this.user.name = this.authService.loginName; // Bind loginName
        // Get UserPhoto from sessionStorage
        const storedUserPhoto = sessionStorage.getItem('UserPhoto');

        // Set avatarUrl: use storedUserPhoto if available, otherwise default to initials icon
        const hasPhoto = storedUserPhoto && storedUserPhoto !== 'null' && storedUserPhoto !== 'undefined' && storedUserPhoto !== '';
        this.user.avatarUrl = hasPhoto
          ? storedUserPhoto
          : `https://ui-avatars.com/api/?name=${this.user.name || 'User'}&background=F44336&color=fff&rounded=true`;
      }
    });

    this.customerInfo = this.dataservice.fetch_customer_name();
  }
  changePassword() {
    this.router.navigateByUrl('/change-password');
  }

  toggleMenu = () => {
    this.menuToggle.emit();
  };
}

@NgModule({
  imports: [
    CommonModule,
    DxButtonModule,
    DxToolbarModule,
    ThemeSwitcherModule,
    UserPanelModule,
    DxTooltipModule,
  ],
  declarations: [AppHeaderComponent],
  exports: [AppHeaderComponent],
})
export class AppHeaderModule {}
