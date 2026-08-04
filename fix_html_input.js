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

  // Replace dx-text-box with a raw input tag that has the dx-texteditor-input class required by DevExtreme fieldTemplate
  content = content.replace(/<dx-text-box \[value\]="data \? data\.text : ''" \[readOnly\]="true"[^>]*><\/dx-text-box>/g, 
    `<input class="dx-texteditor-input" type="text" [value]="data ? data.text : ''" readonly style="flex: 1; border: none; background: transparent; outline: none; padding: 0;" />`);

  fs.writeFileSync(file, content);
  console.log('Updated HTML:', file);
}
