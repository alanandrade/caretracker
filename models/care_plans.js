var mongoose  = require('mongoose')
  , Schema    = mongoose.Schema
  , ObjectId  = Schema.Types.ObjectId
  , Util      = require('./../lib/util');

/****************************************************
 * CarePlan
 *
 * Care plans represent the shared set of tasks/events associated
 * with a patients care,
 ****************************************************/
var CarePlanSchema = new Schema({
  name: String, // Required, but overwritten by patient account name
  photo: {}, // Overwritten by patient account name
  directAddress: {type: String, required: true, default: Util.generateDirectAddress },
  ownerId: {type: ObjectId, required: true},
  careTeam: [CareProvider.schema]
});

CarePlanSchema.static('ownedBy', function(user){
  return this.where({ownerId: user.id});
});

CarePlanSchema.static('for', function(user){
  return this.findOne({id: user.carePlanId });
});

CarePlanSchema.static('accessibleTo', function(user){
  return this.where().or([{ownerId: user.id}, {_id: user.carePlanId }, {careTeam: {$elemMatch: {userId: user.id}}}])
});

mongoose.model('CarePlan', CarePlanSchema);