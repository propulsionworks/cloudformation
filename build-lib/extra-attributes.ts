/**
 * This file contains properties that are usable with `Fn::GetAtt` in
 * CloudFormation, in addition to the `readOnlyProperties` indicated by the
 * CloudFormation Registry Schema (CloudFormation also calls these
 * "attributes").
 *
 * All of the properties in this exception list are both configurable as well as
 * retrievable via `GetAtt`; it would not be correct to classify them as
 * `readOnlyProperties`, hence we have an additional list of attributes that
 * have the same name as configurable properties.
 *
 * CloudFormation is currently not accepting new resources where `GetAtt`-able
 * attributes have the same name as properties; this list is only for backwards
 * compatibility with non-registry resources. It is therefore unlikely to change
 * often, if ever, so we feel safe committing it here.
 *
 * @see {@link https://github.com/cdklabs/awscdk-service-spec/blob/27f8b230c2a615b5b0df4fff71dd73481709f3a5/sources/CloudFormationGetAttAllowList/README.md}
 */
export const ExtraAttributes = {
  "AWS::Amplify::Branch": ["BranchName"],
  "AWS::Amplify::Domain": [
    "DomainName",
    "AutoSubDomainCreationPatterns",
    "AutoSubDomainIAMRole",
    "EnableAutoSubDomain",
  ],
  "AWS::AppMesh::GatewayRoute": [
    "GatewayRouteName",
    "MeshName",
    "MeshOwner",
    "VirtualGatewayName",
  ],
  "AWS::AppMesh::Mesh": ["MeshName"],
  "AWS::AppMesh::Route": [
    "MeshName",
    "MeshOwner",
    "RouteName",
    "VirtualRouterName",
  ],
  "AWS::AppMesh::VirtualGateway": [
    "MeshName",
    "MeshOwner",
    "VirtualGatewayName",
  ],
  "AWS::AppMesh::VirtualNode": ["MeshName", "MeshOwner", "VirtualNodeName"],
  "AWS::AppMesh::VirtualRouter": ["MeshName", "MeshOwner", "VirtualRouterName"],
  "AWS::AppMesh::VirtualService": [
    "MeshName",
    "MeshOwner",
    "VirtualServiceName",
  ],
  "AWS::AppSync::DataSource": ["Name"],
  "AWS::AppSync::DomainName": ["DomainName"],
  "AWS::AppSync::FunctionConfiguration": ["DataSourceName", "Name"],
  "AWS::AppSync::Resolver": ["FieldName", "TypeName"],
  "AWS::Backup::BackupSelection": ["BackupPlanId"],
  "AWS::Backup::BackupVault": ["BackupVaultName"],
  "AWS::Cloud9::EnvironmentEC2": ["Name"],
  "AWS::CloudWatch::InsightRule": ["RuleName"],
  "AWS::CodeArtifact::Repository": ["DomainName"],
  "AWS::DocDB::DBCluster": ["Port"],
  "AWS::EC2::CapacityReservation": [
    "AvailabilityZone",
    "InstanceType",
    "Tenancy",
  ],
  "AWS::EC2::Instance": ["AvailabilityZone"],
  "AWS::EC2::SecurityGroup": ["VpcId"],
  "AWS::EC2::Subnet": [
    "AvailabilityZone",
    "AvailabilityZoneId",
    "CidrBlock",
    "VpcId",
    "OutpostArn",
  ],
  "AWS::EC2::VPC": ["CidrBlock"],
  "AWS::EFS::MountTarget": ["IpAddress"],
  "AWS::EKS::Nodegroup": ["ClusterName", "NodegroupName"],
  "AWS::ElasticLoadBalancingV2::LoadBalancer": ["SecurityGroups"],
  "AWS::Events::EventBus": ["Name"],
  "AWS::EventSchemas::Registry": ["RegistryName"],
  "AWS::EventSchemas::Schema": ["SchemaName"],
  "AWS::GameLift::GameSessionQueue": ["Name"],
  "AWS::GameLift::MatchmakingConfiguration": ["Name"],
  "AWS::GameLift::MatchmakingRuleSet": ["Name"],
  "AWS::Grafana::Workspace": ["GrafanaVersion"],
  "AWS::Greengrass::ConnectorDefinition": ["Name"],
  "AWS::Greengrass::CoreDefinition": ["Name"],
  "AWS::Greengrass::DeviceDefinition": ["Name"],
  "AWS::Greengrass::FunctionDefinition": ["Name"],
  "AWS::Greengrass::Group": ["Name", "RoleArn"],
  "AWS::Greengrass::LoggerDefinition": ["Name"],
  "AWS::Greengrass::ResourceDefinition": ["Name"],
  "AWS::Greengrass::SubscriptionDefinition": ["Name"],
  "AWS::ImageBuilder::Component": ["Name"],
  "AWS::ImageBuilder::ContainerRecipe": ["Name"],
  "AWS::ImageBuilder::DistributionConfiguration": ["Name"],
  "AWS::ImageBuilder::ImagePipeline": ["Name"],
  "AWS::ImageBuilder::ImageRecipe": ["Name"],
  "AWS::ImageBuilder::InfrastructureConfiguration": ["Name"],
  "AWS::Kinesis::StreamConsumer": ["ConsumerName", "StreamARN"],
  "AWS::ManagedBlockchain::Member": ["NetworkId"],
  "AWS::ManagedBlockchain::Node": ["MemberId", "NetworkId"],
  "AWS::MediaConvert::JobTemplate": ["Name"],
  "AWS::MediaConvert::Preset": ["Name"],
  "AWS::MediaConvert::Queue": ["Name"],
  "AWS::MediaLive::Input": ["Destinations", "Sources"],
  "AWS::Neptune::DBCluster": ["Port"],
  "AWS::OpsWorks::Instance": ["AvailabilityZone"],
  "AWS::OpsWorks::UserProfile": ["SshUsername"],
  "AWS::RDS::DBInstance": ["DBSystemId"],
  "AWS::RDS::DBParameterGroup": ["DBParameterGroupName"],
  "AWS::RoboMaker::RobotApplication": ["CurrentRevisionId"],
  "AWS::RoboMaker::SimulationApplication": ["CurrentRevisionId"],
  "AWS::Route53Resolver::ResolverEndpoint": ["Name", "Direction"],
  "AWS::Route53Resolver::ResolverRule": [
    "DomainName",
    "Name",
    "ResolverEndpointId",
    "TargetIps",
  ],
  "AWS::Route53Resolver::ResolverRuleAssociation": [
    "Name",
    "ResolverRuleId",
    "VPCId",
  ],
  "AWS::S3::AccessPoint": ["Name"],
  "AWS::SageMaker::CodeRepository": ["CodeRepositoryName"],
  "AWS::SageMaker::Endpoint": ["EndpointName"],
  "AWS::SageMaker::EndpointConfig": ["EndpointConfigName"],
  "AWS::SageMaker::Model": ["ModelName"],
  "AWS::SageMaker::NotebookInstance": ["NotebookInstanceName"],
  "AWS::SageMaker::NotebookInstanceLifecycleConfig": [
    "NotebookInstanceLifecycleConfigName",
  ],
  "AWS::SageMaker::Workteam": ["WorkteamName"],
  "AWS::ServiceDiscovery::Service": ["Name"],
  "AWS::SNS::Topic": ["TopicName"],
  "AWS::SQS::Queue": ["QueueName"],
  "AWS::SSM::Parameter": ["Type", "Value"],
  "AWS::StepFunctions::Activity": ["Name"],
  "AWS::Transfer::User": ["ServerId", "UserName"],
};
