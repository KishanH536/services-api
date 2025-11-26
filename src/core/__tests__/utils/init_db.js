import { Sequelize } from 'sequelize'
import { PostgreSqlContainer } from '@testcontainers/postgresql'

import {
  id,
  uuid,
  name,
  getForeignUuid,
  json,
  jsonb,
  bool,
  updatedAt,
  createdAt,
  deletedAt,
  nullable,
  timezone,
  defaultValue,
  dateOnlyField,
  smallInt,
  idChar,
  text,
  intIdInc,
  typeFactory,
} from '../../../db/columns.js'

const enableLogging = false

// This code makes changes to the models that need changing in prep for
// table creation
async function tweakModels(sql) {
  // Remove enum from siteCurrent and billingPlans
  const typeReplacement = typeFactory(Sequelize.STRING)

  sql.define(
    'siteCurrent',
    {
      id: id(),
      projectId: getForeignUuid(sql.models.project, 'project_id'),
      userId: getForeignUuid(sql.models.user, 'user_id'),
      integratorId: nullable(name('integrator_id')),
      name: name(),
      // This one used to be enum
      type: typeReplacement(),
      fields: nullable(jsonb()),
      timezone: timezone(),
      createdAt: createdAt(),
      updatedAt: updatedAt(),
    },
    {
      timestamps: false,
      tableName: 'site_currents',
      schema: 'public',
    },
  )

  sql.define(
    'site',
    {
      id: id(),
      projectId: getForeignUuid(sql.models.project, 'project_id'),
      userId: getForeignUuid(sql.models.user, 'user_id'),
      integratorId: nullable(name('integrator_id')),
      createdAt: createdAt(),
      deletedAt: deletedAt(),
    },
    {
      paranoid: true,
      updatedAt: false,
      tableName: 'sites_all',
      schema: 'public',
      hooks: {
        async afterCreate(site) {
          await sql.models.siteCurrent.create({
            id: site.id,
            projectId: site.projectId,
            userId: site.userId,
            integratorId: site.integratorId,
            createdAt: site.createdAt,
            deletedAt: site.deletedAt,
          })
        },
      },
    },
  )

  // Stripped down plans table to eliminate some errors
  sql.define(
    'billingPlans',
    {
      id: id(),
      companyId: uuid('company_id'),
      startsFrom: dateOnlyField('starts_from'),
      endsAt: dateOnlyField('ends_at'),
      planTypeId: idChar('plan_type_id'),
      createdAt: createdAt(),
      deletedAt: deletedAt(),
      tiers: jsonb(),
      active: defaultValue(true)(bool()),
      productId: smallInt('product_id'),
      panelTier: json('panel_tier'),
      uploadTier: json('upload_tier'),
      alarmTier: json('alarm_tier'),
      emailNotification: jsonb('email_notification'),
      mainPlanType: typeReplacement(), // alarm,camera
    },
    {
      tableName: 'plans',
      schema: 'billing',
      updatedAt: false,
    },
  )

  // Hacked for testing...
  sql.define(
    'userCompanyPermission',
    {
      id: intIdInc(),
      userId: getForeignUuid(sql.models.user, 'user_id'),
      companyId: getForeignUuid(sql.models.company, 'company_id'),
      permissionId: text('permission_id'),
      createdAt: createdAt(),
      updatedAt: updatedAt(),
      deletedAt: deletedAt(),
    },
    {
      tableName: 'user_companies_permissions',
    },
  )

  // sql.define(
  //   'userSitePermission',
  //   {
  //     id: intIdInc(),
  //     userId: getForeignUuid(sql.models.user, 'user_id'),
  //     siteId: getForeignUuid(sql.models.site, 'site_id'),
  //     permissionId: text('permission_id'),
  //     displayName: text("display_name"),
  //     createdAt: createdAt(),
  //     updatedAt: updatedAt(),
  //     deletedAt: deletedAt(),
  //     rules: nullable(jsonb('rules')),
  //   },
  //   {
  //     tableName: 'user_sites_permissions',
  //   },
  // )
}

async function initDB() {
  const postgresContainer = await new PostgreSqlContainer().start()

  const sql = new Sequelize(postgresContainer.getConnectionUri())

  // Define and create the models and sets up the relationships between them

  const { default: requireModels } = await import('../../../db/schema.js')
  requireModels(sql)

  // Make changes to models before trying to create the tables
  tweakModels(sql)

  // Create schemas
  await sql.createSchema('email', { logging: enableLogging })
  await sql.createSchema('billing', { logging: enableLogging })

  // Create the tables (all public schema except where noted)
  // Order of table creation matters where a table has a
  // foreign key reference to one or more tables.
  // Tables that are referenced by other tables must be created
  // before the tables in which they are referenced.
  await sql.models.company.sync({
    force: true,
    logging: enableLogging,
  })
  await sql.models.user.sync({
    force: true,
    logging: enableLogging,
  })
  await sql.models.project.sync({
    force: true,
    logging: enableLogging,
  })
  await sql.models.site.sync({
    force: true,
    logging: enableLogging,
  })
  // Issues with enum type, so run them through tweakModels()
  await sql.models.siteCurrent.sync({
    force: true,
    logging: enableLogging,
  })
  await sql.models.permission.sync({
    force: true,
    logging: enableLogging,
  })
  await sql.models.userCompanyPermission.sync({
    force: true,
    logging: enableLogging,
  })
  await sql.models.userSitePermission.sync({
    force: true,
    logging: enableLogging,
  })
  // Need this for Elevate company creation, but the builtin model doesn't
  //   work, so it's tweaked to a basic form below
  await sql.models.userCompanyPermission.sync({
    force: true,
    logging: enableLogging,
  })
  await sql.models.token.sync({
    force: true,
    logging: enableLogging,
  })
  await sql.models.view.sync({
    force: true,
    logging: enableLogging,
  })
  await sql.models.viewUpdate.sync({
    force: true,
    logging: enableLogging,
  })
  await sql.models.viewCurrent.sync({
    force: true,
    logging: enableLogging,
  })
  // billing schema plans table
  await sql.models.billingPlans.sync({
    force: true,
    logging: enableLogging,
  })

  /* eslint-disable-next-line no-console */
  console.log('All models and associated tables have been created')

  return sql
}

export default initDB
