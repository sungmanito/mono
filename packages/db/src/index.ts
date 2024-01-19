import * as schema from './tables';

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
  paymentsToBill: schema.paymentToBill,
  billsToPayments: schema.billsToPayments,
  userHouseholds: schema.usersToHouseholds,
  usersToHouseholdsRelations: schema.usersToHouseholdsRelations,
  usersHouseholds: schema.usersHouseholds,
  householdUsers: schema.householdUsers,
  identityUser: schema.identityToUser,
  userToIdentities: schema.userToIdentities,
  householdsToBillsRelations: schema.householdsToBillsRelations,
  billsToHousehold: schema.billToHousehold,
  billHouseholdRelations: schema.billHouseholdRelations,
};

export default schema;
