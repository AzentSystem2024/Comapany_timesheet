const fs = require('fs');
const tsFile = 'C:/Users/HP/OneDrive/Desktop/Renazent/Time Sheet App/Devextreme_Clean_template_File/src/app/pages/POP-UP_PAGES/new-employeemaster/new-employeemaster.component.ts';
const content = fs.readFileSync(tsFile, 'utf8');

// Extract the array directly
const match = content.match(/countryCodes\s*=\s*(\[\s*\{[\s\S]*?\}\s*\]);/s);
if(!match) { console.log('Not found'); process.exit(1); }

// Evaluate it to an array
const arr = eval(match[1]);

const csObjects = arr.map(i => {
  return `            new CountryModel { code = "${i.code}", text = "${i.text}", flagUrl = "${i.flagUrl}" },`;
}).join('\n');

const csCode = `using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;

namespace Timesheet_API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CountryController : ControllerBase
    {
        public class CountryModel
        {
            public string code { get; set; }
            public string text { get; set; }
            public string flagUrl { get; set; }
        }

        [HttpPost("list")]
        public ActionResult<IEnumerable<CountryModel>> GetCountryWithFlags()
        {
            var countries = new List<CountryModel>
            {
${csObjects}
            };
            return Ok(countries);
        }
    }
}
`;

fs.writeFileSync('C:/Users/HP/source/repos/Timesheet-API/Controllers/CountryController.cs', csCode);
console.log('Created CountryController.cs');
