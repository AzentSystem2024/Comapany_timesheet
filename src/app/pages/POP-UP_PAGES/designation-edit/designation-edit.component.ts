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

@Component({
  selector: 'app-designation-edit',
  templateUrl: './designation-edit.component.html',
  styleUrl: './designation-edit.component.scss',
})
export class DesignationEditComponent implements OnChanges {
  @ViewChild('validationGroup', { static: true }) validationGroup!: DxValidationGroupComponent;
  @Input() formdata: any;
  @Output() closeForm = new EventEmitter();

  newDesignationData: any = {};

  ngOnChanges(changes: SimpleChanges) {
    if (changes['formdata'] && changes['formdata'].currentValue) {
      this.newDesignationData = { ...this.formdata };
    }
  }

  onSaveClick() {
    const validationResult = this.validationGroup.instance.validate();
    if (!validationResult.isValid) return;

    let storedData = JSON.parse(localStorage.getItem('DesignationMasterData') || '[]');
    const index = storedData.findIndex((item: any) => 
      (item.DesignationID || item.ID) === (this.newDesignationData.DesignationID || this.newDesignationData.ID)
    );
    
    if (index !== -1) {
      storedData[index] = { ...this.newDesignationData };
      localStorage.setItem('DesignationMasterData', JSON.stringify(storedData));
      notify(
        { message: 'data updated successfully', position: { at: 'top right', my: 'top right' }, displayTime: 500 },
        'success'
      );
      this.close();
    } else {
      notify(
        { message: 'Designation not found', position: { at: 'top right', my: 'top right' }, displayTime: 500 },
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
    DxTextBoxModule,
    DxValidatorModule,
    DxButtonModule,
    DxValidationGroupModule
  ],
  declarations: [DesignationEditComponent],
  exports: [DesignationEditComponent],
})
export class DesignationEditModule {}