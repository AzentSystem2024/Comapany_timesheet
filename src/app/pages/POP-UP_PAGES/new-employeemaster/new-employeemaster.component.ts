import { CommonModule } from '@angular/common';
import { Component, NgModule, OnInit } from '@angular/core';
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
  DxSwitchModule
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
  countryCodes = [
    { code: '+93', text: 'AFG (+93)' },
    { code: '+355', text: 'ALB (+355)' },
    { code: '+213', text: 'DZA (+213)' },
    { code: '+376', text: 'AND (+376)' },
    { code: '+244', text: 'AGO (+244)' },
    { code: '+54', text: 'ARG (+54)' },
    { code: '+374', text: 'ARM (+374)' },
    { code: '+61', text: 'AUS (+61)' },
    { code: '+43', text: 'AUT (+43)' },
    { code: '+994', text: 'AZE (+994)' },
    { code: '+973', text: 'BHR (+973)' },
    { code: '+880', text: 'BGD (+880)' },
    { code: '+375', text: 'BLR (+375)' },
    { code: '+32', text: 'BEL (+32)' },
    { code: '+501', text: 'BLZ (+501)' },
    { code: '+229', text: 'BEN (+229)' },
    { code: '+975', text: 'BTN (+975)' },
    { code: '+591', text: 'BOL (+591)' },
    { code: '+387', text: 'BIH (+387)' },
    { code: '+267', text: 'BWA (+267)' },
    { code: '+55', text: 'BRA (+55)' },
    { code: '+673', text: 'BRN (+673)' },
    { code: '+359', text: 'BGR (+359)' },
    { code: '+226', text: 'BFA (+226)' },
    { code: '+257', text: 'BDI (+257)' },
    { code: '+855', text: 'KHM (+855)' },
    { code: '+237', text: 'CMR (+237)' },
    { code: '+1', text: 'CAN (+1)' },
    { code: '+238', text: 'CPV (+238)' },
    { code: '+236', text: 'CAF (+236)' },
    { code: '+235', text: 'TCD (+235)' },
    { code: '+56', text: 'CHL (+56)' },
    { code: '+86', text: 'CHN (+86)' },
    { code: '+57', text: 'COL (+57)' },
    { code: '+269', text: 'COM (+269)' },
    { code: '+242', text: 'COG (+242)' },
    { code: '+243', text: 'COD (+243)' },
    { code: '+506', text: 'CRI (+506)' },
    { code: '+385', text: 'HRV (+385)' },
    { code: '+53', text: 'CUB (+53)' },
    { code: '+357', text: 'CYP (+357)' },
    { code: '+420', text: 'CZE (+420)' },
    { code: '+45', text: 'DNK (+45)' },
    { code: '+253', text: 'DJI (+253)' },
    { code: '+1', text: 'DOM (+1)' },
    { code: '+593', text: 'ECU (+593)' },
    { code: '+20', text: 'EGY (+20)' },
    { code: '+503', text: 'SLV (+503)' },
    { code: '+240', text: 'GNQ (+240)' },
    { code: '+291', text: 'ERI (+291)' },
    { code: '+372', text: 'EST (+372)' },
    { code: '+251', text: 'ETH (+251)' },
    { code: '+679', text: 'FJI (+679)' },
    { code: '+358', text: 'FIN (+358)' },
    { code: '+33', text: 'FRA (+33)' },
    { code: '+241', text: 'GAB (+241)' },
    { code: '+220', text: 'GMB (+220)' },
    { code: '+995', text: 'GEO (+995)' },
    { code: '+49', text: 'DEU (+49)' },
    { code: '+233', text: 'GHA (+233)' },
    { code: '+30', text: 'GRC (+30)' },
    { code: '+502', text: 'GTM (+502)' },
    { code: '+224', text: 'GIN (+224)' },
    { code: '+245', text: 'GNB (+245)' },
    { code: '+592', text: 'GUY (+592)' },
    { code: '+509', text: 'HTI (+509)' },
    { code: '+504', text: 'HND (+504)' },
    { code: '+36', text: 'HUN (+36)' },
    { code: '+354', text: 'ISL (+354)' },
    { code: '+91', text: 'IND (+91)' },
    { code: '+62', text: 'IDN (+62)' },
    { code: '+98', text: 'IRN (+98)' },
    { code: '+964', text: 'IRQ (+964)' },
    { code: '+353', text: 'IRL (+353)' },
    { code: '+972', text: 'ISR (+972)' },
    { code: '+39', text: 'ITA (+39)' },
    { code: '+1', text: 'JAM (+1)' },
    { code: '+81', text: 'JPN (+81)' },
    { code: '+962', text: 'JOR (+962)' },
    { code: '+7', text: 'KAZ (+7)' },
    { code: '+254', text: 'KEN (+254)' },
    { code: '+686', text: 'KIR (+686)' },
    { code: '+850', text: 'PRK (+850)' },
    { code: '+82', text: 'KOR (+82)' },
    { code: '+965', text: 'KWT (+965)' },
    { code: '+996', text: 'KGZ (+996)' },
    { code: '+856', text: 'LAO (+856)' },
    { code: '+371', text: 'LVA (+371)' },
    { code: '+961', text: 'LBN (+961)' },
    { code: '+266', text: 'LSO (+266)' },
    { code: '+231', text: 'LBR (+231)' },
    { code: '+218', text: 'LBY (+218)' },
    { code: '+423', text: 'LIE (+423)' },
    { code: '+370', text: 'LTU (+370)' },
    { code: '+352', text: 'LUX (+352)' },
    { code: '+261', text: 'MDG (+261)' },
    { code: '+265', text: 'MWI (+265)' },
    { code: '+60', text: 'MYS (+60)' },
    { code: '+960', text: 'MDV (+960)' },
    { code: '+223', text: 'MLI (+223)' },
    { code: '+356', text: 'MLT (+356)' },
    { code: '+692', text: 'MHL (+692)' },
    { code: '+222', text: 'MRT (+222)' },
    { code: '+230', text: 'MUS (+230)' },
    { code: '+52', text: 'MEX (+52)' },
    { code: '+691', text: 'FSM (+691)' },
    { code: '+373', text: 'MDA (+373)' },
    { code: '+377', text: 'MCO (+377)' },
    { code: '+976', text: 'MNG (+976)' },
    { code: '+382', text: 'MNE (+382)' },
    { code: '+212', text: 'MAR (+212)' },
    { code: '+258', text: 'MOZ (+258)' },
    { code: '+95', text: 'MMR (+95)' },
    { code: '+264', text: 'NAM (+264)' },
    { code: '+674', text: 'NRU (+674)' },
    { code: '+977', text: 'NPL (+977)' },
    { code: '+31', text: 'NLD (+31)' },
    { code: '+64', text: 'NZL (+64)' },
    { code: '+505', text: 'NIC (+505)' },
    { code: '+227', text: 'NER (+227)' },
    { code: '+234', text: 'NGA (+234)' },
    { code: '+47', text: 'NOR (+47)' },
    { code: '+968', text: 'OMN (+968)' },
    { code: '+92', text: 'PAK (+92)' },
    { code: '+680', text: 'PLW (+680)' },
    { code: '+507', text: 'PAN (+507)' },
    { code: '+675', text: 'PNG (+675)' },
    { code: '+595', text: 'PRY (+595)' },
    { code: '+51', text: 'PER (+51)' },
    { code: '+63', text: 'PHL (+63)' },
    { code: '+48', text: 'POL (+48)' },
    { code: '+351', text: 'PRT (+351)' },
    { code: '+974', text: 'QAT (+974)' },
    { code: '+40', text: 'ROU (+40)' },
    { code: '+7', text: 'RUS (+7)' },
    { code: '+250', text: 'RWA (+250)' },
    { code: '+1', text: 'KNA (+1)' },
    { code: '+1', text: 'LCA (+1)' },
    { code: '+1', text: 'VCT (+1)' },
    { code: '+685', text: 'WSM (+685)' },
    { code: '+378', text: 'SMR (+378)' },
    { code: '+239', text: 'STP (+239)' },
    { code: '+966', text: 'SAU (+966)' },
    { code: '+221', text: 'SEN (+221)' },
    { code: '+381', text: 'SRB (+381)' },
    { code: '+248', text: 'SYC (+248)' },
    { code: '+232', text: 'SLE (+232)' },
    { code: '+65', text: 'SGP (+65)' },
    { code: '+421', text: 'SVK (+421)' },
    { code: '+386', text: 'SVN (+386)' },
    { code: '+677', text: 'SLB (+677)' },
    { code: '+252', text: 'SOM (+252)' },
    { code: '+27', text: 'ZAF (+27)' },
    { code: '+211', text: 'SSD (+211)' },
    { code: '+34', text: 'ESP (+34)' },
    { code: '+94', text: 'LKA (+94)' },
    { code: '+249', text: 'SDN (+249)' },
    { code: '+597', text: 'SUR (+597)' },
    { code: '+268', text: 'SWZ (+268)' },
    { code: '+46', text: 'SWE (+46)' },
    { code: '+41', text: 'CHE (+41)' },
    { code: '+963', text: 'SYR (+963)' },
    { code: '+886', text: 'TWN (+886)' },
    { code: '+992', text: 'TJK (+992)' },
    { code: '+255', text: 'TZA (+255)' },
    { code: '+66', text: 'THA (+66)' },
    { code: '+670', text: 'TLS (+670)' },
    { code: '+228', text: 'TGO (+228)' },
    { code: '+676', text: 'TON (+676)' },
    { code: '+1', text: 'TTO (+1)' },
    { code: '+216', text: 'TUN (+216)' },
    { code: '+90', text: 'TUR (+90)' },
    { code: '+993', text: 'TKM (+993)' },
    { code: '+688', text: 'TUV (+688)' },
    { code: '+256', text: 'UGA (+256)' },
    { code: '+380', text: 'UKR (+380)' },
    { code: '+971', text: 'ARE (+971)' },
    { code: '+44', text: 'GBR (+44)' },
    { code: '+1', text: 'USA (+1)' },
    { code: '+598', text: 'URY (+598)' },
    { code: '+998', text: 'UZB (+998)' },
    { code: '+678', text: 'VUT (+678)' },
    { code: '+58', text: 'VEN (+58)' },
    { code: '+84', text: 'VNM (+84)' },
    { code: '+967', text: 'YEM (+967)' },
    { code: '+260', text: 'ZMB (+260)' },
    { code: '+263', text: 'ZWE (+263)' }
  ];
  passwordMode: 'password' | 'text' = 'password';
  passwordButtonOptions: any = {
    icon: 'eyeopen',
    stylingMode: 'text',
    onClick: () => {
      this.passwordMode = this.passwordMode === 'text' ? 'password' : 'text';
      this.passwordButtonOptions.icon = this.passwordMode === 'text' ? 'eyeclose' : 'eyeopen';
    }
  };

  securityPolicy: any = null;

  constructor(
    private masterReportService: MasterReportService,
    private systemServicesService: SystemServicesService
  ) {
    const today = new Date();
    this.maxDateOfBirth = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
  }

  ngOnInit(): void {
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
    DxSwitchModule
  ],
  declarations: [NewEmployeemasterComponent],
  exports: [NewEmployeemasterComponent],
})
export class NewEmployeemasterModule {}
