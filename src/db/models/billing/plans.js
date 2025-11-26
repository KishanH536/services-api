import Sequelize from 'sequelize'

import {
  id,
  uuid,
  createdAt,
  deletedAt,
  smallInt,
  idChar,
  dateOnlyField,
  text,
  json,
  jsonb,
  bool,
  defaultValue,
  mainPlanType,
  nullable,
} from '../../columns.js'

function create(sql) {
  sql.define(
    'billingPlans',
    {
      id: id(),
      companyId: uuid('company_id'),
      startsFrom: dateOnlyField('starts_from'),
      endsAt: dateOnlyField('ends_at'),
      currencyId: smallInt('currency_id'),
      planTypeId: idChar('plan_type_id'),
      // This is null in the DB, so I added nullable() (not nullable in api-server code)
      billingCycleId: nullable(idChar('billing_cycle_id')),
      // This is null in the DB, so I added nullable() (not nullable in api-server code)
      xeroId: nullable(idChar('xero_id')),
      numberOfCameras: smallInt('number_of_cameras'),
      createdAt: createdAt(),
      note: text(),
      deletedAt: deletedAt(),
      tiers: jsonb(),
      basePrice: {
        field: 'base_price',
        type: Sequelize.DECIMAL(15, 2),
      },
      active: defaultValue(true)(bool()),
      videofiedPrice: {
        field: 'videofied_price',
        type: Sequelize.DECIMAL(10, 2),
      },
      minPayment: {
        field: 'min_payment',
        type: Sequelize.DECIMAL(12, 2),
      },
      maxCameras: smallInt('max_cameras'),
      useDiscount: smallInt('use_discount'),
      discount: {
        field: 'discount',
        type: Sequelize.DECIMAL(5, 2),
      },
      // This is null in the DB, so I added nullable() (not nullable in api-server code)
      discountStartsFrom: nullable(dateOnlyField('discount_starts_from')),
      // This is null in the DB, so I added nullable() (not nullable in api-server code)
      discountEndsAt: nullable(dateOnlyField('discount_ends_at')),
      productId: smallInt('product_id'),
      panelTier: json('panel_tier'),
      uploadTier: json('upload_tier'),
      alarmTier: json('alarm_tier'),
      emailNotification: jsonb('email_notification'),
      isChargeableAfterTenPlusAlarm: bool('is_chargeable_after_ten_plus_alarm'),
      mainPlanType: mainPlanType('main_plan_type'), // alarm,camera
    },
    {
      tableName: 'plans',
      schema: 'billing',
      updatedAt: false,
    },
  )
}

export default create
