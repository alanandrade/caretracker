var mongoose = require('mongoose')
  , CarePlan = mongoose.model('CarePlan')
  , CareProvider = mongoose.model('CareProvider')
  , User = mongoose.model('User')
  , analytics = require('../../middlewares/analytics');

// GET care_plans/
exports.index = function (req, res) {
  // TODO: Scope by current user access
  CarePlan.accessibleTo(req.user).find({_id: req.params.care_plan_id}).findOne(function(error, carePlan){
    if(error) return res.json(false);
    res.json({carePlan: carePlan});
  });
};

exports.create = function (req, res) {
  var newCareProvider = new CareProvider({
    name: req.body.name,
    relation: req.body.relation,
    email: req.body.email
  })

  CarePlan.accessibleTo(req.user).find({_id: req.params.care_plan_id}).findOne(function(error, carePlan){
    if(error) return res.json(false);
    carePlan.careProviders.push(newCareProvider.toObject());
    carePlan.save(function(error){
      if(error) return res.json(false);
      // Analytics also handles sending the invitation email
      analytics.track({
          userId     : req.user.id,
          event      : 'CareTeam Invitation Created',
          properties : {
            sendEmail: true,
            fromName: req.user.name.full,
            fromEmail: req.user.email,
            patientName: carePlan.name,
            toEmail: newCareProvider.email,
            toName: newCareProvider.name,
            relation: newCareProvider.relation,
            inviteKey: newCareProvider.inviteKey,
            inviteUrl: newCareProvider.inviteUrl(req.headers.host)
          }
      });
      console.log("Invite sent to ", newCareProvider.email, " with url ", carePlan);
      res.json({carePlan: carePlan});
    });
  });
};