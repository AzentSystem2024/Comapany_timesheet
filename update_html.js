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

  // Replace dx-select-box for MobileCountryCode and WhatsappCountryCode
  // Add itemTemplate="itemTemplate" and fieldTemplate="fieldTemplate"
  content = content.replace(/<dx-select-box([^>]*)\[items\]="countryCodes"([^>]*)><\/dx-select-box>/g, (match, p1, p2) => {
    if (match.includes('itemTemplate')) return match;
    return `<dx-select-box${p1}[items]="countryCodes"${p2} fieldTemplate="fieldTemplate" itemTemplate="itemTemplate">
          <div *dxTemplate="let data of 'fieldTemplate'" style="display: flex; align-items: center;">
            <img *ngIf="data" [src]="data.flagUrl" style="width: 20px; margin-left: 10px; margin-right: 5px;" />
            <dx-text-box [value]="data ? data.text : ''" [readOnly]="true" style="flex: 1; border: none; background: transparent;"></dx-text-box>
          </div>
          <div *dxTemplate="let data of 'itemTemplate'" style="display: flex; align-items: center;">
            <img [src]="data.flagUrl" style="width: 20px; margin-right: 8px;" />
            <span>{{ data.text }}</span>
          </div>
        </dx-select-box>`;
  });

  fs.writeFileSync(file, content);
  console.log('Updated HTML:', file);
}
