import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export class GitHubDeploymentRole extends Construct {
  public readonly role: iam.Role;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    this.role = new iam.Role(this, 'GitHubDeploymentRole', {
      assumedBy: new iam.CompositePrincipal(
        new iam.ServicePrincipal('codepipeline.amazonaws.com'),
        new iam.ServicePrincipal('codebuild.amazonaws.com'),
      ),
      roleName: 'GitHubDeploymentRole',
    });

    // Allow CodePipeline to use GitHub
    this.role.addToPolicy(
      new iam.PolicyStatement({
        actions: [
          'codepipeline:GetPipeline',
          'codepipeline:GetPipelineState',
          'codepipeline:StartPipelineExecution',
          'codepipeline:ListPipelineExecutions',
          'codepipeline:ListPipelines',
          'codepipeline:PollForJobs',
          'codepipeline:AcknowledgeJob',
          'codepipeline:GetJobDetails',
          'codepipeline:PutJobSuccessResult',
          'codepipeline:PutJobFailureResult',
          'codepipeline:ListActionExecutions',
          'codepipeline:ListWebhookItem',
          'codepipeline:GetWebhook',
          'codepipeline:ListWebhooks',
          'codepipeline:UpdateWebhook',
          'codepipeline:DeleteWebhook',
          'codepipeline:PutWebhook',
        ],
        resources: ['*'],
      }),
    );

    // Allow CodeBuild to build and deploy
    this.role.addToPolicy(
      new iam.PolicyStatement({
        actions: [
          'codebuild:BatchGetBuilds',
          'codebuild:StartBuild',
          'codebuild:BatchGetBuildBatches',
          'codebuild:StartBuildBatch',
          'codebuild:BatchGetProjects',
          'codebuild:ListBuilds',
          'codebuild:ListBuildBatches',
          'codebuild:ListBuildsForProject',
          'codebuild:ListBuildBatchesForProject',
          'codebuild:BatchGetBuildBatches',
          'codebuild:BatchGetBuilds',
        ],
        resources: ['*'],
      }),
    );

    // Allow access to S3 for artifact storage
    this.role.addToPolicy(
      new iam.PolicyStatement({
        actions: ['s3:GetObject', 's3:PutObject', 's3:ListBucket'],
        resources: [
          'arn:aws:s3:::codepipeline-*',
          'arn:aws:s3:::codepipeline-*/*',
        ],
      }),
    );

    // Allow CloudFormation operations
    this.role.addToPolicy(
      new iam.PolicyStatement({
        actions: [
          'cloudformation:CreateStack',
          'cloudformation:DeleteStack',
          'cloudformation:DescribeStacks',
          'cloudformation:UpdateStack',
          'cloudformation:DescribeStackEvents',
        ],
        resources: ['*'],
      }),
    );
  }
}
