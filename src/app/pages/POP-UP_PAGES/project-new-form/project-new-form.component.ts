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
  selector: 'app-project-new-form',
  templateUrl: './project-new-form.component.html',
  styleUrl: './project-new-form.component.scss',
})
export class ProjectNewFormComponent {
  private defaultProjectData = {
    ProjectCode: '',
    ProjectName: '',
    IsInactive: false,
  };

  newProjectData: any = { ...this.defaultProjectData };

  getNewProjectData = () => ({ ...this.newProjectData });

  clearData() {
    this.newProjectData = { ...this.defaultProjectData };
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
  declarations: [ProjectNewFormComponent],
  exports: [ProjectNewFormComponent],
})
export class ProjectNewFormModule {}
