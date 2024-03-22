import * as schema from './tables';
import {
  billsRelations,
  userRelations,
  householdRelations,
  paymentRelations,
  identitiesRelations,
  invitesRelations,
  usersToHouseholdsRelations,
  objectRelations,
  bucketRelations,
} from './relations';

export const exportedSchema = {
  // Schema
  authSchema: schema.authSchema,
  // Tables
  bills: schema.bills,
  households: schema.households,
  users: schema.users,
  payments: schema.payments,
  usersToHouseholds: schema.usersToHouseholds,
  invites: schema.invites,
  objects: schema.objects,
  buckets: schema.buckets,
  // Relationships
  billsRelations,
  userRelations,
  householdRelations,
  paymentRelations,
  identitiesRelations,
  invitesRelations,
  usersToHouseholdsRelations,
  objectRelations,
  bucketRelations,
};

export default schema;
