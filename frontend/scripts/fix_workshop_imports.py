import os, re

base = '/Users/alfredocastillo/Documents/GitHub/autosys/frontend/modules/workshop'

service_default_fixes = {
    'additionalService': 'additionals',
    'appointmentService': 'appointments',
    'attachmentService': 'attachments',
    'auditLogService': 'auditLogs',
    'billingBridgeService': 'billingBridge',
    'catalogSearchService': 'catalogSearch',
    'checklistService': 'checklists',
    'dashboardService': 'dashboard',
    'deliveryService': 'deliveries',
    'diagnosisService': 'diagnoses',
    'garitaService': 'garita',
    'ingressMotiveService': 'ingressMotives',
    'laborTimeService': 'laborTimes',
    'materialService': 'materials',
    'workshopOperationService': 'operations',
    'planningService': 'planning',
    'qualityCheckService': 'qualityChecks',
    'quotationService': 'quotations',
    'receptionMediaService': 'receptionMedia',
    'receptionService': 'receptions',
    'reportService': 'reports',
    'reworkService': 'reworks',
    'serviceOrderService': 'serviceOrders',
    'serviceTypeService': 'serviceTypes',
    'workshopShiftService': 'shifts',
    'technicianSpecialtyService': 'technicianSpecialties',
    'totService': 'tot',
    'vehicleHistoryService': 'vehicleHistory',
    'warrantyService': 'warranties',
    'workshopBayService': 'workshopBays',
}

zod_map = {
    'additionals': 'additionalZod.ts',
    'appointments': 'appointmentZod.ts',
    'checklists': 'checklistZod.ts',
    'deliveries': 'deliveryZod.ts',
    'diagnoses': 'diagnosisZod.ts',
    'garita': 'garitaZod.ts',
    'ingressMotives': 'ingressMotiveZod.ts',
    'laborTimes': 'laborTimeZod.ts',
    'materials': 'materialZod.ts',
    'operations': 'workshopOperationZod.ts',
    'qualityChecks': 'qualityCheckZod.ts',
    'quotations': 'quotationZod.ts',
    'receptions': 'receptionZod.ts',
    'reworks': 'reworkZod.ts',
    'serviceOrders': 'serviceOrderZod.ts',
    'serviceTypes': 'serviceTypeZod.ts',
    'shifts': 'workshopShiftZod.ts',
    'technicianSpecialties': 'technicianSpecialtyZod.ts',
    'tot': 'totZod.ts',
    'warranties': 'warrantyZod.ts',
    'workshopBays': 'workshopBayZod.ts',
}

fixed_count = 0

for root, dirs, files in os.walk(base):
    for f in files:
        if not (f.endswith('.ts') or f.endswith('.tsx')):
            continue
        path = os.path.join(root, f)
        with open(path, 'r') as file:
            content = file.read()
        
        original = content
        
        # Fix ../apiClient
        content = content.replace("from '../apiClient'", "from '@/app/api/apiClient'")
        
        # Fix ./shared.interface
        content = content.replace("from './shared.interface'", "from '@/modules/workshop/shared/interfaces/shared.interface'")
        
        # Fix @/libs/zods/workshop
        if '@/libs/zods/workshop' in content:
            parts = root.split('/')
            module_name = parts[-2] if parts[-1] in ['components', 'services', 'interfaces', 'schemas', 'utils'] else parts[-1]
            if module_name in zod_map:
                content = content.replace('@/libs/zods/workshop', f'../schemas/{zod_map[module_name]}')
        
        # Fix @/app/api/workshop/*Service
        content = re.sub(
            r"from ['\"]@/app/api/workshop/(\w+)Service['\"]",
            lambda m: f"from '@/modules/workshop/{m.group(1)}s/services/{m.group(1)}Service'",
            content
        )
        
        # Fix service default exports
        for svc_name, svc_module in service_default_fixes.items():
            pattern = rf"import \{{\s*{svc_name}\s*\}} from ['\"]@/modules/workshop/{svc_module}/services/{svc_name}['\"]"
            replacement = f"import {svc_name} from '@/modules/workshop/{svc_module}/services/{svc_name}'"
            content = re.sub(pattern, replacement, content)
        
        if content != original:
            with open(path, 'w') as file:
                file.write(content)
            fixed_count += 1

print(f'Fixed {fixed_count} files')
