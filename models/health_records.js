var mongoose  = require('mongoose')
  , Schema    = mongoose.Schema
  , ObjectId  = Schema.Types.ObjectId
  , BBParser = require("./../node_modules/bluebutton/build/bluebutton.js");

// HealthRecord schema
// TODO: Camelize these variables
var HealthRecordSchema = new Schema({
  direct_address: String,
  content_url: String,
  key: String,
  created: Number,
  data: {}
});

// Setup input/output of health documents
HealthRecordSchema.virtual('data.xml').get(function(){
  throw Error("Not yet implemented in bluebutton.js");
  return BBParser(this.data.json).xml();
})
.set(function(dataXml){
  this.data.document = BBParser(dataXml);
});

HealthRecordSchema.virtual('data.document')
.get(function(){
  return BBParser(this.data.json);
})
.set(function(newDocument){
  this.data.json = newDocument.data.json();
});

HealthRecordSchema.virtual('data.json')
.get(function(){
  return JSON.stringify(this.data);
})
.set(function(newJson){
  this.data = JSON.parse(newJson);
  this.markModified('data');
});

var HealthStore = require("./../lib/ccda_service");
HealthRecordSchema.static('updateDirectAddress', function(directAddress){
  var self = this;
  // Erm, we should really deal with multiple health records,
  // and not just pick the most recent.
  if(!directAddress) throw Error("Direct address is required.");
  var store = new HealthStore({directAddress: directAddress});
  store.retrieveAll(function(error, attributes, ccdaXml){
    self.findOne({direct_address: directAddress, key: attributes.key}).exec(function(error, found){
      var record = null;
      if(found){
        record = found;
        // Update health record attributes that could change
        if(record.created < attributes.created){
          record.created = attributes.created;
          record.data.xml = ccdaXml;
        }
      } else {
        record = new self(attributes);
        record.data.xml = ccdaXml;
      }
      record.save(function(error){
        if(error) return console.log("Error saving health record", error);
        console.log("Health Records updated for "+ directAddress);
      });
    });
  });
});


HealthRecordSchema.methods.generateTasks = function(){
  return self.data.toObject().medications.map(function(medication){
    return Schedule.newFromMedication(medication);
  });
}

mongoose.model('HealthRecord', HealthRecordSchema);
