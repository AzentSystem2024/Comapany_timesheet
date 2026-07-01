import { CommonModule } from '@angular/common';
import { Component, NgModule } from '@angular/core';
import {
  DxCheckBoxModule,
  DxDateBoxModule,
  DxNumberBoxModule,
  DxSelectBoxModule,
  DxTextAreaModule,
  DxTextBoxModule,
  DxValidatorModule,
} from 'devextreme-angular';

@Component({
  selector: 'app-designation-new-form',
  templateUrl: './designation-new-form.component.html',
  styleUrls: ['./designation-new-form.component.scss'],
})
export class DesignationNewFormComponent {
  private defaultDesignationData = {
    Designation: '',
  };

  newDesignationData: any = { ...this.defaultDesignationData };

  getNewDesignationData = () => ({ ...this.newDesignationData });

  clearData() {
    this.newDesignationData = { ...this.defaultDesignationData };
  }
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
  ],
  declarations: [DesignationNewFormComponent],
  exports: [DesignationNewFormComponent],
})
export class DesignationNewFormModule {}
