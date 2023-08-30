import * as cdk from 'aws-cdk-lib';
import { App, Stack } from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as eks from 'aws-cdk-lib/aws-eks';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';
import { Vpc, SubnetType, IpAddresses, Subnet } from 'aws-cdk-lib/aws-ec2';
import { KubectlV23Layer } from '@aws-cdk/lambda-layer-kubectl-v23';


// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class EkClusterProjectStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    //VPC lookup is used to reuse the already created vpc, subnet, IGW and NATGateway.
    const vpc = ec2.Vpc.fromLookup(this, 'VPC', {
      // This imports the default VPC but you can also
      // specify a 'vpcName' or 'tags'.
      isDefault: false,
      tags: {
        env: 'prod',
        Name: 'EKSVPCCreationStack-VPC',
      },
    });

    new cdk.CfnOutput(this, 'VpcId', {
      value: vpc.vpcId,
    });
    /****** EKS Cluster creation using the VPC created above. ***********/
    const primaryRegion = 'eu-central-1';
    // Assuming the role of the cluster admin
    const clusterAdmin = new iam.Role(this, 'AdminRole', {
      assumedBy: new iam.AccountRootPrincipal()
    });

    // Creating the EKS Cluster
    const cluster = new eks.Cluster(this, 'dmoove-eksCluster', {
      clusterName: 'dmooveEks',
      mastersRole: clusterAdmin,
      version: eks.KubernetesVersion.V1_23,
      kubectlLayer: new KubectlV23Layer(this, 'kubectl'),
      defaultCapacity: 0,
      vpc,
      serviceIpv4Cidr: '10.10.0.0/20',
      outputMastersRoleArn: true,
    });
    cluster.awsAuth.addMastersRole(clusterAdmin)

    // Creating AutoScaling group for the EKS
    cluster.addAutoScalingGroupCapacity('spot-group', {
      instanceType: new ec2.InstanceType('t2.micro'),
      spotPrice: '0.004',
      minCapacity: 1,
      maxCapacity: 5,
    });
    // Add tags for the EKS cluster
    cdk.Tags.of(cluster).add('Application', 'MyEksCluster');
  }
}