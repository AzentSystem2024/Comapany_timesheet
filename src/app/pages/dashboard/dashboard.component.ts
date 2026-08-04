import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { DxButtonModule, DxPopupModule, DxTextBoxModule, DxDropDownButtonModule } from 'devextreme-angular';
import { confirm, alert } from 'devextreme/ui/dialog';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, HttpClientModule, DxButtonModule, DxPopupModule, DxTextBoxModule, DxDropDownButtonModule],
  template: `
    <div class="dashboard-container">
      <header class="dashboard-header">
        <div class="header-content">
          <h1>Report Templates</h1>
          <dx-button 
            text="Create New Template" 
            type="default" 
            icon="plus" 
            (onClick)="showPopup()">
          </dx-button>
        </div>
      </header>

      <main class="dashboard-main">
        <div class="loading-state" *ngIf="loading">
          <div class="spinner"></div>
          <p>Loading your templates...</p>
        </div>

        <div class="empty-state" *ngIf="!loading && reports.length === 0">
          <div class="empty-icon">📁</div>
          <h2>No templates found</h2>
          <p>You haven't created any report templates yet.</p>
          <dx-button 
            text="Create Your First Template" 
            type="default" 
            (onClick)="showPopup()">
          </dx-button>
        </div>

        <div class="reports-grid" *ngIf="!loading && reports.length > 0">
          <div class="report-card" *ngFor="let report of reports">
            <div class="card-header">
              <div class="card-icon">📄</div>
              <h3 class="report-title">{{ report }}</h3>
            </div>
            <div class="card-actions">
              <dx-button hint="Design" icon="edit" (onClick)="designReport(report)"></dx-button>
              <dx-button hint="View" icon="find" stylingMode="outlined" (onClick)="viewReport(report)"></dx-button>
              <dx-button hint="Delete" icon="trash" type="danger" stylingMode="outlined" (onClick)="deleteReport(report)"></dx-button>
              <dx-drop-down-button 
                hint="More Actions"
                icon="more" 
                stylingMode="outlined"
                [showArrowIcon]="false"
                [dropDownOptions]="{ width: 180 }"
                [items]="[{ id: 'pdf', text: 'Download PDF', icon: 'download' }]"
                (onItemClick)="onMoreItemClick($event, report)">
                <div *dxTemplate="let data of 'item'" style="display: flex; align-items: center; padding: 5px;">
                  <i class="dx-icon-{{data.icon}}" style="margin-right: 8px;"></i>
                  <span>{{data.text}}</span>
                </div>
              </dx-drop-down-button>
            </div>
          </div>
        </div>
      </main>
      
      <!-- Export PDF Popup -->
      <dx-popup
        [width]="400"
        height="auto"
        [showTitle]="true"
        title="Export to PDF"
        [dragEnabled]="false"
        [hideOnOutsideClick]="true"
        [(visible)]="exportPopupVisible">
        
        <div *dxTemplate="let data of 'content'">
          <div class="popup-content">
            <p>Enter Sale ID to export:</p>
            <dx-text-box 
              [(value)]="exportSaleId" 
              placeholder="e.g. 1001"
              (onEnterKey)="executeExport()">
            </dx-text-box>
            <div class="popup-actions">
              <dx-button text="Cancel" stylingMode="text" (onClick)="exportPopupVisible = false"></dx-button>
              <dx-button text="Download" type="default" icon="download" (onClick)="executeExport()"></dx-button>
            </div>
          </div>
        </div>
      </dx-popup>

    </div>
  `,
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  reports: string[] = [];
  loading = true;

  exportPopupVisible = false;
  exportReportName = '';
  exportSaleId = '';

  constructor(private http: HttpClient, private router: Router) { }

  ngOnInit() {
    this.loadReports();
  }

  loadReports() {
    this.loading = true;
    this.http.get<string[]>(`${environment.apiHost}/api/Reports`).subscribe({
      next: (data) => {
        this.reports = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load reports', err);
        this.loading = false;
      }
    });
  }

  showPopup() {
    // Navigate directly to designer without a name to trigger the native DevExpress Save As workflow
    this.router.navigate(['/report-designer']);
  }

  designReport(reportName: string) {
    this.router.navigate(['/report-designer'], { queryParams: { reportUrl: reportName } });
  }

  viewReport(reportName: string) {
    this.router.navigate(['/report-viewer', reportName]);
  }

  showExportPopup(name: string) {
    this.exportReportName = name;
    this.exportSaleId = '';
    this.exportPopupVisible = true;
  }

  onMoreItemClick(e: any, reportName: string) {
    if (e.itemData.id === 'pdf') {
      this.showExportPopup(reportName);
    }
  }

  executeExport() {
    if (this.exportSaleId && this.exportSaleId.trim()) {
      this.exportPopupVisible = false;
      // Trigger a native browser download pointing to our new backend API!
      const exportUrl = `${environment.apiHost}/api/Reports/${this.exportReportName}/export?saleId=${this.exportSaleId.trim()}`;
      window.open(exportUrl, '_blank');
    }
  }

  deleteReport(name: string) {
    const dialogResult = confirm(`Are you sure you want to completely delete the report '${name}'? This cannot be undone.`, 'Confirm Deletion');

    dialogResult.then((dialogRes) => {
      if (dialogRes) {
        this.http.delete(`${environment.apiHost}/api/Reports/${name}`).subscribe({
          next: () => {
            this.loadReports();
          },
          error: (err) => {
            console.error('Failed to delete report', err);
            alert('Failed to delete report. Check console for details.', 'Error');
          }
        });
      }
    });
  }
}
