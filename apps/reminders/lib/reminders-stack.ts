import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ses from 'aws-cdk-lib/aws-ses';
import * as events from 'aws-cdk-lib/aws-events';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import { join } from 'node:path';

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
    scope: Construct,
    id: string,
    props: ReminderStackProps = {
      environment: 'dev',
    },
  ) {
    super(scope, id, props);

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
    const reminderLambda = new lambda.DockerImageFunction(
      this,
      'ReminderLambda',
      {
        code: lambda.DockerImageCode.fromImageAsset(join(__dirname, '..'), {}),
      },
    );

    rule.addTarget(new targets.LambdaFunction(reminderLambda));
  }
}
