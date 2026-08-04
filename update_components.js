const fs = require('fs');

function processEmployeeFile(file) {
  let content = fs.readFileSync(file, 'utf8');
  
  // Replace countryCodes array
  content = content.replace(/countryCodes\s*=\s*\[\s*\{[\s\S]*?\}\s*\];/s, 'countryCodes: any[] = [];');
  
  // Add API call to ngOnInit
  if(!content.includes('this.systemServicesService.getCountryWithFlags()')) {
    content = content.replace(/ngOnInit\(\)(?:\s*:\s*void)?\s*\{/, 
      `ngOnInit(): void {\n    this.systemServicesService.getCountryWithFlags().subscribe((res: any) => {\n      this.countryCodes = res;\n    });`);
  }
  
  fs.writeFileSync(file, content);
  console.log('Updated ' + file);
}

function processUserFile(file) {
  let content = fs.readFileSync(file, 'utf8');
  
  // Replace countryCodes array
  content = content.replace(/countryCodes\s*=\s*\[\s*\{[\s\S]*?\}\s*\];/s, 'countryCodes: any[] = [];');
  
  // Add import
  if(!content.includes('SystemServicesService')) {
    content = content.replace(/import \{.*?\} from '@angular\/core';/s, `$& \nimport { SystemServicesService } from '../../SYSTEM PAGES/system-services.service';`);
    
    // Add to constructor
    content = content.replace(/constructor\s*\(\s*/, `constructor(\n    private systemServicesService: SystemServicesService, \n    `);
  }

  // Add API call to ngOnInit
  if(!content.includes('this.systemServicesService.getCountryWithFlags()')) {
    content = content.replace(/ngOnInit\(\)(?:\s*:\s*void)?\s*\{/, 
      `ngOnInit(): void {\n    this.systemServicesService.getCountryWithFlags().subscribe((res: any) => {\n      this.countryCodes = res;\n    });`);
  }
  
  fs.writeFileSync(file, content);
  console.log('Updated ' + file);
}

processEmployeeFile('C:/Users/HP/OneDrive/Desktop/Renazent/Time Sheet App/Devextreme_Clean_template_File/src/app/pages/POP-UP_PAGES/new-employeemaster/new-employeemaster.component.ts');
processEmployeeFile('C:/Users/HP/OneDrive/Desktop/Renazent/Time Sheet App/Devextreme_Clean_template_File/src/app/pages/POP-UP_PAGES/employeemaster-edit/employeemaster-edit.component.ts');

processUserFile('C:/Users/HP/OneDrive/Desktop/Renazent/Time Sheet App/Devextreme_Clean_template_File/src/app/pages/POP-UP_PAGES/user-new-form/user-new-form.component.ts');
processUserFile('C:/Users/HP/OneDrive/Desktop/Renazent/Time Sheet App/Devextreme_Clean_template_File/src/app/pages/POP-UP_PAGES/user-edit-form/user-edit-form.component.ts');
