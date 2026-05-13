import { describe, expect, test } from '@jest/globals'
import {
  DEFAULT_SYSTEM_PERMISSIONS_BY_ROLE,
  DEFAULT_SYSTEM_ROLE_NAMES,
} from './defaultCompanyRoles.js'
import { PERMISSION_CATALOG } from './permissionCatalog.js'
import { PERMISSIONS } from './permissions.js'

describe('DEFAULT_SYSTEM_PERMISSIONS_BY_ROLE', () => {
  test('el catalogo incluye todas las constantes de permisos', () => {
    const permissionCatalog = new Set<string>(
      PERMISSION_CATALOG.map((permission) => permission.code)
    )
    const missingPermissions = Object.values(PERMISSIONS).filter(
      (permission) => !permissionCatalog.has(permission)
    )

    expect(missingPermissions).toEqual([])
  })

  test('solo usa permisos declarados en el catalogo', () => {
    const permissionCatalog = new Set<string>(
      PERMISSION_CATALOG.map((permission) => permission.code)
    )
    const usedPermissions = Object.values(
      DEFAULT_SYSTEM_PERMISSIONS_BY_ROLE
    ).flat()

    const missingPermissions = usedPermissions.filter(
      (permission) => !permissionCatalog.has(permission)
    )

    expect(missingPermissions).toEqual([])
  })

  test('incluye los perfiles operativos base', () => {
    expect(DEFAULT_SYSTEM_ROLE_NAMES).toEqual(
      expect.arrayContaining([
        'COMPRADOR',
        'JEFE_COMPRAS',
        'ADMINISTRACION',
        'CAJERO',
        'CONTADOR',
        'TECNICO_TALLER',
        'JEFE_TALLER',
        'ASESOR_SERVICIO',
        'CRM_MARKETING',
        'CONCESIONARIO',
      ])
    )
  })

  test('separa compras de inventario para perfiles de compras', () => {
    expect(DEFAULT_SYSTEM_PERMISSIONS_BY_ROLE.COMPRADOR).toEqual(
      expect.arrayContaining([
        PERMISSIONS.PURCHASES_SUPPLIERS_VIEW,
        PERMISSIONS.PURCHASES_ORDERS_CREATE,
      ])
    )
    expect(DEFAULT_SYSTEM_PERMISSIONS_BY_ROLE.COMPRADOR).not.toContain(
      PERMISSIONS.INVENTORY_CREATE
    )
    expect(DEFAULT_SYSTEM_PERMISSIONS_BY_ROLE.JEFE_COMPRAS).toContain(
      PERMISSIONS.PURCHASES_ORDERS_APPROVE
    )
  })
})
