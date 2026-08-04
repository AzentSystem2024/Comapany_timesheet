import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DxReportViewerModule } from 'devexpress-reporting-angular';
import { DxButtonModule } from 'devextreme-angular';
import { environment } from '../../../environments/environment';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-viewer',
  standalone: true,
  imports: [CommonModule, DxReportViewerModule, DxButtonModule],
  template: `
    <div class="viewer-container">
      <header class="viewer-header">
        <dx-button 
          icon="back" 
          text="Back to Dashboard" 
          stylingMode="text" 
          (onClick)="goBack()">
        </dx-button>
        <h2>Viewing: {{ reportUrl }}</h2>
      </header>
      
      <div class="viewer-body">
        <dx-report-viewer
          [reportUrl]="reportUrl"
          height="calc(100vh - 60px)">
          <dxrv-request-options
            [host]="apiHost"
            invokeAction="/api/CustomDocumentViewer/Invoke">
          </dxrv-request-options>
        </dx-report-viewer>
      </div>
    </div>
  `,
  styleUrls: ['./viewer.component.scss']
})
export class ViewerComponent implements OnInit {
  reportUrl = '';
  apiHost = environment.apiHost;

  constructor(private route: ActivatedRoute, private router: Router) { }

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const name = params.get('reportName');
      if (name) {
        this.reportUrl = name;
      }
    });
  }

  goBack() {
    this.router.navigate(['/report-dashboard']);
  }
}