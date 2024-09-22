import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ses from 'aws-cdk-lib/aws-ses';

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

    const identityDomain =
      this.environment !== 'prod'
        ? this.environment === 'dev'
          ? `${this.environment}`
          : 'staging.notifications.sungmanito.app'
        : 'notifications.sungmanito.app';

    const sesEmailDomain = ses.Identity.domain(identityDomain);

    const reminderTemplateProps: ses.CfnTemplate.TemplateProperty = {
      templateName: 'reminder',
      subjectPart: 'You have {count} coming up soon',
      textPart: 'You have {count} bills coming up soon.',
      htmlPart: `<p>You have {count} bills coming up soon.</p>{billList}`,
    };

    const reminderTemplate = new ses.CfnTemplate(this, 'reminderTemplate', {
      template: reminderTemplateProps,
    });
  }
}
