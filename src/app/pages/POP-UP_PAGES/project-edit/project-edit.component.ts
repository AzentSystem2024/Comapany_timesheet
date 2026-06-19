import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, NgModule, OnChanges, Output, SimpleChanges, ViewChild } from '@angular/core';
import {
  DxCheckBoxModule,
  DxTextBoxModule,
  DxValidatorModule,
  DxButtonModule,
  DxValidationGroupModule,
  DxValidationGroupComponent
} from 'devextreme-angular';
import notify from 'devextreme/ui/notify';

@Component({
  selector: 'app-project-edit',
  templateUrl: './project-edit.component.html',
  styleUrl: './project-edit.component.scss',
})
export class ProjectEditComponent implements OnChanges {
  @ViewChild('validationGroup', { static: true }) validationGroup!: DxValidationGroupComponent;
  @Input() formdata: any;
  @Output() closeForm = new EventEmitter();

  newProjectData: any = {};

  ngOnChanges(changes: SimpleChanges) {
    if (changes['formdata'] && changes['formdata'].currentValue) {
      this.newProjectData = { ...this.formdata };
    }
  }

  onSaveClick() {
    const validationResult = this.validationGroup.instance.validate();
    if (!validationResult.isValid) return;

    let storedData = JSON.parse(localStorage.getItem('ProjectMasterData') || '[]');
    const index = storedData.findIndex((item: any) => 
      (item.ProjectID || item.ID) === (this.newProjectData.ProjectID || this.newProjectData.ID)
    );
    
    if (index !== -1) {
      storedData[index] = { ...this.newProjectData };
      localStorage.setItem('ProjectMasterData', JSON.stringify(storedData));
      notify(
        { message: 'data updated successfully', position: { at: 'top right', my: 'top right' }, displayTime: 500 },
        'success'
      );
      this.close();
    } else {
      notify(
        { message: 'Project not found', position: { at: 'top right', my: 'top right' }, displayTime: 500 },
        'error'
      );
    }
  }

  close() {
    this.closeForm.emit();
  }
}

@NgModule({
  imports: [
    CommonModule,
    DxCheckBoxModule,
    DxTextBoxModule,
    DxValidatorModule,
    DxButtonModule,
    DxValidationGroupModule
  ],
  declarations: [ProjectEditComponent],
  exports: [ProjectEditComponent],
})
export class ProjectEditModule {}
