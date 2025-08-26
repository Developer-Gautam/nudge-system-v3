const { SQSClient, SendMessageCommand, DeleteMessageCommand } = require('@aws-sdk/client-sqs');
const { EventBridgeClient, PutRuleCommand, PutTargetsCommand, DeleteRuleCommand, DeleteTargetsCommand } = require('@aws-sdk/client-eventbridge');
const { CognitoIdentityProviderClient, AdminCreateUserCommand, AdminSetUserPasswordCommand } = require('@aws-sdk/client-cognito-identity-provider');

// AWS Configuration
const awsConfig = {
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
};

// Initialize AWS clients
const sqsClient = new SQSClient(awsConfig);
const eventBridgeClient = new EventBridgeClient(awsConfig);
const cognitoClient = new CognitoIdentityProviderClient(awsConfig);

// SQS Configuration
const SQS_QUEUE_URL = process.env.SQS_QUEUE_URL;
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
    const ruleName = `nudge-${nudgeData.userId}-${nudgeData.questionId}-${nudgeData.nudgeCount}`;
    const targetId = `target-${ruleName}`;
    
    // Create EventBridge rule
    const putRuleCommand = new PutRuleCommand({
      Name: ruleName,
      ScheduleExpression: `rate(${nudgeData.delayMinutes} minutes)`,
      State: 'ENABLED',
      EventBusName: EVENTBRIDGE_BUS_NAME
    });

    const ruleResponse = await eventBridgeClient.send(putRuleCommand);

    // Create target
    const putTargetsCommand = new PutTargetsCommand({
      Rule: ruleName,
      EventBusName: EVENTBRIDGE_BUS_NAME,
      Targets: [{
        Id: targetId,
        Arn: SQS_QUEUE_URL,
        Input: JSON.stringify(nudgeData)
      }]
    });

    await eventBridgeClient.send(putTargetsCommand);

    return ruleName;
  } catch (error) {
    console.error('Error scheduling EventBridge event:', error);
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
  NUDGE_CONFIG
};
