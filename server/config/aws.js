const { SQSClient, SendMessageCommand, DeleteMessageCommand } = require('@aws-sdk/client-sqs');
const { EventBridgeClient, PutRuleCommand, PutTargetsCommand, DeleteRuleCommand, DeleteTargetsCommand } = require('@aws-sdk/client-eventbridge');
const { CognitoIdentityProviderClient, AdminCreateUserCommand, AdminSetUserPasswordCommand } = require('@aws-sdk/client-cognito-identity-provider');
const dotenv = require('dotenv');

dotenv.config();

// AWS Configuration
const awsConfig = {
  region: process.env.AWS_REGION || 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
};

// Debug: Check if credentials are loaded
console.log('AWS Configuration Debug:');
console.log('Region:', process.env.AWS_REGION);
console.log('Access Key ID exists:', !!process.env.AWS_ACCESS_KEY_ID);
console.log('Secret Access Key exists:', !!process.env.AWS_SECRET_ACCESS_KEY);
console.log('SQS Queue URL exists:', !!process.env.SQS_QUEUE_URL);
console.log('EventBridge Bus Name:', process.env.EVENTBRIDGE_BUS_NAME || 'default');

// Initialize AWS clients
const sqsClient = new SQSClient(awsConfig);
const eventBridgeClient = new EventBridgeClient(awsConfig);
const cognitoClient = new CognitoIdentityProviderClient(awsConfig);

// Test AWS credentials
const testAWSCredentials = async () => {
  try {
    console.log('Testing AWS credentials...');
    // Try to list SQS queues as a simple test
    const { ListQueuesCommand } = require('@aws-sdk/client-sqs');
    const command = new ListQueuesCommand({});
    await sqsClient.send(command);
    console.log('✅ AWS credentials are valid!');
    return true;
  } catch (error) {
    console.error('❌ AWS credentials test failed:', error.message);
    return false;
  }
};

// SQS Configuration
const SQS_QUEUE_URL = process.env.SQS_QUEUE_URL;
const SQS_QUEUE_ARN = process.env.SQS_QUEUE_ARN;
const EVENTBRIDGE_BUS_NAME = process.env.EVENTBRIDGE_BUS_NAME || 'default';

// Nudge configuration
const NUDGE_CONFIG = {
  initialDelayMinutes: 1, // Initial delay before first nudge
  exponentialMultiplier: 2, // Multiplier for exponential backoff
  maxNudges: 20, // Maximum number of nudges (A × X²⁰)
  nudgeMessages: [
    "Hey there! Don't forget to continue with your questions.",
    "Just checking in - ready to continue?",
    "You're doing great! Let's keep going with the next question.",
    "Quick reminder: your questions are waiting for you!",
    "Almost there! Just a few more questions to go.",
    "Don't let the momentum stop - answer the next question!",
    "Your progress is important to us. Please continue!",
    "Time for the next question - you've got this!",
    "Keep going! You're making excellent progress.",
    "One more question awaits your answer!"
  ]
};

// SQS Functions
const sendNudgeMessage = async (nudgeData) => {
  try {
    const command = new SendMessageCommand({
      QueueUrl: SQS_QUEUE_URL,
      MessageBody: JSON.stringify(nudgeData),
      DelaySeconds: Math.floor(nudgeData.delayMinutes * 60)
    });

    const response = await sqsClient.send(command);
    return response.MessageId;
  } catch (error) {
    console.error('Error sending SQS message:', error);
    throw error;
  }
};

const deleteNudgeMessage = async (receiptHandle) => {
  try {
    const command = new DeleteMessageCommand({
      QueueUrl: SQS_QUEUE_URL,
      ReceiptHandle: receiptHandle
    });

    await sqsClient.send(command);
  } catch (error) {
    console.error('Error deleting SQS message:', error);
    throw error;
  }
};

// EventBridge Functions
const scheduleNudgeEvent = async (nudgeData) => {
  try {
    console.log('Attempting to schedule EventBridge event with data:', nudgeData);
    
    const ruleName = `nudge-${nudgeData.userId}-${nudgeData.questionId}-${nudgeData.nudgeCount}`;
    const targetId = `target-${ruleName}`;
    
    console.log('Creating EventBridge rule:', ruleName);
    
    // Create EventBridge rule
    // EventBridge rate expression format: rate(value unit)
    // Valid units: minute, minutes, hour, hours, day, days
    const putRuleCommand = new PutRuleCommand({
      Name: ruleName,
      ScheduleExpression: `rate(${nudgeData.delayMinutes} minute${nudgeData.delayMinutes > 1 ? 's' : ''})`,
      State: 'ENABLED',
      EventBusName: EVENTBRIDGE_BUS_NAME
    });

    console.log('Sending PutRuleCommand...');
    const ruleResponse = await eventBridgeClient.send(putRuleCommand);
    console.log('Rule created successfully:', ruleResponse);

    // Create target
    console.log('SQS Queue URL:', SQS_QUEUE_URL);
    console.log('SQS Queue ARN:', SQS_QUEUE_ARN);
    
    const putTargetsCommand = new PutTargetsCommand({
      Rule: ruleName,
      EventBusName: EVENTBRIDGE_BUS_NAME,
      Targets: [{
        Id: targetId,
        Arn: SQS_QUEUE_ARN,
        Input: JSON.stringify(nudgeData)
      }]
    });

    console.log('Sending PutTargetsCommand...');
    await eventBridgeClient.send(putTargetsCommand);
    console.log('Target created successfully');

    return ruleName;
  } catch (error) {
    console.error('Error scheduling EventBridge event:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      statusCode: error.$metadata?.httpStatusCode,
      requestId: error.$metadata?.requestId
    });
    throw error;
  }
};

const cancelNudgeEvent = async (ruleName) => {
  try {
    const targetId = `target-${ruleName}`;
    
    // Remove target first
    const deleteTargetsCommand = new DeleteTargetsCommand({
      Rule: ruleName,
      EventBusName: EVENTBRIDGE_BUS_NAME,
      Ids: [targetId]
    });

    await eventBridgeClient.send(deleteTargetsCommand);

    // Remove rule
    const deleteRuleCommand = new DeleteRuleCommand({
      Name: ruleName,
      EventBusName: EVENTBRIDGE_BUS_NAME
    });

    await eventBridgeClient.send(deleteRuleCommand);
  } catch (error) {
    console.error('Error cancelling EventBridge event:', error);
    throw error;
  }
};

// Calculate delay for exponential backoff
const calculateNudgeDelay = (nudgeCount) => {
  if (nudgeCount >= NUDGE_CONFIG.maxNudges) {
    return null; // Stop sending nudges
  }
  
  const delayMinutes = NUDGE_CONFIG.initialDelayMinutes * Math.pow(NUDGE_CONFIG.exponentialMultiplier, nudgeCount);
  return Math.min(delayMinutes, 1440); // Cap at 24 hours (1440 minutes)
};

// Get nudge message
const getNudgeMessage = (nudgeCount) => {
  const index = nudgeCount % NUDGE_CONFIG.nudgeMessages.length;
  return NUDGE_CONFIG.nudgeMessages[index];
};

module.exports = {
  sqsClient,
  eventBridgeClient,
  cognitoClient,
  sendNudgeMessage,
  deleteNudgeMessage,
  scheduleNudgeEvent,
  cancelNudgeEvent,
  calculateNudgeDelay,
  getNudgeMessage,
  NUDGE_CONFIG,
  testAWSCredentials
};
