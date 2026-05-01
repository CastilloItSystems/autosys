import os, re

base = '/Users/alfredocastillo/Documents/GitHub/autosys/frontend'

type_to_path = {
    'ServiceOrder': '@/modules/workshop/serviceOrders/interfaces/serviceOrder.interface',
    'ServiceOrderStatus': '@/modules/workshop/serviceOrders/interfaces/serviceOrder.interface',
    'ServiceOrderItem': '@/modules/workshop/serviceOrders/interfaces/serviceOrder.interface',
    'ServiceOrderFilters': '@/modules/workshop/serviceOrders/interfaces/serviceOrder.interface',
    'VehicleReception': '@/modules/workshop/receptions/interfaces/reception.interface',
    'ReceptionStatus': '@/modules/workshop/receptions/interfaces/reception.interface',
    'Diagnosis': '@/modules/workshop/diagnoses/interfaces/diagnosis.interface',
    'DiagnosisStatus': '@/modules/workshop/diagnoses/interfaces/diagnosis.interface',
    'ChecklistTemplate': '@/modules/workshop/checklists/interfaces/checklist.interface',
    'ChecklistCategory': '@/modules/workshop/checklists/interfaces/checklist.interface',
    'ChecklistItem': '@/modules/workshop/checklists/interfaces/checklist.interface',
    'ChecklistTemplateFilters': '@/modules/workshop/checklists/interfaces/checklist.interface',
    'CreateChecklistTemplateInput': '@/modules/workshop/checklists/interfaces/checklist.interface',
    'UpdateChecklistTemplateInput': '@/modules/workshop/checklists/interfaces/checklist.interface',
    'ServiceAppointment': '@/modules/workshop/appointments/interfaces/appointment.interface',
    'AppointmentStatus': '@/modules/workshop/appointments/interfaces/appointment.interface',
    'WorkshopQuotation': '@/modules/workshop/quotations/interfaces/quotation.interface',
    'QuotationStatus': '@/modules/workshop/quotations/interfaces/quotation.interface',
    'ApprovalType': '@/modules/workshop/quotations/interfaces/quotation.interface',
    'WorkshopOperation': '@/modules/workshop/operations/interfaces/workshopOperation.interface',
    'OperationStatus': '@/modules/workshop/operations/interfaces/workshopOperation.interface',
    'OperationDifficulty': '@/modules/workshop/operations/interfaces/workshopOperation.interface',
    'QualityCheck': '@/modules/workshop/qualityChecks/interfaces/qualityCheck.interface',
    'QualityCheckStatus': '@/modules/workshop/qualityChecks/interfaces/qualityCheck.interface',
    'GaritaEvent': '@/modules/workshop/garita/interfaces/garita.interface',
    'GaritaEventType': '@/modules/workshop/garita/interfaces/garita.interface',
    'ServiceType': '@/modules/workshop/serviceTypes/interfaces/serviceType.interface',
    'ServiceTypeFilters': '@/modules/workshop/serviceTypes/interfaces/serviceType.interface',
    'WorkshopShift': '@/modules/workshop/shifts/interfaces/workshopShift.interface',
    'WorkshopShiftFilters': '@/modules/workshop/shifts/interfaces/workshopShift.interface',
    'CreateWorkshopShiftInput': '@/modules/workshop/shifts/interfaces/workshopShift.interface',
    'UpdateWorkshopShiftInput': '@/modules/workshop/shifts/interfaces/workshopShift.interface',
    'WorkshopTOT': '@/modules/workshop/tot/interfaces/tot.interface',
    'TOTStatus': '@/modules/workshop/tot/interfaces/tot.interface',
    'TOTDocumentType': '@/modules/workshop/tot/interfaces/tot.interface',
    'TOTFilters': '@/modules/workshop/tot/interfaces/tot.interface',
    'CreateTOTInput': '@/modules/workshop/tot/interfaces/tot.interface',
    'UpdateTOTInput': '@/modules/workshop/tot/interfaces/tot.interface',
    'AddTOTDocumentInput': '@/modules/workshop/tot/interfaces/tot.interface',
    'WorkshopWarranty': '@/modules/workshop/warranties/interfaces/warranty.interface',
    'WarrantyStatus': '@/modules/workshop/warranties/interfaces/warranty.interface',
    'WarrantyFilters': '@/modules/workshop/warranties/interfaces/warranty.interface',
    'CreateWarrantyInput': '@/modules/workshop/warranties/interfaces/warranty.interface',
    'UpdateWarrantyInput': '@/modules/workshop/warranties/interfaces/warranty.interface',
    'WorkshopBay': '@/modules/workshop/workshopBays/interfaces/workshopBay.interface',
    'WorkshopBayFilters': '@/modules/workshop/workshopBays/interfaces/workshopBay.interface',
    'CreateWorkshopBayInput': '@/modules/workshop/workshopBays/interfaces/workshopBay.interface',
    'UpdateWorkshopBayInput': '@/modules/workshop/workshopBays/interfaces/workshopBay.interface',
    'VehicleHistoryData': '@/modules/workshop/vehicleHistory/interfaces/vehicleHistory.interface',
    'ServiceOrderAdditional': '@/modules/workshop/additionals/interfaces/additional.interface',
    'AdditionalStatus': '@/modules/workshop/additionals/interfaces/additional.interface',
    'AdditionalFilters': '@/modules/workshop/additionals/interfaces/additional.interface',
    'CreateAdditionalInput': '@/modules/workshop/additionals/interfaces/additional.interface',
    'UpdateAdditionalInput': '@/modules/workshop/additionals/interfaces/additional.interface',
    'VehicleDelivery': '@/modules/workshop/deliveries/interfaces/delivery.interface',
    'DeliveryStatus': '@/modules/workshop/deliveries/interfaces/delivery.interface',
    'DeliveryFilters': '@/modules/workshop/deliveries/interfaces/delivery.interface',
    'CreateDeliveryInput': '@/modules/workshop/deliveries/interfaces/delivery.interface',
    'UpdateDeliveryInput': '@/modules/workshop/deliveries/interfaces/delivery.interface',
    'Rework': '@/modules/workshop/reworks/interfaces/rework.interface',
    'ReworkStatus': '@/modules/workshop/reworks/interfaces/rework.interface',
    'IngressMotive': '@/modules/workshop/ingressMotives/interfaces/ingressMotive.interface',
    'LaborTime': '@/modules/workshop/laborTimes/interfaces/laborTime.interface',
    'Material': '@/modules/workshop/materials/interfaces/material.interface',
    'ServiceOrderMaterial': '@/modules/workshop/materials/interfaces/material.interface',
    'Report': '@/modules/workshop/reports/interfaces/report.interface',
    'DashboardMetric': '@/modules/workshop/dashboard/interfaces/dashboard.interface',
    'DashboardAlert': '@/modules/workshop/dashboard/interfaces/dashboard.interface',
    'RecentActivity': '@/modules/workshop/dashboard/interfaces/dashboard.interface',
    'QuickStat': '@/modules/workshop/dashboard/interfaces/dashboard.interface',
    'WorkshopDashboardData': '@/modules/workshop/dashboard/interfaces/dashboard.interface',
    'BillingBridge': '@/modules/workshop/billingBridge/interfaces/billingBridge.interface',
    'Attachment': '@/modules/workshop/attachments/interfaces/attachment.interface',
    'AuditLog': '@/modules/workshop/auditLogs/interfaces/auditLog.interface',
    'CatalogSearch': '@/modules/workshop/catalogSearch/interfaces/catalogSearch.interface',
    'ReceptionMedia': '@/modules/workshop/receptionMedia/interfaces/receptionMedia.interface',
    'Planning': '@/modules/workshop/planning/interfaces/planning.interface',
    'WorkshopPagedResponse': '@/modules/workshop/shared/interfaces/shared.interface',
    'WorkshopResponse': '@/modules/workshop/shared/interfaces/shared.interface',
    'CustomerRef': '@/modules/workshop/shared/interfaces/shared.interface',
    'VehicleRef': '@/modules/workshop/shared/interfaces/shared.interface',
    'OrderRef': '@/modules/workshop/shared/interfaces/shared.interface',
    'BayArea': '@/modules/workshop/shared/interfaces/serviceBay.interface',
    'BayStatus': '@/modules/workshop/shared/interfaces/serviceBay.interface',
    'WorkOrder': '@/modules/workshop/shared/interfaces/workOrder.interface',
    'WorkOrderItem': '@/modules/workshop/shared/interfaces/workOrder.interface',
    'WorkOrderFilters': '@/modules/workshop/shared/interfaces/workOrder.interface',
    'WorkOrderStatus': '@/modules/workshop/shared/interfaces/workOrderStatus.interface',
    'WorkOrderStatusSingleResponse': '@/modules/workshop/shared/interfaces/workOrderStatus.interface',
    'WorkOrderStatusResponse': '@/modules/workshop/shared/interfaces/workOrderStatus.interface',
    'WorkOrderStatusFilters': '@/modules/workshop/shared/interfaces/workOrderStatus.interface',
    'WorkOrderResponse': '@/modules/workshop/shared/interfaces/workOrderMain.interface',
    'WorkOrderWithHistory': '@/modules/workshop/shared/interfaces/workOrder.interface',
    'WorkOrderHistory': '@/modules/workshop/shared/interfaces/workOrder.interface',
    'Invoice': '@/modules/workshop/shared/interfaces/invoice.interface',
    'Payment': '@/modules/workshop/shared/interfaces/payment.interface',
    'Service': '@/modules/workshop/shared/interfaces/service.interface',
    'ServiceFilters': '@/modules/workshop/shared/interfaces/service.interface',
    'ServiceResponse': '@/modules/workshop/shared/interfaces/service.interface',
    'ServiceBay': '@/modules/workshop/shared/interfaces/serviceBay.interface',
    'ServiceBayFilters': '@/modules/workshop/shared/interfaces/serviceBay.interface',
    'CreateServiceBayDto': '@/modules/workshop/shared/interfaces/serviceBay.interface',
    'UpdateServiceBayDto': '@/modules/workshop/shared/interfaces/serviceBay.interface',
    'ServiceCategory': '@/modules/workshop/shared/interfaces/serviceCategoryMain.interface',
    'ServiceCategoryFilters': '@/modules/workshop/shared/interfaces/serviceCategoryMain.interface',
    'ServiceCategoryResponse': '@/modules/workshop/shared/interfaces/serviceCategoryMain.interface',
    'ServiceSubcategory': '@/modules/workshop/shared/interfaces/serviceCategoryMain.interface',
    'ServiceSubcategoryFilters': '@/modules/workshop/shared/interfaces/serviceCategoryMain.interface',
    'ServiceSubcategoryResponse': '@/modules/workshop/shared/interfaces/serviceCategoryMain.interface',
}

