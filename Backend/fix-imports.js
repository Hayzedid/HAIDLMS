const fs = require('fs');
const path = require('path');
const routesDir = path.join(process.cwd(), 'services', 'course-service', 'src', 'routes');
const files = fs.readdirSync(routesDir).filter(f => f.endsWith('.ts'));

files.forEach(file => {
  const filePath = path.join(routesDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  if (content.includes('middlewares/auth.middleware') || content.includes('middlewares/role.middleware')) {
    content = content.replace(/import \{ authenticate \} from '\.\.\/middlewares\/auth\.middleware';\n?/, '');
    content = content.replace(/import \{ authorizeRoles \} from '\.\.\/middlewares\/role\.middleware';\n?/, '');
    
    // Add the new import at the top
    const newImport = "import { authenticate, authorize } from '../middleware/authenticate';\n";
    content = content.replace(/import \{ Router \} from 'express';\n/, `import { Router } from 'express';\n${newImport}`);
    
    // Replace authorizeRoles with authorize
    content = content.replace(/authorizeRoles/g, 'authorize');
    
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(filePath, content);
    console.log('Fixed', file);
  }
});
