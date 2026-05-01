import os, re

base = '/Users/alfredocastillo/Documents/GitHub/autosys/frontend/modules/workshop'

fixed_count = 0

for root, dirs, files in os.walk(base):
    for f in files:
        if not (f.endswith('.ts') or f.endswith('.tsx')):
            continue
        path = os.path.join(root, f)
        with open(path, 'r') as file:
            content = file.read()
        
        original = content
        
        # Remove empty imports from shared/interfaces
        content = re.sub(r"import\s+type\s*\{\s*\}\s*from\s+['\"]@/modules/workshop/shared/interfaces['\"];\s*\n?", "", content)
        content = re.sub(r"import\s+\{\s*\}\s*from\s+['\"]@/modules/workshop/shared/interfaces['\"];\s*\n?", "", content)
        
        # Remove imports with only semicolons (broken by previous script)
        content = re.sub(r"import\s+type\s*\{[^}]*\}\s*from\s+['\"]@/modules/workshop/shared/interfaces['\"];+", "", content)
        content = re.sub(r"import\s+\{[^}]*\}\s*from\s+['\"]@/modules/workshop/shared/interfaces['\"];+", "", content)
        
        if content != original:
            with open(path, 'w') as file:
                file.write(content)
            fixed_count += 1

print(f'Fixed {fixed_count} files')
