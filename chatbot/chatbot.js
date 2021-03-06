'use strict'

const dialogflow = require('dialogflow');
const structjsnon = require('./structjson');
const config = require('../config/keys');
const mongoose = require('mongoose');
const registrationSchema = require('../models/Registration');

const projectID = config.googleProjectID;
const sessionID = config.dialogFlowSessionID;
const languageCode = config.dialogFlowSessionLanguageCode;

const credentials = {
  client_email:config.googleClientEmail,
  private_key:config.googlePrivateKey
}


const sessionClient = new dialogflow.SessionsClient({projectID,credentials});

const Registration = mongoose.model('registration');

module.exports = {
  textQuery: async function(text,userID,parameters={}) {
    let sessionPath = sessionClient.sessionPath(projectID, sessionID + userID);
    let self = module.exports;
    const request = {
      session: sessionPath,
      queryInput: {
        text: {
          text: text,
          languageCode: languageCode ,
        },
      },
      queryParams:{
        payload:{
          data:parameters
        }
      }
    };
    let responses = await sessionClient.detectIntent(request);
    responses = await self.handleAction(responses);
    return responses;
  },

  eventQuery: async function(event,userID,parameters={}) {
    let self = module.exports;
    let sessionPath = sessionClient.sessionPath(projectID, sessionID + userID);
    const request = {
      session: sessionPath,
      queryInput: {
        event: {
          name: event,
          parameters:structjsnon.jsonToStructProto(parameters),
          languageCode: languageCode ,
        },
      }
    };
    let responses = await sessionClient.detectIntent(request);
    responses = await self.handleAction(responses);
    return responses;
  },

  handleAction:function(responses){
    let self = module.exports;
    let queryResult = responses[0].queryResult;

    switch (queryResult.action) {
      case 'recommendcourses.recommendcourses-yes':
        if(queryResult.allRequiredParamsPresent){
          self.saveRegistration(queryResult.parameters.fields);
        }
        break;
      default:

    }

    return responses;
  },

  saveRegistration: function(fields){
    const registration = new Registration({
      name:fields.name.stringValue,
      address:fields.address.stringValue,
      phone:fields.phone.stringValue,
      email:fields.email.stringValue,
      dateSent:Date.now()
    });
    try{
      registration.save();
    } catch(err){
      console.log(err);
    }
  }
}
