import os, re

base = '/Users/alfredocastillo/Documents/GitHub/autosys/frontend/modules/workshop'

# Fix .ts extension in imports
for root, dirs, files in os.walk(base):
    for f in files:
        if not (f.endswith('.ts') or f.endswith('.tsx')):
            continue
        path = os.path.join(root, f)
        with open(path, 'r') as file:
            content = file.read()
        
        original = content
        # Remove .ts extension from relative imports like ../interfaces/file.ts
        content = re.sub(r"from ['\"](\.[^'\"]+)\.ts['\"]", r"from '\1'", content)
        
        if content != original:
            with open(path, 'w') as file:
                file.write(content)

print('Fixed .ts extensions')