fixed_count = 0

for root, dirs, files in os.walk(os.path.join(base, 'modules/workshop')):
    for f in files:
        if not (f.endswith('.ts') or f.endswith('.tsx')):
            continue
        path = os.path.join(root, f)
        with open(path, 'r') as file:
            content = file.read()
        
        original = content
        
        pattern = r"import\s+type\s*\{([^}]+)\}\s+from\s+['\"]@/modules/workshop/shared/interfaces['\"]"
        
        def replace_import(match):
            types_str = match.group(1)
            types = [t.strip() for t in types_str.split(',')]
            
            path_to_types = {}
            for t in types:
                if t in type_to_path:
                    p = type_to_path[t]
                    if p not in path_to_types:
                        path_to_types[p] = []
                    path_to_types[p].append(t)
                else:
                    if 'shared' not in path_to_types:
                        path_to_types['@/modules/workshop/shared/interfaces'] = []
                    path_to_types['@/modules/workshop/shared/interfaces'].append(t)
            
            imports = []
            for p, ts in path_to_types.items():
                imports.append(f"import type {{ {', '.join(ts)} }} from '{p}';")
            
            return '\n'.join(imports)
        
        content = re.sub(pattern, replace_import, content)
        
        pattern2 = r"import\s+\{([^}]+)\}\s+from\s+['\"]@/modules/workshop/shared/interfaces['\"]"
        content = re.sub(pattern2, replace_import, content)
        
        if content != original:
            with open(path, 'w') as file:
                file.write(content)
            fixed_count += 1

print(f'Fixed {fixed_count} files')
