import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, NgModule, OnChanges, Output, SimpleChanges, ViewChild } from '@angular/core';
import {
  DxTextBoxModule,
  DxValidatorModule,
  DxButtonModule,
  DxValidationGroupModule,
  DxValidationGroupComponent
} from 'devextreme-angular';
import notify from 'devextreme/ui/notify';
import { MasterReportService } from '../../MASTER PAGES/master-report.service';

@Component({
  selector: 'app-designation-edit',
  templateUrl: './designation-edit.component.html',
  styleUrls: ['./designation-edit.component.scss'],
})
export class DesignationEditComponent implements OnChanges {
  @ViewChild('validationGroup', { static: true }) validationGroup!: DxValidationGroupComponent;
  @Input() formdata: any;
  @Output() closeForm = new EventEmitter();

  newDesignationData: any = {};

  constructor(private service: MasterReportService) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['formdata'] && changes['formdata'].currentValue) {
      this.newDesignationData = { ...this.formdata };
    }
  }

  onSaveClick() {
    const validationResult = this.validationGroup.instance.validate();
    if (!validationResult.isValid) return;

    this.service.update_Designation_Data(this.newDesignationData).subscribe({
      next: (res: any) => {
        if(res.flag == "1") {
          notify(
            { message: 'data updated successfully', position: { at: 'top right', my: 'top right' }, displayTime: 500 },
            'success'
          );
          this.close();
        } else {
          notify(
            { message: res.message || 'Failed to update', position: { at: 'top right', my: 'top right' }, displayTime: 500 },
            'error'
          );
        }
      },
      error: (err: any) => {
        notify(
          { message: 'Server error', position: { at: 'top right', my: 'top right' }, displayTime: 500 },
          'error'
        );
      }
    });
  }

  close() {
    this.closeForm.emit();
  }
}

@NgModule({
  imports: [
    CommonModule,
    DxTextBoxModule,
    DxValidatorModule,
    DxButtonModule,
    DxValidationGroupModule
  ],
  declarations: [DesignationEditComponent],
  exports: [DesignationEditComponent],
})
export class DesignationEditModule {}