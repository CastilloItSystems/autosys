# File Tree: autosys

**Generated:** 3/23/2026, 12:16:58 PM
**Root Path:** `/Users/alfredocastillo/Documents/GitHub/autosys`

```
├── .github
│   └── workflows
│       └── deploy.yml
├── backend
│   ├── docs
│   │   ├── api
│   │   │   ├── postman
│   │   │   │   ├── inventory.postman_collection.json
│   │   │   │   └── sales.postman_collection.json
│   │   │   ├── inventory.md
│   │   │   └── sales.md
│   │   ├── database
│   │   │   ├── ERD.png
│   │   │   └── schema-explanation.md
│   │   ├── flows
│   │   │   ├── loan-flow.md
│   │   │   ├── purchase-flow.md
│   │   │   ├── sale-flow.md
│   │   │   └── warranty-flow.md
│   │   └── setup
│   │       ├── deployment.md
│   │       ├── environment.md
│   │       └── installation.md
│   ├── prisma
│   │   ├── migrations
│   │   │   ├── 20260201031645_init
│   │   │   │   └── migration.sql
│   │   │   ├── 20260201040547_empresas
│   │   │   │   └── migration.sql
│   │   │   ├── 20260205220840_add_user_empresa_relation
│   │   │   │   └── migration.sql
│   │   │   ├── 20260206031035_change_estado_to_enum
│   │   │   │   └── migration.sql
│   │   │   ├── 20260206032913_y
│   │   │   │   └── migration.sql
│   │   │   ├── 20260210213056_nueva
│   │   │   │   └── migration.sql
│   │   │   ├── 20260212212542_model_migrate
│   │   │   │   └── migration.sql
│   │   │   ├── 20260213024540_items_test
│   │   │   │   └── migration.sql
│   │   │   ├── 20260227020055_new
│   │   │   │   └── migration.sql
│   │   │   ├── 20260227022035_sigo_trabajando
│   │   │   │   └── migration.sql
│   │   │   ├── 20260227194015_nueva
│   │   │   │   └── migration.sql
│   │   │   ├── 20260301135136_add
│   │   │   │   └── migration.sql
│   │   │   ├── 20260302202942_varias_empresas_en_invenetario
│   │   │   │   └── migration.sql
│   │   │   ├── 20260303021321_nota_entrada
│   │   │   │   └── migration.sql
│   │   │   ├── 20260306153510_acomodand_transferencia
│   │   │   │   └── migration.sql
│   │   │   ├── 20260306165732_transfer_note_relations
│   │   │   │   └── migration.sql
│   │   │   ├── 20260307192335_add_movement_variance
│   │   │   │   └── migration.sql
│   │   │   ├── 20260307200000_fix_add_variance_columns
│   │   │   │   └── migration.sql
│   │   │   ├── 20260307220000_add_user_permissions
│   │   │   │   └── migration.sql
│   │   │   ├── 20260308000000_add_dynamic_roles_tables
│   │   │   │   └── migration.sql
│   │   │   ├── 20260311151329_item_unique_by_empresa
│   │   │   │   └── migration.sql
│   │   │   ├── 20260311174846_ralation_stock
│   │   │   │   └── migration.sql
│   │   │   ├── 20260311202500_transferencia
│   │   │   │   └── migration.sql
│   │   │   ├── 20260312140925_nuevosistemapersmiso
│   │   │   │   └── migration.sql
│   │   │   ├── 20260312143313_idece_user
│   │   │   │   └── migration.sql
│   │   │   ├── 20260316145733_code_en_items
│   │   │   │   └── migration.sql
│   │   │   ├── 20260316173646_mejorando
│   │   │   │   └── migration.sql
│   │   │   ├── 20260316185743_add_completed_with_errors
│   │   │   │   └── migration.sql
│   │   │   ├── 20260318193843_identy_campo_nuevo
│   │   │   │   └── migration.sql
│   │   │   ├── 20260318220650_add_supplier_relation_and_item_name_to_entry_note
│   │   │   │   └── migration.sql
│   │   │   ├── 20260319034906_purchase_actualizado
│   │   │   │   └── migration.sql
│   │   │   ├── 20260319053219_item_name_agregado
│   │   │   │   └── migration.sql
│   │   │   ├── 20260319200251_exit_note
│   │   │   │   └── migration.sql
│   │   │   ├── 20260319232107_order_sales
│   │   │   │   └── migration.sql
│   │   │   ├── 20260320030010_pre_invoice
│   │   │   │   └── migration.sql
│   │   │   ├── 20260320032541_payment
│   │   │   │   └── migration.sql
│   │   │   ├── 20260320043603_invoice
│   │   │   │   └── migration.sql
│   │   │   └── migration_lock.toml
│   │   ├── models
│   │   │   ├── inventory
│   │   │   │   ├── adjustment.prisma
│   │   │   │   ├── adjustmentItem.prisma
│   │   │   │   ├── batch.prisma
│   │   │   │   ├── brand.prisma
│   │   │   │   ├── bulkOperation.prisma
│   │   │   │   ├── category.prisma
│   │   │   │   ├── cycleCount.prisma
│   │   │   │   ├── cycleCountItem.prisma
│   │   │   │   ├── entryNote.prisma
│   │   │   │   ├── entryNoteItem.prisma
│   │   │   │   ├── event.prisma
│   │   │   │   ├── exitNote.prisma
│   │   │   │   ├── exitNoteItem.prisma
│   │   │   │   ├── item.prisma
│   │   │   │   ├── itemImage.prisma
│   │   │   │   ├── loan.prisma
│   │   │   │   ├── model.prisma
│   │   │   │   ├── modelCompatibility.prisma
│   │   │   │   ├── movement.prisma
│   │   │   │   ├── pricing.prisma
│   │   │   │   ├── purchaseOrder.prisma
│   │   │   │   ├── purchaseOrderItem.prisma
│   │   │   │   ├── reconciliation.prisma
│   │   │   │   ├── reconciliationItem.prisma
│   │   │   │   ├── reservation.prisma
│   │   │   │   ├── return.prisma
│   │   │   │   ├── serialNumber.prisma
│   │   │   │   ├── stock.prisma
│   │   │   │   ├── stockAlert.prisma
│   │   │   │   ├── supplier.prisma
│   │   │   │   ├── transfer.prisma
│   │   │   │   ├── unit.prisma
│   │   │   │   └── warehouse.prisma
│   │   │   ├── sales
│   │   │   │   ├── customer.prisma
│   │   │   │   ├── invoice.prisma
│   │   │   │   ├── invoiceItem.prisma
│   │   │   │   ├── order.prisma
│   │   │   │   ├── orderItem.prisma
│   │   │   │   ├── payment.prisma
│   │   │   │   ├── preInvoice.prisma
│   │   │   │   └── preInvoiceItem.prisma
│   │   │   ├── auditLog.prisma
│   │   │   ├── companyRole.prisma
│   │   │   ├── empresas.prisma
│   │   │   ├── membership.prisma
│   │   │   ├── membershipPermission.prisma
│   │   │   ├── permission.prisma
│   │   │   ├── rolePermission.prisma
│   │   │   └── user.prisma
│   │   ├── seeds
│   │   │   ├── brands.seed.d.ts
│   │   │   ├── brands.seed.js
│   │   │   ├── brands.seed.ts
│   │   │   ├── categories.seed.d.ts
│   │   │   ├── categories.seed.js
│   │   │   ├── categories.seed.ts
│   │   │   ├── companyRoles.seed.ts
│   │   │   ├── dynamicRoles.seed.d.ts
│   │   │   ├── dynamicRoles.seed.js
│   │   │   ├── dynamicRoles.seed.ts
│   │   │   ├── empresas.seed.d.ts
│   │   │   ├── empresas.seed.js
│   │   │   ├── empresas.seed.ts
│   │   │   ├── index.d.ts
│   │   │   ├── index.js
│   │   │   ├── index.ts
│   │   │   ├── items.seed.d.ts
│   │   │   ├── items.seed.js
│   │   │   ├── items.seed.ts
│   │   │   ├── membership-permissions.seed.ts
│   │   │   ├── memberships.seed.ts
│   │   │   ├── models.seed.d.ts
│   │   │   ├── models.seed.js
│   │   │   ├── models.seed.ts
│   │   │   ├── permissions.seed.ts
│   │   │   ├── roles.seed.ts
│   │   │   ├── suppliers.seed.d.ts
│   │   │   ├── suppliers.seed.js
│   │   │   ├── suppliers.seed.ts
│   │   │   ├── units.seed.d.ts
│   │   │   ├── units.seed.js
│   │   │   ├── units.seed.ts
│   │   │   ├── users.seed.d.ts
│   │   │   ├── users.seed.js
│   │   │   ├── users.seed.ts
│   │   │   ├── warehouses.seed.d.ts
│   │   │   ├── warehouses.seed.js
│   │   │   └── warehouses.seed.ts
│   │   ├── base.prisma
│   │   └── schema.prisma
│   ├── public
│   │   ├── templates
│   │   │   ├── invoice-template.html
│   │   │   ├── items-import-template.csv
│   │   │   └── report-template.html
│   │   └── uploads
│   │       └── items
│   ├── scripts
│   │   ├── backup-db.d.ts
│   │   ├── backup-db.js
│   │   ├── backup-db.ts
│   │   ├── generate-sku.d.ts
│   │   ├── generate-sku.js
│   │   ├── generate-sku.ts
│   │   ├── migrate-data.d.ts
│   │   ├── migrate-data.js
│   │   ├── migrate-data.ts
│   │   ├── seed-test-data.d.ts
│   │   ├── seed-test-data.js
│   │   └── seed-test-data.ts
│   ├── src
│   │   ├── config
│   │   │   ├── constants.ts
│   │   │   ├── cors.config.ts
│   │   │   ├── database.config.ts
│   │   │   ├── database.ts
│   │   │   ├── env.config.ts
│   │   │   ├── i18n.config.ts
│   │   │   ├── logger.config.ts
│   │   │   └── messages.ts
│   │   ├── controllers
│   │   │   ├── auth.controller.ts
│   │   │   ├── companyRoles.controller.ts
│   │   │   ├── empresas.controller.ts
│   │   │   ├── memberships.controller.ts
│   │   │   └── users.controller.ts
│   │   ├── docs
│   │   │   ├── api-examples
│   │   │   │   ├── auth-api.example.ts
│   │   │   │   ├── brands-api.example.ts
│   │   │   │   └── users-empresas-api.example.ts
│   │   │   ├── README.md
│   │   │   ├── swagger.config.ts
│   │   │   └── swagger.ts
│   │   ├── features
│   │   │   ├── inventory
│   │   │   │   ├── __tests__
│   │   │   │   │   ├── e2e-complete-purchase.test.ts
│   │   │   │   │   ├── e2e-complete-sale.test.ts
│   │   │   │   │   ├── e2e-special-exit.test.ts
│   │   │   │   │   ├── e2e-stock-adjustment.test.ts
│   │   │   │   │   ├── loan-flow.integration.test.ts
│   │   │   │   │   ├── purchase-flow.integration.test.ts
│   │   │   │   │   ├── reservation-flow.integration.test.ts
│   │   │   │   │   ├── sale-flow.integration.test.ts
│   │   │   │   │   ├── transfer-flow.integration.test.ts
│   │   │   │   │   └── warranty-exit.integration.test.ts
│   │   │   │   ├── adjustments
│   │   │   │   │   ├── adjustments.controller.ts
│   │   │   │   │   ├── adjustments.dto.ts
│   │   │   │   │   ├── adjustments.interface.ts
│   │   │   │   │   ├── adjustments.routes.ts
│   │   │   │   │   ├── adjustments.service.ts
│   │   │   │   │   ├── adjustments.test.ts
│   │   │   │   │   ├── adjustments.validation.ts
│   │   │   │   │   └── index.ts
│   │   │   │   ├── analytics
│   │   │   │   │   ├── abc
│   │   │   │   │   │   ├── abc.controller.ts
│   │   │   │   │   │   ├── abc.routes.ts
│   │   │   │   │   │   └── abc.service.ts
│   │   │   │   │   ├── discrepancies
│   │   │   │   │   │   ├── discrepancies.controller.ts
│   │   │   │   │   │   ├── discrepancies.routes.ts
│   │   │   │   │   │   └── discrepancies.service.ts
│   │   │   │   │   ├── forecasting
│   │   │   │   │   │   ├── forecasting.controller.ts
│   │   │   │   │   │   ├── forecasting.routes.ts
│   │   │   │   │   │   └── forecasting.service.ts
│   │   │   │   │   ├── turnover
│   │   │   │   │   │   ├── turnover.controller.ts
│   │   │   │   │   │   ├── turnover.routes.ts
│   │   │   │   │   │   └── turnover.service.ts
│   │   │   │   │   └── index.ts
│   │   │   │   ├── batches
│   │   │   │   │   ├── expiry
│   │   │   │   │   │   ├── jobs
│   │   │   │   │   │   │   └── checkExpiry.job.ts
│   │   │   │   │   │   ├── expiry.controller.ts
│   │   │   │   │   │   ├── expiry.routes.ts
│   │   │   │   │   │   └── expiry.service.ts
│   │   │   │   │   ├── batches.controller.ts
│   │   │   │   │   ├── batches.dto.ts
│   │   │   │   │   ├── batches.interface.ts
│   │   │   │   │   ├── batches.routes.ts
│   │   │   │   │   ├── batches.service.ts
│   │   │   │   │   ├── batches.test.ts
│   │   │   │   │   ├── batches.validation.ts
│   │   │   │   │   └── index.ts
│   │   │   │   ├── cycleCounts
│   │   │   │   │   ├── cycleCounts.controller.ts
│   │   │   │   │   ├── cycleCounts.dto.ts
│   │   │   │   │   ├── cycleCounts.interface.ts
│   │   │   │   │   ├── cycleCounts.routes.ts
│   │   │   │   │   ├── cycleCounts.service.ts
│   │   │   │   │   ├── cycleCounts.test.ts
│   │   │   │   │   ├── cycleCounts.validation.ts
│   │   │   │   │   └── index.ts
│   │   │   │   ├── entryNotes
│   │   │   │   │   ├── entryNotes.controller.ts
│   │   │   │   │   ├── entryNotes.dto.ts
│   │   │   │   │   ├── entryNotes.interface.ts
│   │   │   │   │   ├── entryNotes.routes.ts
│   │   │   │   │   ├── entryNotes.service.ts
│   │   │   │   │   ├── entryNotes.validation.ts
│   │   │   │   │   └── index.ts
│   │   │   │   ├── exitNotes
│   │   │   │   │   ├── items
│   │   │   │   │   │   ├── index.ts
│   │   │   │   │   │   ├── items.controller.ts
│   │   │   │   │   │   ├── items.interface.ts
│   │   │   │   │   │   ├── items.routes.ts
│   │   │   │   │   │   ├── items.service.ts
│   │   │   │   │   │   └── items.validation.ts
│   │   │   │   │   ├── exitNotes.controller.ts
│   │   │   │   │   ├── exitNotes.dto.ts
│   │   │   │   │   ├── exitNotes.interface.ts
│   │   │   │   │   ├── exitNotes.routes.ts
│   │   │   │   │   ├── exitNotes.service.ts
│   │   │   │   │   ├── exitNotes.test.ts
│   │   │   │   │   ├── exitNotes.validation.ts
│   │   │   │   │   └── index.ts
│   │   │   │   ├── hooks
│   │   │   │   │   ├── adjustment.hooks.ts
│   │   │   │   │   ├── hook.interface.ts
│   │   │   │   │   ├── hook.registry.ts
│   │   │   │   │   ├── index.ts
│   │   │   │   │   ├── item.hooks.ts
│   │   │   │   │   ├── movement.hooks.ts
│   │   │   │   │   └── stock.hooks.ts
│   │   │   │   ├── integrations
│   │   │   │   │   ├── accounting
│   │   │   │   │   │   ├── accountingIntegration.controller.ts
│   │   │   │   │   │   ├── accountingIntegration.routes.ts
│   │   │   │   │   │   └── accountingIntegration.service.ts
│   │   │   │   │   ├── sales
│   │   │   │   │   │   ├── salesIntegration.controller.ts
│   │   │   │   │   │   ├── salesIntegration.routes.ts
│   │   │   │   │   │   └── salesIntegration.service.ts
│   │   │   │   │   ├── workshop
│   │   │   │   │   │   ├── workshopIntegration.controller.ts
│   │   │   │   │   │   ├── workshopIntegration.routes.ts
│   │   │   │   │   │   └── workshopIntegration.service.ts
│   │   │   │   │   └── index.ts
│   │   │   │   ├── items
│   │   │   │   │   ├── bulk
│   │   │   │   │   │   ├── templates
│   │   │   │   │   │   │   └── import-guide.md
│   │   │   │   │   │   ├── bulk.controller.ts
│   │   │   │   │   │   ├── bulk.dto.ts
│   │   │   │   │   │   ├── bulk.interface.ts
│   │   │   │   │   │   ├── bulk.routes.ts
│   │   │   │   │   │   ├── bulk.service.ts
│   │   │   │   │   │   ├── bulk.test.ts
│   │   │   │   │   │   └── bulk.validation.ts
│   │   │   │   │   ├── catalogs
│   │   │   │   │   │   ├── brands
│   │   │   │   │   │   │   ├── brands.controller.ts
│   │   │   │   │   │   │   ├── brands.dto.ts
│   │   │   │   │   │   │   ├── brands.interface.ts
│   │   │   │   │   │   │   ├── brands.routes.ts
│   │   │   │   │   │   │   ├── brands.service.ts
│   │   │   │   │   │   │   ├── brands.test.ts
│   │   │   │   │   │   │   └── brands.validation.ts
│   │   │   │   │   │   ├── categories
│   │   │   │   │   │   │   ├── utils
│   │   │   │   │   │   │   │   └── categoryTree.ts
│   │   │   │   │   │   │   ├── categories.controller.ts
│   │   │   │   │   │   │   ├── categories.dto.ts
│   │   │   │   │   │   │   ├── categories.interface.ts
│   │   │   │   │   │   │   ├── categories.routes.ts
│   │   │   │   │   │   │   ├── categories.service.ts
│   │   │   │   │   │   │   ├── categories.test.ts
│   │   │   │   │   │   │   └── categories.validation.ts
│   │   │   │   │   │   ├── model-compatibility
│   │   │   │   │   │   │   ├── model-compatibility.controller.ts
│   │   │   │   │   │   │   ├── model-compatibility.dto.ts
│   │   │   │   │   │   │   ├── model-compatibility.interface.ts
│   │   │   │   │   │   │   ├── model-compatibility.routes.ts
│   │   │   │   │   │   │   ├── model-compatibility.service.ts
│   │   │   │   │   │   │   ├── model-compatibility.test.ts
│   │   │   │   │   │   │   └── model-compatibility.validation.ts
│   │   │   │   │   │   ├── models
│   │   │   │   │   │   │   ├── models.controller.ts
│   │   │   │   │   │   │   ├── models.dto.ts
│   │   │   │   │   │   │   ├── models.interface.ts
│   │   │   │   │   │   │   ├── models.routes.ts
│   │   │   │   │   │   │   ├── models.service.ts
│   │   │   │   │   │   │   ├── models.test.ts
│   │   │   │   │   │   │   └── models.validation.ts
│   │   │   │   │   │   ├── units
│   │   │   │   │   │   │   ├── units.controller.ts
│   │   │   │   │   │   │   ├── units.dto.ts
│   │   │   │   │   │   │   ├── units.interface.ts
│   │   │   │   │   │   │   ├── units.routes.ts
│   │   │   │   │   │   │   ├── units.service.ts
│   │   │   │   │   │   │   ├── units.test.ts
│   │   │   │   │   │   │   └── units.validation.ts
│   │   │   │   │   │   └── index.ts
│   │   │   │   │   ├── images
│   │   │   │   │   │   ├── images.controller.ts
│   │   │   │   │   │   ├── images.dto.ts
│   │   │   │   │   │   ├── images.interface.ts
│   │   │   │   │   │   ├── images.routes.ts
│   │   │   │   │   │   ├── images.service.ts
│   │   │   │   │   │   ├── images.test.ts
│   │   │   │   │   │   └── images.validation.ts
│   │   │   │   │   ├── pricing
│   │   │   │   │   │   ├── pricing.controller.ts
│   │   │   │   │   │   ├── pricing.dto.ts
│   │   │   │   │   │   ├── pricing.interface.ts
│   │   │   │   │   │   ├── pricing.routes.ts
│   │   │   │   │   │   ├── pricing.service.ts
│   │   │   │   │   │   ├── pricing.test.ts
│   │   │   │   │   │   └── pricing.validation.ts
│   │   │   │   │   ├── search
│   │   │   │   │   │   ├── search.controller.ts
│   │   │   │   │   │   ├── search.dto.ts
│   │   │   │   │   │   ├── search.interface.ts
│   │   │   │   │   │   ├── search.routes.ts
│   │   │   │   │   │   ├── search.service.ts
│   │   │   │   │   │   ├── search.test.ts
│   │   │   │   │   │   └── search.validation.ts
│   │   │   │   │   ├── index.ts
│   │   │   │   │   ├── items.controller.ts
│   │   │   │   │   ├── items.dto.ts
│   │   │   │   │   ├── items.interface.ts
│   │   │   │   │   ├── items.routes.ts
│   │   │   │   │   ├── items.service.ts
│   │   │   │   │   ├── items.test.ts
│   │   │   │   │   └── items.validation.ts
│   │   │   │   ├── jobs
│   │   │   │   │   ├── processors
│   │   │   │   │   │   ├── checkExpiry.processor.ts
│   │   │   │   │   │   ├── checkLoansOverdue.processor.ts
│   │   │   │   │   │   ├── cleanupOldEvents.processor.ts
│   │   │   │   │   │   ├── generateAlerts.processor.ts
│   │   │   │   │   │   └── syncReservations.processor.ts
│   │   │   │   │   ├── calculateRotation.job.ts
│   │   │   │   │   ├── checkExpiry.job.ts
│   │   │   │   │   ├── generateAlerts.job.ts
│   │   │   │   │   ├── index.ts
│   │   │   │   │   ├── queue.service.ts
│   │   │   │   │   ├── syncStock.job.ts
│   │   │   │   │   └── updateStockLevels.job.ts
│   │   │   │   ├── loans
│   │   │   │   │   ├── jobs
│   │   │   │   │   │   └── checkOverdue.job.ts
│   │   │   │   │   ├── index.ts
│   │   │   │   │   ├── loans.controller.ts
│   │   │   │   │   ├── loans.dto.ts
│   │   │   │   │   ├── loans.interface.ts
│   │   │   │   │   ├── loans.routes.ts
│   │   │   │   │   ├── loans.service.ts
│   │   │   │   │   ├── loans.test.ts
│   │   │   │   │   └── loans.validation.ts
│   │   │   │   ├── movements
│   │   │   │   │   ├── reports
│   │   │   │   │   │   ├── kardex.routes.ts
│   │   │   │   │   │   ├── kardex.service.ts
│   │   │   │   │   │   ├── rotation.routes.ts
│   │   │   │   │   │   └── valuation.routes.ts
│   │   │   │   │   ├── index.ts
│   │   │   │   │   ├── movements.controller.ts
│   │   │   │   │   ├── movements.dto.ts
│   │   │   │   │   ├── movements.interface.ts
│   │   │   │   │   ├── movements.routes.ts
│   │   │   │   │   ├── movements.service.ts
│   │   │   │   │   ├── movements.test.ts
│   │   │   │   │   └── movements.validation.ts
│   │   │   │   ├── purchaseOrders
│   │   │   │   │   ├── index.ts
│   │   │   │   │   ├── purchaseOrders.controller.ts
│   │   │   │   │   ├── purchaseOrders.dto.ts
│   │   │   │   │   ├── purchaseOrders.interface.ts
│   │   │   │   │   ├── purchaseOrders.routes.ts
│   │   │   │   │   ├── purchaseOrders.service.ts
│   │   │   │   │   ├── purchaseOrders.test.ts
│   │   │   │   │   └── purchaseOrders.validation.ts
│   │   │   │   ├── reconciliations
│   │   │   │   │   ├── index.ts
│   │   │   │   │   ├── reconciliations.controller.ts
│   │   │   │   │   ├── reconciliations.dto.ts
│   │   │   │   │   ├── reconciliations.interface.ts
│   │   │   │   │   ├── reconciliations.routes.ts
│   │   │   │   │   ├── reconciliations.service.ts
│   │   │   │   │   ├── reconciliations.test.ts
│   │   │   │   │   └── reconciliations.validation.ts
│   │   │   │   ├── reports
│   │   │   │   │   ├── aging
│   │   │   │   │   │   ├── aging.routes.ts
│   │   │   │   │   │   └── aging.service.ts
│   │   │   │   │   ├── batchExpiry
│   │   │   │   │   │   ├── batchExpiry.routes.ts
│   │   │   │   │   │   └── batchExpiry.service.ts
│   │   │   │   │   ├── dashboard
│   │   │   │   │   │   ├── dashboard.controller.ts
│   │   │   │   │   │   ├── dashboard.routes.ts
│   │   │   │   │   │   └── dashboard.service.ts
│   │   │   │   │   ├── deadStock
│   │   │   │   │   │   ├── deadStock.controller.ts
│   │   │   │   │   │   ├── deadStock.routes.ts
│   │   │   │   │   │   └── deadStock.service.ts
│   │   │   │   │   ├── exitsWithoutInvoice
│   │   │   │   │   │   ├── exitsWithoutInvoice.controller.ts
│   │   │   │   │   │   ├── exitsWithoutInvoice.routes.ts
│   │   │   │   │   │   └── exitsWithoutInvoice.service.ts
│   │   │   │   │   ├── exports
│   │   │   │   │   │   ├── csv.service.ts
│   │   │   │   │   │   ├── excel.service.ts
│   │   │   │   │   │   ├── export.controller.ts
│   │   │   │   │   │   ├── export.routes.ts
│   │   │   │   │   │   └── pdf.service.ts
│   │   │   │   │   ├── lowStock
│   │   │   │   │   │   ├── lowStock.controller.ts
│   │   │   │   │   │   ├── lowStock.routes.ts
│   │   │   │   │   │   └── lowStock.service.ts
│   │   │   │   │   ├── movements
│   │   │   │   │   │   ├── movements.controller.ts
│   │   │   │   │   │   ├── movements.routes.ts
│   │   │   │   │   │   └── movements.service.ts
│   │   │   │   │   ├── stockValue
│   │   │   │   │   │   ├── stockValue.controller.ts
│   │   │   │   │   │   ├── stockValue.routes.ts
│   │   │   │   │   │   └── stockValue.service.ts
│   │   │   │   │   ├── supplierPerformance
│   │   │   │   │   │   ├── supplierPerformance.routes.ts
│   │   │   │   │   │   └── supplierPerformance.service.ts
│   │   │   │   │   └── index.ts
│   │   │   │   ├── reservations
│   │   │   │   │   ├── index.ts
│   │   │   │   │   ├── reservations.controller.ts
│   │   │   │   │   ├── reservations.dto.ts
│   │   │   │   │   ├── reservations.interface.ts
│   │   │   │   │   ├── reservations.routes.ts
│   │   │   │   │   ├── reservations.service.ts
│   │   │   │   │   ├── reservations.test.ts
│   │   │   │   │   └── reservations.validation.ts
│   │   │   │   ├── returns
│   │   │   │   │   ├── items
│   │   │   │   │   │   ├── items.controller.ts
│   │   │   │   │   │   ├── items.routes.ts
│   │   │   │   │   │   └── items.service.ts
│   │   │   │   │   ├── index.ts
│   │   │   │   │   ├── returns.controller.ts
│   │   │   │   │   ├── returns.dto.ts
│   │   │   │   │   ├── returns.interface.ts
│   │   │   │   │   ├── returns.routes.ts
│   │   │   │   │   ├── returns.service.ts
│   │   │   │   │   ├── returns.test.ts
│   │   │   │   │   └── returns.validation.ts
│   │   │   │   ├── serialNumbers
│   │   │   │   │   ├── tracking
│   │   │   │   │   │   ├── tracking.controller.ts
│   │   │   │   │   │   ├── tracking.routes.ts
│   │   │   │   │   │   └── tracking.service.ts
│   │   │   │   │   ├── index.ts
│   │   │   │   │   ├── serialNumbers.controller.ts
│   │   │   │   │   ├── serialNumbers.dto.ts
│   │   │   │   │   ├── serialNumbers.interface.ts
│   │   │   │   │   ├── serialNumbers.routes.ts
│   │   │   │   │   ├── serialNumbers.service.ts
│   │   │   │   │   ├── serialNumbers.test.ts
│   │   │   │   │   └── serialNumbers.validation.ts
│   │   │   │   ├── shared
│   │   │   │   │   ├── constants
│   │   │   │   │   │   ├── exitTypes.ts
│   │   │   │   │   │   ├── index.ts
│   │   │   │   │   │   ├── inventory.constants.ts
│   │   │   │   │   │   └── messages.ts
│   │   │   │   │   ├── events
│   │   │   │   │   │   ├── event.service.ts
│   │   │   │   │   │   ├── event.types.ts
│   │   │   │   │   │   ├── index.ts
│   │   │   │   │   │   └── socket.service.ts
│   │   │   │   │   ├── hooks
│   │   │   │   │   │   └── hook.registry.ts
│   │   │   │   │   ├── interfaces
│   │   │   │   │   │   ├── IInventoryRepository.ts
│   │   │   │   │   │   ├── IMovementService.ts
│   │   │   │   │   │   ├── IStockService.ts
│   │   │   │   │   │   └── index.ts
│   │   │   │   │   ├── middleware
│   │   │   │   │   │   ├── checkReservation.middleware.ts
│   │   │   │   │   │   ├── checkStock.middleware.ts
│   │   │   │   │   │   ├── index.ts
│   │   │   │   │   │   ├── validateLocation.middleware.ts
│   │   │   │   │   │   └── validateWarehouse.middleware.ts
│   │   │   │   │   ├── plugins
│   │   │   │   │   │   ├── auditPlugin.ts
│   │   │   │   │   │   ├── index.ts
│   │   │   │   │   │   └── softDeletePlugin.ts
│   │   │   │   │   ├── utils
│   │   │   │   │   │   ├── batchHelper.ts
│   │   │   │   │   │   ├── calculateOrderTotals.ts
│   │   │   │   │   │   ├── costCalculator.ts
│   │   │   │   │   │   ├── index.ts
│   │   │   │   │   │   ├── locationValidator.ts
│   │   │   │   │   │   ├── movementNumberGenerator.ts
│   │   │   │   │   │   ├── priceCalculator.ts
│   │   │   │   │   │   ├── skuGenerator.ts
│   │   │   │   │   │   └── stockCalculator.ts
│   │   │   │   │   └── validators
│   │   │   │   │       ├── common.validator.ts
│   │   │   │   │       ├── index.ts
│   │   │   │   │       ├── movement.validator.ts
│   │   │   │   │       └── stock.validator.ts
│   │   │   │   ├── stock
│   │   │   │   │   ├── index.ts
│   │   │   │   │   ├── stock.controller.ts
│   │   │   │   │   ├── stock.dto.ts
│   │   │   │   │   ├── stock.interface.ts
│   │   │   │   │   ├── stock.routes.ts
│   │   │   │   │   ├── stock.service.ts
│   │   │   │   │   ├── stock.test.ts
│   │   │   │   │   └── stock.validation.ts
│   │   │   │   ├── suppliers
│   │   │   │   │   ├── index.ts
│   │   │   │   │   ├── suppliers.controller.ts
│   │   │   │   │   ├── suppliers.dto.ts
│   │   │   │   │   ├── suppliers.interface.ts
│   │   │   │   │   ├── suppliers.routes.ts
│   │   │   │   │   ├── suppliers.service.ts
│   │   │   │   │   ├── suppliers.test.ts
│   │   │   │   │   └── suppliers.validation.ts
│   │   │   │   ├── tests
│   │   │   │   │   ├── e2e
│   │   │   │   │   │   ├── complete-purchase.test.ts
│   │   │   │   │   │   ├── complete-sale.test.ts
│   │   │   │   │   │   ├── special-exit.test.ts
│   │   │   │   │   │   └── stock-adjustment.test.ts
│   │   │   │   │   ├── fixtures
│   │   │   │   │   │   ├── brands.fixture.ts
│   │   │   │   │   │   ├── categories.fixture.ts
│   │   │   │   │   │   ├── items.fixture.ts
│   │   │   │   │   │   ├── stock.fixture.ts
│   │   │   │   │   │   ├── suppliers.fixture.ts
│   │   │   │   │   │   └── warehouses.fixture.ts
│   │   │   │   │   ├── integration
│   │   │   │   │   │   ├── loan-flow.test.ts
│   │   │   │   │   │   ├── purchase-flow.test.ts
│   │   │   │   │   │   ├── reservation-flow.test.ts
│   │   │   │   │   │   ├── sale-flow.test.ts
│   │   │   │   │   │   ├── transfer-flow.test.ts
│   │   │   │   │   │   └── warranty-exit.test.ts
│   │   │   │   │   └── unit
│   │   │   │   │       ├── catalogs
│   │   │   │   │       ├── exitNotes
│   │   │   │   │       ├── items
│   │   │   │   │       ├── movements
│   │   │   │   │       ├── purchaseOrders
│   │   │   │   │       ├── reservations
│   │   │   │   │       └── stock
│   │   │   │   ├── transfers
│   │   │   │   │   ├── index.ts
│   │   │   │   │   ├── transfers.controller.ts
│   │   │   │   │   ├── transfers.dto.ts
│   │   │   │   │   ├── transfers.interface.ts
│   │   │   │   │   ├── transfers.routes.ts
│   │   │   │   │   ├── transfers.service.ts
│   │   │   │   │   ├── transfers.test.ts
│   │   │   │   │   └── transfers.validation.ts
│   │   │   │   ├── warehouses
│   │   │   │   │   ├── index.ts
│   │   │   │   │   ├── warehouses.controller.ts
│   │   │   │   │   ├── warehouses.dto.ts
│   │   │   │   │   ├── warehouses.interface.ts
│   │   │   │   │   ├── warehouses.routes.ts
│   │   │   │   │   ├── warehouses.service.ts
│   │   │   │   │   ├── warehouses.test.ts
│   │   │   │   │   └── warehouses.validation.ts
│   │   │   │   ├── DOCUMENTACION.md
│   │   │   │   ├── MODULE_COMPLETION.md
│   │   │   │   ├── README.md
│   │   │   │   └── index.ts
│   │   │   └── sales
│   │   │       ├── creditNotes
│   │   │       │   ├── creditNotes.controller.ts
│   │   │       │   ├── creditNotes.dto.ts
│   │   │       │   ├── creditNotes.routes.ts
│   │   │       │   ├── creditNotes.service.ts
│   │   │       │   └── creditNotes.validation.ts
│   │   │       ├── customers
│   │   │       │   ├── customers.controller.ts
│   │   │       │   ├── customers.dto.ts
│   │   │       │   ├── customers.interface.ts
│   │   │       │   ├── customers.routes.ts
│   │   │       │   ├── customers.service.ts
│   │   │       │   ├── customers.validation.ts
│   │   │       │   └── index.ts
│   │   │       ├── integrations
│   │   │       │   └── inventory
│   │   │       │       └── inventoryIntegration.service.ts
│   │   │       ├── invoices
│   │   │       │   ├── cancellation
│   │   │       │   │   ├── cancellation.controller.ts
│   │   │       │   │   └── cancellation.service.ts
│   │   │       │   ├── fiscal
│   │   │       │   │   ├── fiscalIntegration.service.ts
│   │   │       │   │   └── seniat.service.ts
│   │   │       │   ├── items
│   │   │       │   │   ├── items.controller.ts
│   │   │       │   │   └── items.service.ts
│   │   │       │   ├── index.ts
│   │   │       │   ├── invoices.controller.ts
│   │   │       │   ├── invoices.dto.ts
│   │   │       │   ├── invoices.interface.ts
│   │   │       │   ├── invoices.routes.ts
│   │   │       │   ├── invoices.service.ts
│   │   │       │   ├── invoices.test.ts
│   │   │       │   └── invoices.validation.ts
│   │   │       ├── orders
│   │   │       │   ├── items
│   │   │       │   │   ├── items.controller.ts
│   │   │       │   │   ├── items.service.ts
│   │   │       │   │   └── items.validation.ts
│   │   │       │   ├── index.ts
│   │   │       │   ├── orders.controller.ts
│   │   │       │   ├── orders.dto.ts
│   │   │       │   ├── orders.interface.ts
│   │   │       │   ├── orders.routes.ts
│   │   │       │   ├── orders.service.ts
│   │   │       │   ├── orders.test.ts
│   │   │       │   └── orders.validation.ts
│   │   │       ├── payments
│   │   │       │   ├── methods
│   │   │       │   │   ├── card.service.ts
│   │   │       │   │   ├── cash.service.ts
│   │   │       │   │   ├── mixed.service.ts
│   │   │       │   │   └── transfer.service.ts
│   │   │       │   ├── index.ts
│   │   │       │   ├── payments.controller.ts
│   │   │       │   ├── payments.dto.ts
│   │   │       │   ├── payments.interface.ts
│   │   │       │   ├── payments.routes.ts
│   │   │       │   ├── payments.service.ts
│   │   │       │   ├── payments.test.ts
│   │   │       │   └── payments.validation.ts
│   │   │       ├── preInvoices
│   │   │       │   ├── items
│   │   │       │   │   ├── items.controller.ts
│   │   │       │   │   ├── items.service.ts
│   │   │       │   │   └── items.validation.ts
│   │   │       │   ├── index.ts
│   │   │       │   ├── preInvoices.controller.ts
│   │   │       │   ├── preInvoices.dto.ts
│   │   │       │   ├── preInvoices.interface.ts
│   │   │       │   ├── preInvoices.routes.ts
│   │   │       │   ├── preInvoices.service.ts
│   │   │       │   ├── preInvoices.test.ts
│   │   │       │   └── preInvoices.validation.ts
│   │   │       ├── quotes
│   │   │       │   ├── quotes.controller.ts
│   │   │       │   ├── quotes.dto.ts
│   │   │       │   ├── quotes.routes.ts
│   │   │       │   ├── quotes.service.ts
│   │   │       │   ├── quotes.test.ts
│   │   │       │   └── quotes.validation.ts
│   │   │       ├── reports
│   │   │       │   ├── byCustomer
│   │   │       │   │   ├── byCustomer.controller.ts
│   │   │       │   │   ├── byCustomer.routes.ts
│   │   │       │   │   └── byCustomer.service.ts
│   │   │       │   ├── byPeriod
│   │   │       │   │   ├── byPeriod.controller.ts
│   │   │       │   │   ├── byPeriod.routes.ts
│   │   │       │   │   └── byPeriod.service.ts
│   │   │       │   ├── byProduct
│   │   │       │   │   ├── byProduct.controller.ts
│   │   │       │   │   ├── byProduct.routes.ts
│   │   │       │   │   └── byProduct.service.ts
│   │   │       │   ├── dashboard
│   │   │       │   │   ├── dashboard.controller.ts
│   │   │       │   │   ├── dashboard.routes.ts
│   │   │       │   │   └── dashboard.service.ts
│   │   │       │   ├── exports
│   │   │       │   │   ├── export.controller.ts
│   │   │       │   │   └── export.routes.ts
│   │   │       │   ├── orderPipeline
│   │   │       │   │   ├── orderPipeline.controller.ts
│   │   │       │   │   ├── orderPipeline.routes.ts
│   │   │       │   │   └── orderPipeline.service.ts
│   │   │       │   ├── paymentMethods
│   │   │       │   │   ├── paymentMethods.controller.ts
│   │   │       │   │   ├── paymentMethods.routes.ts
│   │   │       │   │   └── paymentMethods.service.ts
│   │   │       │   ├── pendingInvoices
│   │   │       │   │   ├── pendingInvoices.controller.ts
│   │   │       │   │   ├── pendingInvoices.routes.ts
│   │   │       │   │   └── pendingInvoices.service.ts
│   │   │       │   ├── byCustomer.controller.ts
│   │   │       │   ├── byPeriod.controller.ts
│   │   │       │   ├── byProduct.controller.ts
│   │   │       │   ├── index.ts
│   │   │       │   ├── sales.controller.ts
│   │   │       │   └── sales.service.ts
│   │   │       ├── shared
│   │   │       │   ├── constants
│   │   │       │   │   ├── index.ts
│   │   │       │   │   ├── messages.ts
│   │   │       │   │   └── sales.constants.ts
│   │   │       │   ├── middleware
│   │   │       │   │   ├── checkPayment.middleware.ts
│   │   │       │   │   └── validateCustomer.middleware.ts
│   │   │       │   └── utils
│   │   │       │       ├── index.ts
│   │   │       │       ├── invoiceNumberGenerator.ts
│   │   │       │       ├── orderNumberGenerator.ts
│   │   │       │       └── taxCalculator.ts
│   │   │       ├── tests
│   │   │       │   ├── fixtures
│   │   │       │   ├── integration
│   │   │       │   │   └── complete-sale-flow.test.ts
│   │   │       │   └── unit
│   │   │       ├── README.md
│   │   │       └── index.ts
│   │   ├── generated
│   │   │   └── prisma
│   │   │       ├── internal
│   │   │       │   ├── class.ts
│   │   │       │   ├── prismaNamespace.ts
│   │   │       │   └── prismaNamespaceBrowser.ts
│   │   │       ├── models
│   │   │       │   ├── Adjustment.ts
│   │   │       │   ├── AdjustmentItem.ts
│   │   │       │   ├── AuditLog.ts
│   │   │       │   ├── Batch.ts
│   │   │       │   ├── Brand.ts
│   │   │       │   ├── BulkOperation.ts
│   │   │       │   ├── Category.ts
│   │   │       │   ├── CompanyRole.ts
│   │   │       │   ├── Customer.ts
│   │   │       │   ├── CycleCount.ts
│   │   │       │   ├── CycleCountItem.ts
│   │   │       │   ├── Empresa.ts
│   │   │       │   ├── EntryNote.ts
│   │   │       │   ├── EntryNoteItem.ts
│   │   │       │   ├── Event.ts
│   │   │       │   ├── ExitNote.ts
│   │   │       │   ├── ExitNoteItem.ts
│   │   │       │   ├── Invoice.ts
│   │   │       │   ├── InvoiceItem.ts
│   │   │       │   ├── Item.ts
│   │   │       │   ├── ItemImage.ts
│   │   │       │   ├── Loan.ts
│   │   │       │   ├── LoanItem.ts
│   │   │       │   ├── Membership.ts
│   │   │       │   ├── MembershipPermission.ts
│   │   │       │   ├── Model.ts
│   │   │       │   ├── ModelCompatibility.ts
│   │   │       │   ├── Movement.ts
│   │   │       │   ├── Order.ts
│   │   │       │   ├── OrderItem.ts
│   │   │       │   ├── Payment.ts
│   │   │       │   ├── Permission.ts
│   │   │       │   ├── PreInvoice.ts
│   │   │       │   ├── PreInvoiceItem.ts
│   │   │       │   ├── Pricing.ts
│   │   │       │   ├── PricingTier.ts
│   │   │       │   ├── PurchaseOrder.ts
│   │   │       │   ├── PurchaseOrderItem.ts
│   │   │       │   ├── Reconciliation.ts
│   │   │       │   ├── ReconciliationItem.ts
│   │   │       │   ├── Reservation.ts
│   │   │       │   ├── ReturnOrder.ts
│   │   │       │   ├── ReturnOrderItem.ts
│   │   │       │   ├── RolePermission.ts
│   │   │       │   ├── SerialNumber.ts
│   │   │       │   ├── Stock.ts
│   │   │       │   ├── StockAlert.ts
│   │   │       │   ├── Supplier.ts
│   │   │       │   ├── Transfer.ts
│   │   │       │   ├── TransferItem.ts
│   │   │       │   ├── Unit.ts
│   │   │       │   ├── User.ts
│   │   │       │   └── Warehouse.ts
│   │   │       ├── browser.ts
│   │   │       ├── client.ts
│   │   │       ├── commonInputTypes.ts
│   │   │       ├── enums.ts
│   │   │       └── models.ts
│   │   ├── routes
│   │   │   ├── api.routes.ts
│   │   │   ├── auth.routes.ts
│   │   │   ├── companyRoles.routes.ts
│   │   │   ├── empresas.routes.ts
│   │   │   ├── memberships.routes.ts
│   │   │   └── users.routes.ts
│   │   ├── services
│   │   │   ├── audit.service.ts
│   │   │   ├── empresa-setup.service.ts
│   │   │   ├── jwt.service.ts
│   │   │   ├── prisma-tenant.service.ts
│   │   │   └── prisma.service.ts
│   │   ├── shared
│   │   │   ├── constants
│   │   │   │   ├── httpStatus.ts
│   │   │   │   ├── permissions.ts
│   │   │   │   └── roles.ts
│   │   │   ├── events
│   │   │   ├── exceptions
│   │   │   │   └── api.error.ts
│   │   │   ├── helpers
│   │   │   │   └── pagination.helper.ts
│   │   │   ├── interfaces
│   │   │   │   ├── IController.ts
│   │   │   │   ├── IRepository.ts
│   │   │   │   └── IService.ts
│   │   │   ├── middleware
│   │   │   │   ├── asyncHandler.middleware.ts
│   │   │   │   ├── authenticate.middleware.ts
│   │   │   │   ├── authorize.middleware.ts
│   │   │   │   ├── authorizeGlobal.middleware.ts
│   │   │   │   ├── empresa.middleware.ts
│   │   │   │   ├── errorHandler.middleware.ts
│   │   │   │   ├── index.ts
│   │   │   │   ├── rateLimiter.middleware.ts
│   │   │   │   ├── requestLogger.middleware.ts
│   │   │   │   └── validateRequest.middleware.ts
│   │   │   ├── types
│   │   │   │   └── event.types.ts
│   │   │   ├── utils
│   │   │   │   ├── apiError.ts
│   │   │   │   ├── apiResponse.ts
│   │   │   │   ├── dateHelper.ts
│   │   │   │   ├── errors.ts
│   │   │   │   ├── fileUpload.ts
│   │   │   │   ├── index.ts
│   │   │   │   ├── logger.ts
│   │   │   │   ├── numberFormatter.ts
│   │   │   │   ├── pagination.ts
│   │   │   │   ├── resolvePermissions.ts
│   │   │   │   ├── shutdown.ts
│   │   │   │   └── test.utils.ts
│   │   │   └── validators
│   │   │       ├── common.validator.ts
│   │   │       └── custom.validator.ts
│   │   ├── socket
│   │   │   └── index.ts
│   │   ├── types
│   │   │   ├── express.d.ts
│   │   │   ├── jwt.types.ts
│   │   │   └── prisma.types.ts
│   │   ├── .!33120!.DS_Store
│   │   ├── app.ts
│   │   └── index.ts
│   ├── .dockerignore
│   ├── .eslintrc.json
│   ├── .gitignore
│   ├── .prettierrc
│   ├── Dockerfile
│   ├── jest.config.js
│   ├── package-lock.json
│   ├── package.backup
│   ├── package.json
│   ├── prisma.config.d.ts
│   ├── prisma.config.js
│   ├── prisma.config.ts
│   └── tsconfig.json
├── contextos
│   ├── Plan_OC_Fiscal_AutoSys.docx
│   ├── Plan_OC_Fiscal_AutoSys.md
│   ├── Plan_Sales_Orders_Fiscal.md
│   ├── Plan_Sync_OC_EntryNotes.md
│   ├── contexto_de_los_permisos.md
│   ├── contexto_refactorizacion_delete_dialog.md
│   ├── contexto_refactorizacion_list_y_form.md
│   ├── contexto_refactorizacion_services_inventario.md
│   └── contexto_refactorizacion_usuarios.md
├── frontend
│   ├── app
│   │   ├── (autosys)
│   │   │   ├── autosys
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx
│   │   ├── (full-page)
│   │   │   ├── auth
│   │   │   │   ├── access
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── error
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── forgotpassword
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── lockscreen
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── login
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── newpassword
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── register
│   │   │   │   │   └── page.tsx
│   │   │   │   └── verification
│   │   │   │       └── page.tsx
│   │   │   ├── pages
│   │   │   │   └── notfound
│   │   │   │       └── page.tsx
│   │   │   └── layout.tsx
│   │   ├── (landing)
│   │   │   ├── landing
│   │   │   │   ├── landing.module.scss
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx
│   │   ├── (main)
│   │   │   ├── all-autosys
│   │   │   │   ├── create
│   │   │   │   └── list
│   │   │   │       └── page.tsx
│   │   │   ├── apps
│   │   │   │   └── blog
│   │   │   │       ├── detail
│   │   │   │       │   └── page.tsx
│   │   │   │       ├── edit
│   │   │   │       │   └── page.tsx
│   │   │   │       └── list
│   │   │   │           └── page.tsx
│   │   │   ├── autosys
│   │   │   │   └── operation
│   │   │   ├── dashboard-sales
│   │   │   │   ├── page-mala.tsx
│   │   │   │   └── page.tsx
│   │   │   ├── empresas
│   │   │   │   └── page.tsx
│   │   │   ├── partidas
│   │   │   │   └── page.tsx
│   │   │   ├── profile
│   │   │   │   ├── create
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── list
│   │   │   │   │   └── page.tsx
│   │   │   │   └── myProfile
│   │   │   │       └── page.tsx
│   │   │   ├── users
│   │   │   │   └── page.tsx
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx
│   │   ├── api
│   │   │   ├── auth
│   │   │   │   ├── [...nextauth]
│   │   │   │   │   └── route.ts
│   │   │   │   └── error
│   │   │   │       └── route.ts
│   │   │   ├── crm
│   │   │   │   ├── vehicleBrandService.ts
│   │   │   │   ├── vehicleModelService.ts
│   │   │   │   └── vehicleService.ts
│   │   │   ├── inventory
│   │   │   │   ├── adjustmentService.ts
│   │   │   │   ├── analyticsService.ts
│   │   │   │   ├── brandService.ts
│   │   │   │   ├── bulkService.ts
│   │   │   │   ├── categoryService.ts
│   │   │   │   ├── compatibilityService.ts
│   │   │   │   ├── cycleCountService.ts
│   │   │   │   ├── entryNoteService.ts
│   │   │   │   ├── exitNoteService.ts
│   │   │   │   ├── imageUploadService.ts
│   │   │   │   ├── index.ts
│   │   │   │   ├── itemModelService.ts
│   │   │   │   ├── itemService.ts
│   │   │   │   ├── loanService.ts
│   │   │   │   ├── modelService.ts
│   │   │   │   ├── movementService.ts
│   │   │   │   ├── purchaseOrderService.ts
│   │   │   │   ├── reconciliationService.ts
│   │   │   │   ├── reportService.ts
│   │   │   │   ├── reservationService.ts
│   │   │   │   ├── returnService.ts
│   │   │   │   ├── salesOrderService.ts
│   │   │   │   ├── searchService.ts
│   │   │   │   ├── stockService.ts
│   │   │   │   ├── supplierService.ts
│   │   │   │   ├── transferService.ts
│   │   │   │   ├── types.ts
│   │   │   │   ├── unitService.ts
│   │   │   │   ├── vehicleService.ts
│   │   │   │   └── warehouseService.ts
│   │   │   ├── sales
│   │   │   │   ├── customerService.ts
│   │   │   │   ├── customerService.ts.backup
│   │   │   │   ├── invoiceService.ts
│   │   │   │   ├── orderService.ts
│   │   │   │   ├── paymentService.ts
│   │   │   │   ├── preInvoiceService.ts
│   │   │   │   └── reportService.ts
│   │   │   ├── workshop
│   │   │   │   ├── index.ts
│   │   │   │   ├── invoiceService.ts
│   │   │   │   ├── paymentService.ts
│   │   │   │   ├── serviceCategoryService.ts
│   │   │   │   ├── serviceService.ts
│   │   │   │   ├── workOrderService.ts
│   │   │   │   ├── workOrderStatusService.ts
│   │   │   │   └── workshopService.ts
│   │   │   ├── abonoService.ts
│   │   │   ├── apiClient.ts
│   │   │   ├── autoSysService.ts
│   │   │   ├── balanceService.ts
│   │   │   ├── batchService.ts
│   │   │   ├── brentService.ts
│   │   │   ├── chequeoCalidadService.ts
│   │   │   ├── chequeoCantidadService.ts
│   │   │   ├── contactoService.ts
│   │   │   ├── contratoService.ts
│   │   │   ├── corteRefinacionService.ts
│   │   │   ├── cuentaService.ts
│   │   │   ├── despachoService.ts
│   │   │   ├── empresaService.ts
│   │   │   ├── facturaService.ts
│   │   │   ├── healthCheck.ts
│   │   │   ├── index.ts
│   │   │   ├── lineaDespachoService.ts
│   │   │   ├── lineaRecepcionService.ts
│   │   │   ├── notificacionService.ts
│   │   │   ├── notificationService.ts
│   │   │   ├── oilDerivativesService.ts
│   │   │   ├── operadorService.ts
│   │   │   ├── partidaService.ts
│   │   │   ├── productoService.ts
│   │   │   ├── recepcionService.ts
│   │   │   ├── refinacionSalidaService.ts
│   │   │   ├── refinacionService.ts
│   │   │   ├── refineriaService.ts
│   │   │   ├── roleService.ts
│   │   │   ├── serialNumberService.ts
│   │   │   ├── serviceBayService.ts
│   │   │   ├── tanqueService.ts
│   │   │   ├── tipoProductoService.ts
│   │   │   ├── torreDestilacionService.ts
│   │   │   ├── upload.js
│   │   │   └── userService.ts
│   │   ├── empresa
│   │   │   ├── concesionario
│   │   │   │   └── page.tsx
│   │   │   ├── crm
│   │   │   │   ├── clientes
│   │   │   │   │   └── page.tsx
│   │   │   │   └── vehiculos
│   │   │   │       ├── marcas
│   │   │   │       │   └── page.tsx
│   │   │   │       ├── modelos
│   │   │   │       │   └── page.tsx
│   │   │   │       └── page.tsx
│   │   │   ├── finance
│   │   │   │   ├── page.tsx
│   │   │   │   └── page.tsx.backup
│   │   │   ├── inventario
│   │   │   │   ├── ajustes
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── almacenes
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── catalogo
│   │   │   │   ├── categorias
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── clientes
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── compatibilidad
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── configuracion
│   │   │   │   ├── conteos
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── dashboard
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── devoluciones
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── importar
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── invoice
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── items
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── marcas
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── modelos
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── movimientos
│   │   │   │   │   ├── [id]
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── movimientos-hub
│   │   │   │   ├── notas-salida
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── ordenes-compra
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── ordenes-venta
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── payment
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── pre-invoice
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── prestamos
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── proveedores
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── recepciones
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── reconciliaciones
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── reportes
│   │   │   │   │   ├── abc
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   ├── envejecimiento
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   ├── kardex
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   ├── movimientos
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   ├── pronosticos
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   ├── rendimiento-proveedores
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   ├── rotacion
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   ├── salidas-sin-factura
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   ├── stock-bajo
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   ├── stock-muerto
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   ├── valoracion
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   ├── vencimientos
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── reservas
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── stock
│   │   │   │   │   ├── item
│   │   │   │   │   │   └── [id]
│   │   │   │   │   │       └── page.tsx
│   │   │   │   │   ├── low-stock
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── transferencias
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── trazabilidad
│   │   │   │   │   ├── lotes
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   └── seriales
│   │   │   │   │       └── page.tsx
│   │   │   │   └── unidades
│   │   │   │       └── page.tsx
│   │   │   ├── operation
│   │   │   │   ├── service-bays
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── workshop
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── page.tsx
│   │   │   │   └── page.tsx.backup
│   │   │   ├── reportes
│   │   │   │   └── inventario
│   │   │   │       ├── abc
│   │   │   │       │   └── page.tsx
│   │   │   │       ├── movimientos
│   │   │   │       │   └── page.tsx
│   │   │   │       ├── pronosticos
│   │   │   │       │   └── page.tsx
│   │   │   │       ├── rotacion
│   │   │   │       │   └── page.tsx
│   │   │   │       ├── stock-bajo
│   │   │   │       │   └── page.tsx
│   │   │   │       ├── stock-muerto
│   │   │   │       │   └── page.tsx
│   │   │   │       ├── valoracion
│   │   │   │       │   └── page.tsx
│   │   │   │       └── page.tsx
│   │   │   ├── ventas
│   │   │   │   ├── reportes
│   │   │   │   │   ├── metodos-pago
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   ├── pipeline-ordenes
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   ├── por-cliente
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   ├── por-periodo
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   ├── por-producto
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   ├── prefacturas-pendientes
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   └── page.tsx
│   │   │   │   └── page.tsx
│   │   │   ├── workshop
│   │   │   │   ├── invoices
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── payments
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── service-bays
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── service-categories
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── service-subcategories
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── services
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── work-order-statuses
│   │   │   │   │   └── page.tsx
│   │   │   │   └── page.tsx
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx
│   │   ├── favicon.ico
│   │   ├── layout.tsx
│   │   └── not-found.tsx
│   ├── components
│   │   ├── authComponents
│   │   │   ├── LoginForm.tsx
│   │   │   └── RegisterForm.tsx
│   │   ├── autosys
│   │   │   ├── AutoSysForm.tsx
│   │   │   └── AutoSysList.tsx
│   │   ├── common
│   │   │   ├── AppInitializer.tsx
│   │   │   ├── AuditHistoryDialog.tsx
│   │   │   ├── ClientProviders.tsx
│   │   │   ├── ConfirmAction.tsx
│   │   │   ├── CreateButton.tsx
│   │   │   ├── CustomActionButtons.tsx
│   │   │   ├── CustomCalendar.tsx
│   │   │   ├── DeleteConfirmDialog.tsx
│   │   │   ├── FCMSetup.tsx
│   │   │   ├── FormActionButtons.tsx
│   │   │   ├── PhoneInput.md
│   │   │   ├── PhoneInput.tsx
│   │   │   ├── RifInput.tsx
│   │   │   └── UnderConstruction.tsx
│   │   ├── crm
│   │   │   ├── vehicle-brands
│   │   │   │   ├── VehicleBrandForm.tsx
│   │   │   │   └── VehicleBrandList.tsx
│   │   │   ├── vehicle-models
│   │   │   │   ├── VehicleModelForm.tsx
│   │   │   │   └── VehicleModelList.tsx
│   │   │   └── vehicles
│   │   │       ├── VehicleForm.tsx
│   │   │       └── VehicleList.tsx
│   │   ├── dashboardOpComponents
│   │   │   ├── CardDespachoPorRefineria.tsx
│   │   │   ├── CardRecepcionesPorRefineria.tsx
│   │   │   ├── DashboardMain.tsx
│   │   │   ├── DashboardOperacionesGlobal.tsx
│   │   │   ├── DashboardRefinerias.tsx
│   │   │   ├── FiltrosDashboard.tsx
│   │   │   ├── GraficaDespachoPorRefineria.tsx
│   │   │   ├── GraficaRecepcionesPorRefineria.tsx
│   │   │   └── RecepcionDashboard.tsx
│   │   ├── empresas
│   │   │   ├── EmpresaForm.tsx
│   │   │   ├── EmpresaRoles.tsx
│   │   │   └── EmpresasList.tsx
│   │   ├── gestionGastosComponents
│   │   │   └── partidaComponents
│   │   │       ├── PartidaForm.tsx
│   │   │       └── PartidaList.tsx
│   │   ├── inventory
│   │   │   ├── adjustments
│   │   │   │   ├── AdjustmentDetail.tsx
│   │   │   │   ├── AdjustmentForm.tsx
│   │   │   │   └── AdjustmentList.tsx
│   │   │   ├── batches
│   │   │   │   ├── BatchDetail.tsx
│   │   │   │   ├── BatchForm.tsx
│   │   │   │   └── BatchList.tsx
│   │   │   ├── brands
│   │   │   │   ├── BrandForm.tsx
│   │   │   │   └── BrandList.tsx
│   │   │   ├── bulk
│   │   │   │   ├── BulkExport.tsx
│   │   │   │   ├── BulkHistory.tsx
│   │   │   │   └── BulkImport.tsx
│   │   │   ├── categories
│   │   │   │   ├── CategoryForm.tsx
│   │   │   │   └── CategoryList.tsx
│   │   │   ├── common
│   │   │   │   ├── ItemRow.tsx
│   │   │   │   ├── ItemsTable.tsx
│   │   │   │   ├── OrderFinancialSummary.tsx
│   │   │   │   └── TotalsFooter.tsx
│   │   │   ├── customers
│   │   │   │   ├── CustomerForm.tsx
│   │   │   │   └── CustomerList.tsx
│   │   │   ├── cycleCounts
│   │   │   │   ├── CycleCountDetail.tsx
│   │   │   │   ├── CycleCountForm.tsx
│   │   │   │   └── CycleCountList.tsx
│   │   │   ├── dashboard
│   │   │   │   ├── DiscrepancyWidget.tsx
│   │   │   │   ├── InventoryDashboard.tsx
│   │   │   │   └── QuickActions.tsx
│   │   │   ├── entryNotes
│   │   │   │   ├── EntryNoteForm.tsx
│   │   │   │   ├── EntryNoteList.tsx
│   │   │   │   └── EntryNoteStepper.tsx
│   │   │   ├── exitNotes
│   │   │   │   ├── ExitNoteDetailDialog.tsx
│   │   │   │   ├── ExitNoteForm.tsx
│   │   │   │   ├── ExitNoteList.tsx
│   │   │   │   └── ExitNoteStepper.tsx
│   │   │   ├── itemModels
│   │   │   │   ├── ItemModelForm.tsx
│   │   │   │   ├── ItemModelList.tsx
│   │   │   │   └── ModelCompatibilitySelector.tsx
│   │   │   ├── items
│   │   │   │   ├── ItemForm.tsx
│   │   │   │   ├── ItemImageUpload.tsx
│   │   │   │   ├── ItemList.tsx
│   │   │   │   └── ItemListBackup.tsx
│   │   │   ├── loans
│   │   │   │   ├── LoanDetail.tsx
│   │   │   │   ├── LoanForm.tsx
│   │   │   │   ├── LoanList.tsx
│   │   │   │   └── LoanReturnDialog.tsx
│   │   │   ├── models
│   │   │   │   └── CompatibilityMatrix.tsx
│   │   │   ├── movements
│   │   │   │   ├── MovementDetailForm.tsx
│   │   │   │   ├── MovementForm.tsx
│   │   │   │   └── MovementList.tsx
│   │   │   ├── purchaseOrders
│   │   │   │   ├── PurchaseOrderForm.tsx
│   │   │   │   ├── PurchaseOrderList.tsx
│   │   │   │   ├── PurchaseOrderStepper.tsx
│   │   │   │   └── ReceiveOrderDialog.tsx
│   │   │   ├── reconciliations
│   │   │   │   ├── ReconciliationDetail.tsx
│   │   │   │   ├── ReconciliationForm.tsx
│   │   │   │   └── ReconciliationList.tsx
│   │   │   ├── reports
│   │   │   │   ├── ABCAnalysis.tsx
│   │   │   │   ├── ForecastingView.tsx
│   │   │   │   ├── InventoryDashboard.tsx
│   │   │   │   ├── KardexReport.tsx
│   │   │   │   ├── ReportsTable.tsx
│   │   │   │   ├── SupplierPerformanceReport.tsx
│   │   │   │   └── TurnoverAnalysis.tsx
│   │   │   ├── reservations
│   │   │   │   ├── ReservationForm.tsx
│   │   │   │   └── ReservationList.tsx
│   │   │   ├── returns
│   │   │   │   ├── ReturnDetail.tsx
│   │   │   │   ├── ReturnForm.tsx
│   │   │   │   └── ReturnList.tsx
│   │   │   ├── salesOrders
│   │   │   │   ├── ConfirmOrderDialog.tsx
│   │   │   │   ├── SalesOrderForm.tsx
│   │   │   │   ├── SalesOrderList.tsx
│   │   │   │   └── ShipOrderDialog.tsx
│   │   │   ├── search
│   │   │   │   └── AdvancedSearchPanel.tsx
│   │   │   ├── serialNumbers
│   │   │   │   ├── SerialNumberDetail.tsx
│   │   │   │   ├── SerialNumberForm.tsx
│   │   │   │   ├── SerialNumberList.tsx
│   │   │   │   └── SerialNumberTimeline.tsx
│   │   │   ├── stocks
│   │   │   │   ├── StockAdjustDialog.tsx
│   │   │   │   ├── StockForm.tsx
│   │   │   │   └── StockList.tsx
│   │   │   ├── suppliers
│   │   │   │   ├── SupplierForm.tsx
│   │   │   │   └── SupplierList.tsx
│   │   │   ├── transfers
│   │   │   │   ├── TransferDetail.tsx
│   │   │   │   ├── TransferForm.tsx
│   │   │   │   └── TransferList.tsx
│   │   │   ├── units
│   │   │   │   ├── UnitForm.tsx
│   │   │   │   └── UnitList.tsx
│   │   │   ├── vehicles
│   │   │   └── warehouses
│   │   │       ├── WarehouseForm.tsx
│   │   │       └── WarehouseList.tsx
│   │   ├── pdf
│   │   │   ├── templates
│   │   │   │   ├── AbonoTemplate.tsx
│   │   │   │   ├── AbonosPorMesTemplate.tsx
│   │   │   │   ├── BalancesReportePDF.tsx
│   │   │   │   ├── ChequeoCalidadTemplate.tsx
│   │   │   │   ├── ChequeoCantidadTemplate.tsx
│   │   │   │   ├── ContactosReporteTemplate.tsx
│   │   │   │   ├── ContratoTemplate.tsx
│   │   │   │   ├── ContratosReporteTemplate.tsx
│   │   │   │   ├── ContratosTemplate.tsx
│   │   │   │   ├── CuentasPendientesTemplate.tsx
│   │   │   │   ├── DespachoTemplate.tsx
│   │   │   │   ├── FacturaTemplate.tsx
│   │   │   │   ├── recepcionTemplate.tsx
│   │   │   │   └── reportesLogisticaTemplate.tsx
│   │   │   ├── ui
│   │   │   ├── PDFDownloadButton.tsx
│   │   │   ├── PDFGenerator.tsx
│   │   │   └── PDFViewer.tsx
│   │   ├── profile
│   │   │   ├── MyprofileForm.tsx
│   │   │   └── MyprofileList.tsx
│   │   ├── sales
│   │   │   ├── customer
│   │   │   │   ├── CustomerForm.tsx
│   │   │   │   └── CustomerList.tsx
│   │   │   ├── invoice
│   │   │   │   └── InvoiceList.tsx
│   │   │   ├── order
│   │   │   │   ├── OrderForm.tsx
│   │   │   │   ├── OrderList.tsx
│   │   │   │   └── OrderStepper.tsx
│   │   │   ├── payments
│   │   │   │   ├── PaymentDialog.tsx
│   │   │   │   └── PaymentList.tsx
│   │   │   └── preInvoice
│   │   │       ├── PreInvoiceList.tsx
│   │   │       └── PreInvoiceStepper.tsx
│   │   ├── usuarioComponents
│   │   │   ├── MembershipForm.tsx
│   │   │   ├── MembershipPermissions.tsx
│   │   │   ├── PasswordRequirements.tsx
│   │   │   ├── UsuarioChangePasswordForm.tsx
│   │   │   ├── UsuarioForm.tsx
│   │   │   ├── UsuarioList.tsx
│   │   │   └── UsuarioMemberships.tsx
│   │   └── workshop
│   │       ├── invoices
│   │       │   ├── InvoiceForm.tsx
│   │       │   ├── InvoiceList.tsx
│   │       │   └── InvoicePaymentsDialog.tsx
│   │       ├── kanban
│   │       │   ├── FRONTEND_IMPLEMENTATION.md
│   │       │   ├── KanbanCard.tsx
│   │       │   ├── KanbanColumn.tsx
│   │       │   └── WorkOrderKanban.tsx
│   │       ├── operations
│   │       │   ├── AssignWorkOrderDialog.tsx
│   │       │   ├── BayDetailsDialog.tsx
│   │       │   ├── BayTimeline.tsx
│   │       │   ├── MetricsPanel.tsx
│   │       │   ├── OperationalDashboard.tsx
│   │       │   ├── ReleaseBayDialog.tsx
│   │       │   └── ServiceBayCard.tsx
│   │       ├── payments
│   │       │   ├── PaymentForm.tsx
│   │       │   └── PaymentList.tsx
│   │       ├── service-bays
│   │       │   ├── README.md
│   │       │   ├── ServiceBayForm.tsx
│   │       │   └── ServiceBayList.tsx
│   │       ├── service-categories
│   │       │   ├── ServiceCategoryForm.tsx
│   │       │   └── ServiceCategoryList.tsx
│   │       ├── service-subcategories
│   │       │   ├── ServiceSubcategoryForm.tsx
│   │       │   └── ServiceSubcategoryList.tsx
│   │       ├── services
│   │       │   ├── ServiceForm.tsx
│   │       │   └── ServiceList.tsx
│   │       ├── work-order-statuses
│   │       │   ├── WorkOrderStatusForm.tsx
│   │       │   └── WorkOrderStatusList.tsx
│   │       └── work-orders
│   │           ├── WorkOrderForm.tsx
│   │           ├── WorkOrderHistoryDialog.tsx
│   │           ├── WorkOrderItemsDialog.tsx
│   │           ├── WorkOrderItemsForm.tsx
│   │           └── WorkOrderList.tsx
│   ├── docs
│   │   ├── api
│   │   │   ├── vehicles-api.md
│   │   │   └── workshop-api.md
│   │   ├── architecture
│   │   │   └── 01-project-structure.md
│   │   ├── guides
│   │   │   └── creating-modules.md
│   │   ├── modules
│   │   │   ├── crm
│   │   │   │   └── README.md
│   │   │   ├── workshop
│   │   │   │   └── README.md
│   │   │   ├── INVENTORY_CUSTOMERS.md
│   │   │   ├── INVENTORY_MODULE.md
│   │   │   ├── INVOICES.md
│   │   │   ├── KANBAN.md
│   │   │   ├── PAYMENTS.md
│   │   │   ├── SERVICE_BAYS.md
│   │   │   ├── SERVICE_BAYS_EXAMPLES.md
│   │   │   ├── SERVICE_BAYS_INDEX.md
│   │   │   ├── SERVICE_BAYS_QUICK_REF.md
│   │   │   ├── SERVICE_BAYS_SUMMARY.md
│   │   │   ├── SERVICE_BAY_FRONTEND_INTEGRATION.md
│   │   │   └── WORKSHOP_MODULE.md
│   │   ├── DIAGNOSTIC_GUIDE.md
│   │   └── README.md
│   ├── hooks
│   │   ├── useAutoSysDataFull.ts
│   │   ├── useBcvRate.ts
│   │   ├── useBunkeringData.ts
│   │   ├── useByRefineryData.ts
│   │   ├── useEmpresasDataFull.ts
│   │   ├── useNotifications.ts
│   │   ├── useOrderCalculation.ts
│   │   ├── useRefineryData.ts
│   │   ├── useRefineryDataFull.ts
│   │   ├── useRefineryPrecios.ts
│   │   ├── useServiceBayFilters.ts
│   │   ├── useSocket.ts
│   │   ├── useStockAlerts.ts
│   │   ├── useUserRoles.ts
│   │   └── useWorkshopDataFull.ts
│   ├── layout
│   │   ├── context
│   │   │   ├── layoutcontext.tsx
│   │   │   └── menucontext.tsx
│   │   ├── hooks
│   │   │   └── useSubmenuOverlayPosition.ts
│   │   ├── AppBreadCrumb.tsx
│   │   ├── AppConfig.tsx
│   │   ├── AppFooter.tsx
│   │   ├── AppMenu.tsx
│   │   ├── AppMenuAutoSys.tsx
│   │   ├── AppMenuEmpresa.tsx
│   │   ├── AppMenuitem.tsx
│   │   ├── AppNotificationDropdown.tsx
│   │   ├── AppSidebar.tsx
│   │   ├── AppSubMenu.tsx
│   │   ├── AppTopbar.tsx
│   │   └── layout.tsx
│   ├── lib
│   │   ├── roles.ts
│   │   └── utils.ts
│   ├── libs
│   │   ├── interfaces
│   │   │   ├── inventory
│   │   │   │   ├── adjustment.interface.tsx
│   │   │   │   ├── customer.interface.ts
│   │   │   │   ├── cycleCount.interface.tsx
│   │   │   │   ├── entryNote.interface.tsx
│   │   │   │   ├── exitNote.interface.tsx
│   │   │   │   ├── index.tsx
│   │   │   │   ├── item.interface.ts
│   │   │   │   ├── item.interface.tsx
│   │   │   │   ├── movement.interface.tsx
│   │   │   │   ├── purchaseOrder.interface.tsx
│   │   │   │   ├── reconciliation.interface.tsx
│   │   │   │   ├── reservation.interface.tsx
│   │   │   │   ├── salesOrder.interface.ts
│   │   │   │   ├── stock.interface.tsx
│   │   │   │   ├── supplier.interface.tsx
│   │   │   │   ├── transfer.interface.tsx
│   │   │   │   ├── unit.interface.ts
│   │   │   │   ├── vehicle.interface.ts
│   │   │   │   └── warehouse.interface.tsx
│   │   │   ├── sales
│   │   │   │   ├── customer.interface.ts
│   │   │   │   ├── invoice.interface.ts
│   │   │   │   ├── order.interface.ts
│   │   │   │   ├── payment.interface.ts
│   │   │   │   └── preInvoice.interface.ts
│   │   │   ├── workshop
│   │   │   │   ├── index.ts
│   │   │   │   ├── invoice.interface.ts
│   │   │   │   ├── payment.interface.ts
│   │   │   │   ├── service.interface.ts
│   │   │   │   ├── serviceBay.interface.ts
│   │   │   │   ├── serviceBayDashboard.interface.ts
│   │   │   │   ├── serviceCategoryMain.interface.ts
│   │   │   │   ├── workOrder.interface.ts
│   │   │   │   ├── workOrderMain.interface.ts
│   │   │   │   └── workOrderStatus.interface.ts
│   │   │   ├── authInterface.tsx
│   │   │   ├── autoSysInterface.tsx
│   │   │   ├── balanceInterface.tsx
│   │   │   ├── chequeosInterface.tsx
│   │   │   ├── chequeosInterfaceBK.tsx
│   │   │   ├── configBunkeringInterface.tsx
│   │   │   ├── configRefineriaInterface.tsx
│   │   │   ├── contratoBKInterface.tsx
│   │   │   ├── contratoInterface.tsx
│   │   │   ├── corteRefinacionInterface.tsx
│   │   │   ├── despachoInterface.tsx
│   │   │   ├── despachoInterfaceBK.tsx
│   │   │   ├── empresaInterface.tsx
│   │   │   ├── facturaInterface.tsx
│   │   │   ├── index.tsx
│   │   │   ├── recepcionInterface.tsx
│   │   │   ├── recepcionInterfaceBK.tsx
│   │   │   ├── tipoProductoBKInterface.tsx
│   │   │   ├── tipoProductoInterface.tsx
│   │   │   └── workshopInterface.tsx
│   │   ├── zods
│   │   │   ├── inventory
│   │   │   │   ├── adjustmentZod.tsx
│   │   │   │   ├── customerZod.tsx
│   │   │   │   ├── cycleCountZod.tsx
│   │   │   │   ├── entryNoteZod.tsx
│   │   │   │   ├── exitNoteZod.tsx
│   │   │   │   ├── index.tsx
│   │   │   │   ├── itemZod.tsx
│   │   │   │   ├── movementZod.tsx
│   │   │   │   ├── purchaseOrderZod.tsx
│   │   │   │   ├── reconciliationZod.tsx
│   │   │   │   ├── reservationZod.tsx
│   │   │   │   ├── salesOrderZod.tsx
│   │   │   │   ├── stockZod.tsx
│   │   │   │   ├── supplierZod.tsx
│   │   │   │   ├── transferZod.tsx
│   │   │   │   ├── unitZod.tsx
│   │   │   │   ├── vehicleZod.tsx
│   │   │   │   └── warehouseZod.tsx
│   │   │   ├── sales
│   │   │   │   ├── customerZod.tsx
│   │   │   │   └── orderZod.tsx
│   │   │   ├── workshop
│   │   │   │   ├── index.tsx
│   │   │   │   ├── invoiceZod.tsx
│   │   │   │   ├── paymentZod.tsx
│   │   │   │   ├── serviceBaySchemas.ts
│   │   │   │   ├── serviceCategoryZod.tsx
│   │   │   │   ├── serviceZod.tsx
│   │   │   │   ├── workOrderStatusZod.tsx
│   │   │   │   └── workOrderZod.tsx
│   │   │   ├── authZod.tsx
│   │   │   ├── autoSysZod.tsx
│   │   │   ├── balanceZod.tsx
│   │   │   ├── batchZod.tsx
│   │   │   ├── chequeosZod.tsx
│   │   │   ├── chequeosZodBK.tsx
│   │   │   ├── configBunkeringZod.tsx
│   │   │   ├── configRefineriaZod.tsx
│   │   │   ├── contratoBKZod.tsx
│   │   │   ├── contratoZod.tsx
│   │   │   ├── corteRefinacionZod.tsx
│   │   │   ├── despachoZod.tsx
│   │   │   ├── despachoZodBK.tsx
│   │   │   ├── empresaZod.tsx
│   │   │   ├── facturaZod.tsx
│   │   │   ├── index.tsx
│   │   │   ├── recepcionZod.tsx
│   │   │   ├── recepcionZodBK.tsx
│   │   │   ├── serialNumberZod.tsx
│   │   │   ├── tipoProductoBKZod.tsx
│   │   │   ├── tipoProductoZod.tsx
│   │   │   └── workshopZod.tsx
│   │   ├── despachoWorkflow.ts
│   │   ├── interface.ts
│   │   ├── recepcionWorkflow.ts
│   │   └── zod.ts
│   ├── public
│   │   ├── demo
│   │   │   ├── data
│   │   │   │   ├── chat.json
│   │   │   │   ├── countries.json
│   │   │   │   ├── customers-large.json
│   │   │   │   ├── customers-medium.json
│   │   │   │   ├── customers-small.json
│   │   │   │   ├── file-management.json
│   │   │   │   ├── files-lazy.json
│   │   │   │   ├── files.json
│   │   │   │   ├── filesystem-lazy.json
│   │   │   │   ├── filesystem.json
│   │   │   │   ├── icons.json
│   │   │   │   ├── kanban.json
│   │   │   │   ├── mail.json
│   │   │   │   ├── members.json
│   │   │   │   ├── photos.json
│   │   │   │   ├── products-mixed.json
│   │   │   │   ├── products-orders-small.json
│   │   │   │   ├── products-orders.json
│   │   │   │   ├── products-small.json
│   │   │   │   ├── products.json
│   │   │   │   ├── scheduleevents.json
│   │   │   │   ├── tasks.json
│   │   │   │   ├── treenodes.json
│   │   │   │   └── treetablenodes.json
│   │   │   ├── images
│   │   │   │   ├── avatar
│   │   │   │   │   ├── circle
│   │   │   │   │   │   ├── avatar-f-1.png
│   │   │   │   │   │   ├── avatar-f-10.png
│   │   │   │   │   │   ├── avatar-f-10@2x.png
│   │   │   │   │   │   ├── avatar-f-11.png
│   │   │   │   │   │   ├── avatar-f-11@2x.png
│   │   │   │   │   │   ├── avatar-f-12.png
│   │   │   │   │   │   ├── avatar-f-12@2x.png
│   │   │   │   │   │   ├── avatar-f-1@2x.png
│   │   │   │   │   │   ├── avatar-f-2.png
│   │   │   │   │   │   ├── avatar-f-2@2x.png
│   │   │   │   │   │   ├── avatar-f-3.png
│   │   │   │   │   │   ├── avatar-f-3@2x.png
│   │   │   │   │   │   ├── avatar-f-4.png
│   │   │   │   │   │   ├── avatar-f-4@2x.png
│   │   │   │   │   │   ├── avatar-f-5.png
│   │   │   │   │   │   ├── avatar-f-5@2x.png
│   │   │   │   │   │   ├── avatar-f-6.png
│   │   │   │   │   │   ├── avatar-f-6@2x.png
│   │   │   │   │   │   ├── avatar-f-7.png
│   │   │   │   │   │   ├── avatar-f-7@2x.png
│   │   │   │   │   │   ├── avatar-f-8.png
│   │   │   │   │   │   ├── avatar-f-8@2x.png
│   │   │   │   │   │   ├── avatar-f-9.png
│   │   │   │   │   │   ├── avatar-f-9@2x.png
│   │   │   │   │   │   ├── avatar-m-1.png
│   │   │   │   │   │   ├── avatar-m-10.png
│   │   │   │   │   │   ├── avatar-m-10@2x.png
│   │   │   │   │   │   ├── avatar-m-11.png
│   │   │   │   │   │   ├── avatar-m-11@2x.png
│   │   │   │   │   │   ├── avatar-m-12.png
│   │   │   │   │   │   ├── avatar-m-12@2x.png
│   │   │   │   │   │   ├── avatar-m-1@2x.png
│   │   │   │   │   │   ├── avatar-m-2.png
│   │   │   │   │   │   ├── avatar-m-2@2x.png
│   │   │   │   │   │   ├── avatar-m-3.png
│   │   │   │   │   │   ├── avatar-m-3@2x.png
│   │   │   │   │   │   ├── avatar-m-4.png
│   │   │   │   │   │   ├── avatar-m-4@2x.png
│   │   │   │   │   │   ├── avatar-m-5.png
│   │   │   │   │   │   ├── avatar-m-5@2x.png
│   │   │   │   │   │   ├── avatar-m-6.png
│   │   │   │   │   │   ├── avatar-m-6@2x.png
│   │   │   │   │   │   ├── avatar-m-7-1.png
│   │   │   │   │   │   ├── avatar-m-7.png
│   │   │   │   │   │   ├── avatar-m-7@2x-1.png
│   │   │   │   │   │   ├── avatar-m-7@2x.png
│   │   │   │   │   │   ├── avatar-m-8.png
│   │   │   │   │   │   ├── avatar-m-8@2x.png
│   │   │   │   │   │   ├── avatar-m-9.png
│   │   │   │   │   │   └── avatar-m-9@2x.png
│   │   │   │   │   ├── circle-big
│   │   │   │   │   │   ├── avatar-f-1.png
│   │   │   │   │   │   ├── avatar-f-1@2x.png
│   │   │   │   │   │   ├── avatar-f-2.png
│   │   │   │   │   │   ├── avatar-f-2@2x.png
│   │   │   │   │   │   ├── avatar-f-3.png
│   │   │   │   │   │   ├── avatar-f-3@2x.png
│   │   │   │   │   │   ├── avatar-m-1.png
│   │   │   │   │   │   ├── avatar-m-1@2x.png
│   │   │   │   │   │   ├── avatar-m-2.png
│   │   │   │   │   │   ├── avatar-m-2@2x.png
│   │   │   │   │   │   ├── avatar-m-3.png
│   │   │   │   │   │   └── avatar-m-3@2x.png
│   │   │   │   │   ├── square
│   │   │   │   │   │   ├── avatar-f-1.jpg
│   │   │   │   │   │   ├── avatar-f-1@2x.jpg
│   │   │   │   │   │   ├── avatar-f-2.jpg
│   │   │   │   │   │   ├── avatar-f-2@2x.jpg
│   │   │   │   │   │   ├── avatar-m-1.jpg
│   │   │   │   │   │   └── avatar-m-1@2x.jpg
│   │   │   │   │   ├── amyelsner.png
│   │   │   │   │   ├── annafali.png
│   │   │   │   │   ├── asiyajavayant.png
│   │   │   │   │   ├── bernardodominic.png
│   │   │   │   │   ├── elwinsharvill.png
│   │   │   │   │   ├── ionibowcher.png
│   │   │   │   │   ├── ivanmagalhaes.png
│   │   │   │   │   ├── onyamalimba.png
│   │   │   │   │   ├── profile.jpg
│   │   │   │   │   ├── stephenshaw.png
│   │   │   │   │   └── xuxuefeng.png
│   │   │   │   ├── blocks
│   │   │   │   │   ├── about
│   │   │   │   │   │   └── about-1.png
│   │   │   │   │   ├── hero
│   │   │   │   │   │   └── hero-1.png
│   │   │   │   │   ├── logos
│   │   │   │   │   │   └── hyper.svg
│   │   │   │   │   └── team
│   │   │   │   │       ├── team-1.png
│   │   │   │   │       ├── team-2.png
│   │   │   │   │       ├── team-3.png
│   │   │   │   │       └── team-4.png
│   │   │   │   ├── blog
│   │   │   │   │   ├── blog-1.png
│   │   │   │   │   ├── blog-2.png
│   │   │   │   │   ├── blog-3.png
│   │   │   │   │   ├── blog-4.png
│   │   │   │   │   ├── blog-5.png
│   │   │   │   │   ├── blog-6.png
│   │   │   │   │   └── blogdetail.png
│   │   │   │   ├── contact
│   │   │   │   │   ├── map-dark.svg
│   │   │   │   │   └── map-light.svg
│   │   │   │   ├── dashboard
│   │   │   │   │   ├── bg-detail.svg
│   │   │   │   │   ├── bg-product.jpg
│   │   │   │   │   ├── camera.png
│   │   │   │   │   ├── completion-graph-dark.svg
│   │   │   │   │   ├── completion-graph.svg
│   │   │   │   │   ├── cupcake.png
│   │   │   │   │   ├── drink.png
│   │   │   │   │   ├── headphone2.png
│   │   │   │   │   ├── headphones.png
│   │   │   │   │   ├── interactions-dark.svg
│   │   │   │   │   ├── interactions.svg
│   │   │   │   │   ├── locations-dark.svg
│   │   │   │   │   ├── locations.svg
│   │   │   │   │   ├── product-watch.png
│   │   │   │   │   ├── rate-dark.svg
│   │   │   │   │   ├── rate.svg
│   │   │   │   │   ├── sneaker.png
│   │   │   │   │   ├── spoon.png
│   │   │   │   │   ├── sunglasses.png
│   │   │   │   │   ├── tripod.png
│   │   │   │   │   ├── users-dark.svg
│   │   │   │   │   └── users.svg
│   │   │   │   ├── ecommerce
│   │   │   │   │   ├── order-history
│   │   │   │   │   │   ├── orderhistory-1.png
│   │   │   │   │   │   ├── orderhistory-2.png
│   │   │   │   │   │   ├── orderhistory-3.png
│   │   │   │   │   │   ├── orderhistory-4.png
│   │   │   │   │   │   ├── orderhistory-5.png
│   │   │   │   │   │   └── orderhistory-6.png
│   │   │   │   │   ├── ordersummary
│   │   │   │   │   │   ├── order-summary-1-1.png
│   │   │   │   │   │   ├── order-summary-1-2.png
│   │   │   │   │   │   ├── order-summary-2-1.png
│   │   │   │   │   │   └── visa.png
│   │   │   │   │   ├── product-list
│   │   │   │   │   │   ├── product-list-2-1.png
│   │   │   │   │   │   ├── product-list-2-2.png
│   │   │   │   │   │   ├── product-list-2-3.png
│   │   │   │   │   │   ├── product-list-2-4.png
│   │   │   │   │   │   ├── product-list-4-1.png
│   │   │   │   │   │   ├── product-list-4-2.png
│   │   │   │   │   │   ├── product-list-4-3.png
│   │   │   │   │   │   ├── product-list-4-4.png
│   │   │   │   │   │   ├── product-list-4-5.png
│   │   │   │   │   │   └── product-list-4-6.png
│   │   │   │   │   ├── productoverview
│   │   │   │   │   │   ├── product-overview-1-1.png
│   │   │   │   │   │   ├── product-overview-1-2.png
│   │   │   │   │   │   ├── product-overview-1-3.png
│   │   │   │   │   │   ├── product-overview-2-1.png
│   │   │   │   │   │   ├── product-overview-2-2.png
│   │   │   │   │   │   ├── product-overview-2-3.png
│   │   │   │   │   │   ├── product-overview-2-4.png
│   │   │   │   │   │   ├── product-overview-3-1.png
│   │   │   │   │   │   ├── product-overview-3-2.png
│   │   │   │   │   │   ├── product-overview-3-3.png
│   │   │   │   │   │   ├── product-overview-3-4.png
│   │   │   │   │   │   ├── product-overview-4-1.png
│   │   │   │   │   │   ├── product-overview-4-2.png
│   │   │   │   │   │   ├── product-overview-4-3.png
│   │   │   │   │   │   └── product-suggestion.png
│   │   │   │   │   ├── shop
│   │   │   │   │   │   ├── flag.png
│   │   │   │   │   │   ├── shop-1.png
│   │   │   │   │   │   ├── shop-2.png
│   │   │   │   │   │   ├── shop-3.png
│   │   │   │   │   │   ├── shop-4.png
│   │   │   │   │   │   ├── shop-5.png
│   │   │   │   │   │   └── shop-6.png
│   │   │   │   │   └── shopping-cart
│   │   │   │   │       ├── shopping-cart-2-1.png
│   │   │   │   │       └── shopping-cart-2-2.png
│   │   │   │   ├── flag
│   │   │   │   │   └── flag_placeholder.png
│   │   │   │   ├── galleria
│   │   │   │   │   ├── galleria1.jpg
│   │   │   │   │   ├── galleria10.jpg
│   │   │   │   │   ├── galleria10s.jpg
│   │   │   │   │   ├── galleria11.jpg
│   │   │   │   │   ├── galleria11s.jpg
│   │   │   │   │   ├── galleria12.jpg
│   │   │   │   │   ├── galleria12s.jpg
│   │   │   │   │   ├── galleria13.jpg
│   │   │   │   │   ├── galleria13s.jpg
│   │   │   │   │   ├── galleria14.jpg
│   │   │   │   │   ├── galleria14s.jpg
│   │   │   │   │   ├── galleria15.jpg
│   │   │   │   │   ├── galleria15s.jpg
│   │   │   │   │   ├── galleria1s.jpg
│   │   │   │   │   ├── galleria2.jpg
│   │   │   │   │   ├── galleria2s.jpg
│   │   │   │   │   ├── galleria3.jpg
│   │   │   │   │   ├── galleria3s.jpg
│   │   │   │   │   ├── galleria4.jpg
│   │   │   │   │   ├── galleria4s.jpg
│   │   │   │   │   ├── galleria5.jpg
│   │   │   │   │   ├── galleria5s.jpg
│   │   │   │   │   ├── galleria6.jpg
│   │   │   │   │   ├── galleria6s.jpg
│   │   │   │   │   ├── galleria7.jpg
│   │   │   │   │   ├── galleria7s.jpg
│   │   │   │   │   ├── galleria8.jpg
│   │   │   │   │   ├── galleria8s.jpg
│   │   │   │   │   ├── galleria9.jpg
│   │   │   │   │   └── galleria9s.jpg
│   │   │   │   ├── logo
│   │   │   │   │   ├── primevue-white.svg
│   │   │   │   │   └── primevue.svg
│   │   │   │   ├── nature
│   │   │   │   │   ├── nature1.jpg
│   │   │   │   │   ├── nature10.jpg
│   │   │   │   │   ├── nature11.jpg
│   │   │   │   │   ├── nature12.jpg
│   │   │   │   │   ├── nature2.jpg
│   │   │   │   │   ├── nature3.jpg
│   │   │   │   │   ├── nature4.jpg
│   │   │   │   │   ├── nature5.jpg
│   │   │   │   │   ├── nature6.jpg
│   │   │   │   │   ├── nature7.jpg
│   │   │   │   │   ├── nature8.jpg
│   │   │   │   │   └── nature9.jpg
│   │   │   │   ├── product
│   │   │   │   │   ├── bamboo-watch.jpg
│   │   │   │   │   ├── bamboo-watch.png
│   │   │   │   │   ├── black-watch.jpg
│   │   │   │   │   ├── black-watch.png
│   │   │   │   │   ├── blue-band.jpg
│   │   │   │   │   ├── blue-band.png
│   │   │   │   │   ├── blue-t-shirt.jpg
│   │   │   │   │   ├── blue-t-shirt.png
│   │   │   │   │   ├── bracelet.jpg
│   │   │   │   │   ├── brown-purse.jpg
│   │   │   │   │   ├── chakra-bracelet.jpg
│   │   │   │   │   ├── galaxy-earrings.jpg
│   │   │   │   │   ├── game-controller.jpg
│   │   │   │   │   ├── gaming-set.jpg
│   │   │   │   │   ├── gold-phone-case.jpg
│   │   │   │   │   ├── green-earbuds.jpg
│   │   │   │   │   ├── green-t-shirt.jpg
│   │   │   │   │   ├── grey-t-shirt.jpg
│   │   │   │   │   ├── headphones.jpg
│   │   │   │   │   ├── light-green-t-shirt.jpg
│   │   │   │   │   ├── lime-band.jpg
│   │   │   │   │   ├── mini-speakers.jpg
│   │   │   │   │   ├── painted-phone-case.jpg
│   │   │   │   │   ├── pink-band.jpg
│   │   │   │   │   ├── pink-purse.jpg
│   │   │   │   │   ├── product-placeholder.svg
│   │   │   │   │   ├── purple-band.jpg
│   │   │   │   │   ├── purple-gemstone-necklace.jpg
│   │   │   │   │   ├── purple-t-shirt.jpg
│   │   │   │   │   ├── shoes.jpg
│   │   │   │   │   ├── sneakers.jpg
│   │   │   │   │   ├── teal-t-shirt.jpg
│   │   │   │   │   ├── yellow-earbuds.jpg
│   │   │   │   │   ├── yoga-mat.jpg
│   │   │   │   │   └── yoga-set.jpg
│   │   │   │   ├── vehicles
│   │   │   │   ├── logo-white.svg
│   │   │   │   ├── logo.svg
│   │   │   │   └── placeholder-car.svg
│   │   │   └── vehicles.json
│   │   ├── fonts
│   │   │   ├── LICENSE.txt
│   │   │   ├── Roboto-Black.ttf
│   │   │   ├── Roboto-BlackItalic.ttf
│   │   │   ├── Roboto-Bold.ttf
│   │   │   ├── Roboto-BoldItalic.ttf
│   │   │   ├── Roboto-Italic.ttf
│   │   │   ├── Roboto-Light.ttf
│   │   │   ├── Roboto-LightItalic.ttf
│   │   │   ├── Roboto-Medium.ttf
│   │   │   ├── Roboto-MediumItalic.ttf
│   │   │   ├── Roboto-Regular.ttf
│   │   │   ├── Roboto-Thin.ttf
│   │   │   └── Roboto-ThinItalic.ttf
│   │   ├── layout
│   │   │   ├── images
│   │   │   │   ├── dashboard
│   │   │   │   │   ├── bg-detail.svg
│   │   │   │   │   ├── bg-product.png
│   │   │   │   │   ├── camera.png
│   │   │   │   │   ├── completion-graph-dark.svg
│   │   │   │   │   ├── completion-graph-light.svg
│   │   │   │   │   ├── cupcake.png
│   │   │   │   │   ├── drink.png
│   │   │   │   │   ├── headphone2.png
│   │   │   │   │   ├── headphones.png
│   │   │   │   │   ├── interactions-dark.svg
│   │   │   │   │   ├── interactions.svg
│   │   │   │   │   ├── locations-dark.svg
│   │   │   │   │   ├── locations.svg
│   │   │   │   │   ├── product-watch.png
│   │   │   │   │   ├── rate-dark.svg
│   │   │   │   │   ├── rate.svg
│   │   │   │   │   ├── sneaker.png
│   │   │   │   │   ├── spoon.png
│   │   │   │   │   ├── sunglasses.png
│   │   │   │   │   ├── tripod.png
│   │   │   │   │   ├── users-dark.svg
│   │   │   │   │   └── users.svg
│   │   │   │   ├── landing
│   │   │   │   │   ├── asset-enterprise.svg
│   │   │   │   │   ├── asset-free.svg
│   │   │   │   │   ├── asset-premium.svg
│   │   │   │   │   ├── ecosystem-line-effect.svg
│   │   │   │   │   ├── feature-blocks.svg
│   │   │   │   │   ├── feature-components.svg
│   │   │   │   │   ├── feature-designer.svg
│   │   │   │   │   ├── feature-icons.svg
│   │   │   │   │   ├── hero-dot-effect.svg
│   │   │   │   │   ├── icon-clean-code.svg
│   │   │   │   │   ├── icon-modern-design.svg
│   │   │   │   │   ├── icon-modern-responsive.svg
│   │   │   │   │   ├── line-effect-dark.svg
│   │   │   │   │   ├── line-effect.svg
│   │   │   │   │   ├── logo-v.svg
│   │   │   │   │   └── screen.jpg
│   │   │   │   ├── pages
│   │   │   │   │   ├── auth
│   │   │   │   │   │   ├── access-denied.svg
│   │   │   │   │   │   ├── access-denied2.svg
│   │   │   │   │   │   ├── access-denied3.svg
│   │   │   │   │   │   └── error.svg
│   │   │   │   │   ├── help
│   │   │   │   │   │   ├── blog1.jpg
│   │   │   │   │   │   ├── blog2.jpg
│   │   │   │   │   │   └── blog3.jpg
│   │   │   │   │   ├── access-denied.svg
│   │   │   │   │   ├── bg-help.png
│   │   │   │   │   ├── error.svg
│   │   │   │   │   ├── icon-crud.svg
│   │   │   │   │   └── icon-widgets.svg
│   │   │   │   ├── avatar.png
│   │   │   │   ├── avatarHombre.png
│   │   │   │   ├── logo-AutoSys-Completo.png
│   │   │   │   ├── logo-AutoSys-Logo.png
│   │   │   │   ├── logo-AutoSys-letra.png
│   │   │   │   ├── logo-AutoSys-negro.png
│   │   │   │   ├── logo-AutoSys.ico
│   │   │   │   ├── logo-dark.png
│   │   │   │   ├── logo-light.png
│   │   │   │   ├── maroilIcono.ico
│   │   │   │   └── tth-connector.png
│   │   │   ├── preloading.css
│   │   │   └── preloading.scss
│   │   ├── templates
│   │   │   └── items-import-template.csv
│   │   ├── theme
│   │   │   ├── theme-base
│   │   │   │   ├── components
│   │   │   │   │   ├── button
│   │   │   │   │   │   ├── _button.scss
│   │   │   │   │   │   ├── _speeddial.scss
│   │   │   │   │   │   └── _splitbutton.scss
│   │   │   │   │   ├── data
│   │   │   │   │   │   ├── _carousel.scss
│   │   │   │   │   │   ├── _datascroller.scss
│   │   │   │   │   │   ├── _datatable.scss
│   │   │   │   │   │   ├── _dataview.scss
│   │   │   │   │   │   ├── _filter.scss
│   │   │   │   │   │   ├── _orderlist.scss
│   │   │   │   │   │   ├── _organizationchart.scss
│   │   │   │   │   │   ├── _paginator.scss
│   │   │   │   │   │   ├── _picklist.scss
│   │   │   │   │   │   ├── _timeline.scss
│   │   │   │   │   │   ├── _tree.scss
│   │   │   │   │   │   └── _treetable.scss
│   │   │   │   │   ├── file
│   │   │   │   │   │   └── _fileupload.scss
│   │   │   │   │   ├── input
│   │   │   │   │   │   ├── _autocomplete.scss
│   │   │   │   │   │   ├── _calendar.scss
│   │   │   │   │   │   ├── _cascadeselect.scss
│   │   │   │   │   │   ├── _checkbox.scss
│   │   │   │   │   │   ├── _chips.scss
│   │   │   │   │   │   ├── _colorpicker.scss
│   │   │   │   │   │   ├── _dropdown.scss
│   │   │   │   │   │   ├── _editor.scss
│   │   │   │   │   │   ├── _inputgroup.scss
│   │   │   │   │   │   ├── _inputnumber.scss
│   │   │   │   │   │   ├── _inputswitch.scss
│   │   │   │   │   │   ├── _inputtext.scss
│   │   │   │   │   │   ├── _listbox.scss
│   │   │   │   │   │   ├── _mention.scss
│   │   │   │   │   │   ├── _multiselect.scss
│   │   │   │   │   │   ├── _password.scss
│   │   │   │   │   │   ├── _radiobutton.scss
│   │   │   │   │   │   ├── _rating.scss
│   │   │   │   │   │   ├── _selectbutton.scss
│   │   │   │   │   │   ├── _slider.scss
│   │   │   │   │   │   ├── _togglebutton.scss
│   │   │   │   │   │   └── _treeselect.scss
│   │   │   │   │   ├── menu
│   │   │   │   │   │   ├── _breadcrumb.scss
│   │   │   │   │   │   ├── _contextmenu.scss
│   │   │   │   │   │   ├── _dock.scss
│   │   │   │   │   │   ├── _megamenu.scss
│   │   │   │   │   │   ├── _menu.scss
│   │   │   │   │   │   ├── _menubar.scss
│   │   │   │   │   │   ├── _panelmenu.scss
│   │   │   │   │   │   ├── _slidemenu.scss
│   │   │   │   │   │   ├── _steps.scss
│   │   │   │   │   │   ├── _tabmenu.scss
│   │   │   │   │   │   └── _tieredmenu.scss
│   │   │   │   │   ├── messages
│   │   │   │   │   │   ├── _inlinemessage.scss
│   │   │   │   │   │   ├── _message.scss
│   │   │   │   │   │   └── _toast.scss
│   │   │   │   │   ├── misc
│   │   │   │   │   │   ├── _avatar.scss
│   │   │   │   │   │   ├── _badge.scss
│   │   │   │   │   │   ├── _blockui.scss
│   │   │   │   │   │   ├── _chip.scss
│   │   │   │   │   │   ├── _inplace.scss
│   │   │   │   │   │   ├── _progressbar.scss
│   │   │   │   │   │   ├── _scrolltop.scss
│   │   │   │   │   │   ├── _skeleton.scss
│   │   │   │   │   │   ├── _tag.scss
│   │   │   │   │   │   └── _terminal.scss
│   │   │   │   │   ├── multimedia
│   │   │   │   │   │   ├── _galleria.scss
│   │   │   │   │   │   └── _image.scss
│   │   │   │   │   ├── overlay
│   │   │   │   │   │   ├── _confirmpopup.scss
│   │   │   │   │   │   ├── _dialog.scss
│   │   │   │   │   │   ├── _overlaypanel.scss
│   │   │   │   │   │   ├── _sidebar.scss
│   │   │   │   │   │   └── _tooltip.scss
│   │   │   │   │   └── panel
│   │   │   │   │       ├── _accordion.scss
│   │   │   │   │       ├── _card.scss
│   │   │   │   │       ├── _divider.scss
│   │   │   │   │       ├── _fieldset.scss
│   │   │   │   │       ├── _panel.scss
│   │   │   │   │       ├── _scrollpanel.scss
│   │   │   │   │       ├── _splitter.scss
│   │   │   │   │       ├── _tabview.scss
│   │   │   │   │       └── _toolbar.scss
│   │   │   │   ├── _colors.scss
│   │   │   │   ├── _common.scss
│   │   │   │   ├── _components.scss
│   │   │   │   └── _mixins.scss
│   │   │   ├── theme-dark
│   │   │   │   ├── blue
│   │   │   │   │   ├── theme.css
│   │   │   │   │   └── theme.scss
│   │   │   │   ├── cyan
│   │   │   │   │   ├── theme.css
│   │   │   │   │   └── theme.scss
│   │   │   │   ├── deeppurple
│   │   │   │   │   ├── theme.css
│   │   │   │   │   └── theme.scss
│   │   │   │   ├── green
│   │   │   │   │   ├── theme.css
│   │   │   │   │   └── theme.scss
│   │   │   │   ├── indigo
│   │   │   │   │   ├── theme.css
│   │   │   │   │   └── theme.scss
│   │   │   │   ├── lime
│   │   │   │   │   ├── theme.css
│   │   │   │   │   └── theme.scss
│   │   │   │   ├── orange
│   │   │   │   │   ├── theme.css
│   │   │   │   │   └── theme.scss
│   │   │   │   ├── pink
│   │   │   │   │   ├── theme.css
│   │   │   │   │   └── theme.scss
│   │   │   │   ├── purple
│   │   │   │   │   ├── theme.css
│   │   │   │   │   └── theme.scss
│   │   │   │   ├── yellow
│   │   │   │   │   ├── theme.css
│   │   │   │   │   └── theme.scss
│   │   │   │   ├── _extensions.scss
│   │   │   │   └── _variables.scss
│   │   │   └── theme-light
│   │   │       ├── blue
│   │   │       │   ├── theme.css
│   │   │       │   └── theme.scss
│   │   │       ├── cyan
│   │   │       │   ├── theme.css
│   │   │       │   └── theme.scss
│   │   │       ├── deeppurple
│   │   │       │   ├── theme.css
│   │   │       │   └── theme.scss
│   │   │       ├── green
│   │   │       │   ├── theme.css
│   │   │       │   └── theme.scss
│   │   │       ├── indigo
│   │   │       │   ├── theme.css
│   │   │       │   └── theme.scss
│   │   │       ├── lime
│   │   │       │   ├── theme.css
│   │   │       │   └── theme.scss
│   │   │       ├── orange
│   │   │       │   ├── theme.css
│   │   │       │   └── theme.scss
│   │   │       ├── pink
│   │   │       │   ├── theme.css
│   │   │       │   └── theme.scss
│   │   │       ├── purple
│   │   │       │   ├── theme.css
│   │   │       │   └── theme.scss
│   │   │       ├── yellow
│   │   │       │   ├── theme.css
│   │   │       │   └── theme.scss
│   │   │       ├── _extensions.scss
│   │   │       └── _variables.scss
│   │   └── firebase-messaging-sw.js
│   ├── scripts
│   ├── store
│   │   ├── SWRCacheProvider.tsx
│   │   ├── autoSysStore.ts
│   │   ├── empresasStore.ts
│   │   ├── inventoryStore.ts
│   │   ├── operationsStore.ts
│   │   ├── refineriaStore.ts
│   │   ├── ventasStore.ts
│   │   └── workshopStore.ts
│   ├── styles
│   │   ├── demo
│   │   │   ├── flags
│   │   │   │   ├── flags.css
│   │   │   │   └── flags_responsive.png
│   │   │   ├── Demos.scss
│   │   │   ├── badges.scss
│   │   │   ├── blockviewer.scss
│   │   │   ├── code.scss
│   │   │   └── timeline.scss
│   │   ├── layout
│   │   │   ├── fonts
│   │   │   │   ├── lato-v17-latin-ext_latin-300.woff
│   │   │   │   ├── lato-v17-latin-ext_latin-300.woff2
│   │   │   │   ├── lato-v17-latin-ext_latin-700.woff
│   │   │   │   ├── lato-v17-latin-ext_latin-700.woff2
│   │   │   │   ├── lato-v17-latin-ext_latin-regular.woff
│   │   │   │   └── lato-v17-latin-ext_latin-regular.woff2
│   │   │   ├── sidebar
│   │   │   │   ├── _sidebar_slim.scss
│   │   │   │   ├── _sidebar_slim_plus.scss
│   │   │   │   └── _sidebar_vertical.scss
│   │   │   ├── theme
│   │   │   │   ├── _dark.scss
│   │   │   │   ├── _light.scss
│   │   │   │   ├── _primary.scss
│   │   │   │   └── _themes.scss
│   │   │   ├── _breadcrumb.scss
│   │   │   ├── _config.scss
│   │   │   ├── _content.scss
│   │   │   ├── _fonts.scss
│   │   │   ├── _footer.scss
│   │   │   ├── _main.scss
│   │   │   ├── _responsive.scss
│   │   │   ├── _sidebar.scss
│   │   │   ├── _topbar.scss
│   │   │   ├── _typography.scss
│   │   │   ├── _utils.scss
│   │   │   ├── layout.scss
│   │   │   └── preloading.scss
│   │   └── globals.css
│   ├── types
│   │   ├── batch.interface.ts
│   │   ├── demo.d.ts
│   │   ├── index.d.ts
│   │   ├── layout.d.ts
│   │   ├── pdfTypes.ts
│   │   ├── serialNumber.interface.ts
│   │   └── simulador.d.ts
│   ├── utils
│   │   ├── dateUtils.ts
│   │   ├── errorHandlers.ts
│   │   ├── funcionesUtiles.ts
│   │   ├── getFillCollor.ts
│   │   ├── pdfStyles.ts
│   │   ├── pdfUtils.ts
│   │   ├── refineryCalculations copy.ts
│   │   ├── refineryCalculations.ts
│   │   └── swrLocalStorageProvider.ts
│   ├── workers
│   │   └── recepcionesWorker.ts
│   ├── .gitignore
│   ├── 7250457_31145 (1).svg
│   ├── CHANGELOG.md
│   ├── Dockerfile
│   ├── README.md
│   ├── SALESORDER_API_DOCS.md
│   ├── auth-v5.ts
│   ├── components.json
│   ├── middleware-v5.ts
│   ├── middleware.ts
│   ├── next-env.d.ts
│   ├── next.config.js
│   ├── package-lock.json
│   ├── package.json
│   ├── tsconfig.json
│   └── vercel.json
├── .gitignore
├── ARCHITECTURE_PATTERNS.md
├── INVENTORY_MODULE_UPDATE.md
├── README.md
├── UI_modal peque;o.md
├── docker-compose.yml
└── skills-lock.json
```

---

_Generated by FileTree Pro Extension_
