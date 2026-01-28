/**
 * Admin Permissions Components
 * 
 * This module exports all components related to the dynamic permissions
 * management system.
 */

export { default as RolesTab, RolesTabControlled } from './RolesTab'
export type { RolesTabProps } from './RolesTab'

export { default as PermissionsMatrix } from './PermissionsMatrix'
export type { PermissionsMatrixProps } from './PermissionsMatrix'

export { default as UsersTab, UsersTabControlled } from './UsersTab'
export type { UsersTabProps } from './UsersTab'

export { default as SectionsTab, SectionsTabControlled } from './SectionsTab'
export type { SectionsTabProps } from './SectionsTab'

export { default as AuditHistory } from './AuditHistory'
export type { AuditHistoryProps } from './AuditHistory'
