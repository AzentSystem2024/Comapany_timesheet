import { Component, ViewEncapsulation, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-report-designer',
  templateUrl: './report-designer.component.html',
  styleUrls: ['./report-designer.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class ReportDesignerComponent implements OnInit {
  getDesignerModelAction = '/api/CustomReportDesigner/GetReportDesignerModel';
  reportUrl = '';
  hostUrl = environment.apiHost;

  constructor(private route: ActivatedRoute) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['reportUrl']) {
        this.reportUrl = params['reportUrl'];
      }
    });
  }

  onReportSaved(e: any) {
    if (e && e.Url) {
      this.reportUrl = e.Url;
    }
  }
}
