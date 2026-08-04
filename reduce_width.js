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

  content = content.replace(/width="110px"/g, 'width="90px"');

  content = content.replace(/padding-left: 10px;/g, 'padding-left: 5px;');
  
  content = content.replace(/margin-right: 5px;/g, 'margin-right: 4px;');

  fs.writeFileSync(file, content);
  console.log('Updated HTML:', file);
}
