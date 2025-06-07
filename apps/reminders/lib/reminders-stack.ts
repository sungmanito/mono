import * as cdk from 'aws-cdk-lib';
import * as ses from 'aws-cdk-lib/aws-ses';
import * as events from 'aws-cdk-lib/aws-events';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaNodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import { join } from 'node:path';
import { GitHubDeploymentRole } from './deployment-role';

export type Environment = 'dev' | 'prod' | 'staging';

export interface ReminderStackProps extends cdk.StackProps {
  environment: Environment;
}

export function validateEnvironment(
  environment: string,
): environment is Environment {
  return ['dev', 'prod', 'staging'].includes(environment);
}

export class RemindersStack extends cdk.Stack {
  constructor(
    scope: cdk.App,
    id: string,
    props: ReminderStackProps = {
      environment: 'dev',
    },
  ) {
    super(scope, id, props);

    // Create GitHub deployment role
    new GitHubDeploymentRole(this, 'GitHubDeploymentRole');

    // No need for Lambda layer since we're using esbuild for bundling dependencies

    // Setup the identity domain for SES

    const identityDomain =
      this.environment !== 'prod'
        ? 'staging.notifications.sungmanito.app'
        : 'notifications.sungmanito.app';

    const sesEmailDomain = ses.Identity.domain(identityDomain);

    const reminderTemplateProps: ses.CfnTemplate.TemplateProperty = {
      templateName: 'reminder',
      subjectPart: '{household}: You have {count} coming up soon',
      textPart: 'You have {count} bills coming up soon.',
      htmlPart: `<p>You have {count} bills coming up soon.</p>{billList}`,
    };

    const reminderTemplate = new ses.CfnTemplate(this, 'reminderTemplate', {
      template: reminderTemplateProps,
    });

    // Setup cron scheduler
    const rule = new events.Rule(this, 'Daily8amPSTRule', {
      schedule: events.Schedule.cron({ minute: '0', hour: '16' }), // 16:00 UTC is 8:00 PST
    });

    // Define the Lambda function
    const reminderLambda = new lambdaNodejs.NodejsFunction(
      this,
      'ReminderLambda',
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        handler: 'handler',
        entry: join(__dirname, '../dist/index.js'),
        environment: {
          SUPABASE_URL: process.env.SUPABASE_URL as string,
          SUPABASE_KEY: process.env.SUPABASE_KEY as string,
          SENDER_EMAIL: process.env.SENDER_EMAIL as string,
        },
        memorySize: 256,
        timeout: cdk.Duration.minutes(5),
        bundling: {
          externalModules: ['@aws-sdk/*'],
          sourceMap: false,
          minify: true,
          target: 'es2020',
        },
      },
    );

    rule.addTarget(new targets.LambdaFunction(reminderLambda));
  }
}
