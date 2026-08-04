const fs = require('fs');

const files = [
  'src/app/pages/POP-UP_PAGES/new-employeemaster/new-employeemaster.component.html',
  'src/app/pages/POP-UP_PAGES/employeemaster-edit/employeemaster-edit.component.html',
  'src/app/pages/POP-UP_PAGES/user-new-form/user-new-form.component.html',
  'src/app/pages/POP-UP_PAGES/user-edit-form/user-edit-form.component.html'
];

for (const file of files) {
  if (!fs.existsSync(file)) continue;
  let content = fs.readFileSync(file, 'utf8');

  // We want to fix the width and the fieldTemplate.
  // The inner dx-text-box in the fieldTemplate has too much padding, which cuts off the text because width is 90px.
  // Also, we can increase width="90px" to width="105px" or "110px".
  content = content.replace(/width="90px"/g, 'width="110px"');
  content = content.replace(/width="100px"/g, 'width="110px"'); // if any were 100px

  // Let's also simplify the fieldTemplate to a raw input to match dx-select-box styling and keep it clean, 
  // or just use a span for the text. DevExtreme recommends using dx-text-box for searchEnabled.
  // We can add CSS to remove padding from the dx-text-box.
  content = content.replace(/<dx-text-box \[value\]="data \? data\.text : ''" \[readOnly\]="true" style="flex: 1; border: none; background: transparent;"><\/dx-text-box>/g, 
    `<dx-text-box [value]="data ? data.text : ''" [readOnly]="true" class="custom-select-box-input" style="flex: 1; border: none; background: transparent;"></dx-text-box>`);
  
  // Actually, standard dx-text-box inside fieldTemplate is fine, but we need to override padding.
  // Wait, let's just make the text a <span> instead, it will display the selected value perfectly. 
  // If search is enabled, DevExtreme handles the hidden input automatically when using standard fieldTemplate unless we break it. 
  // Wait, standard field template WITH search enabled:
  content = content.replace(
    /<div \*dxTemplate="let data of 'fieldTemplate'"[^>]*>[\s\S]*?<\/div>/g,
    `<div *dxTemplate="let data of 'fieldTemplate'" style="display: flex; align-items: center; padding-left: 10px; height: 100%;">
            <img *ngIf="data" [src]="data.flagUrl" style="width: 20px; margin-right: 5px;" />
            <dx-text-box [value]="data ? data.text : ''" [readOnly]="true" style="flex: 1; border: none; background: transparent; box-shadow: none; padding: 0;"></dx-text-box>
          </div>`
  );

  fs.writeFileSync(file, content);
  console.log('Updated HTML:', file);
}
