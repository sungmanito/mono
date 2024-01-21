import * as schema from './tables';
import {
  billsRelations,
  userRelations,
  householdRelations,
  paymentRelations,
  identitiesRelations,
  invitesRelations,
  usersToHouseholdsRelations,
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
  // Relationships
  billsRelations,
  userRelations,
  householdRelations,
  paymentRelations,
  identitiesRelations,
  invitesRelations,
  usersToHouseholdsRelations,
};

export default schema;
