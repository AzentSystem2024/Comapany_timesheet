const fs = require('fs');

const files = [
  'src/app/pages/POP-UP_PAGES/new-employeemaster/new-employeemaster.component.ts',
  'src/app/pages/POP-UP_PAGES/employeemaster-edit/employeemaster-edit.component.ts',
  'src/app/pages/POP-UP_PAGES/user-new-form/user-new-form.component.ts',
  'src/app/pages/POP-UP_PAGES/user-edit-form/user-edit-form.component.ts'
];

for (const file of files) {
  if (!fs.existsSync(file)) continue;
  let content = fs.readFileSync(file, 'utf8');

  // Replace `text: 'IND (+91)'` with `text: '+91'`
  content = content.replace(/text:\s*'[A-Z]{3}\s*\((.*?)\)'/g, "text: '$1'");

  fs.writeFileSync(file, content);
  console.log('Updated TS:', file);
}
