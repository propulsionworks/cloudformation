/**
 * A value for {@link ParameterDefinition.Type} that cause the parameter to
 * resolve to an array value.
 */
export type ParameterListType<T extends string> = `List<${T}>`;

/**
 * Get the element type of a list type.
 */
export type ParameterElementOfListType<T> =
  T extends ParameterListType<infer Element> ? Element : never;

/**
 * Values for {@link ParameterDefinition.Type} that can also be used with
 * `List<...>`.
 */
export type AwsParameterTypesSupportingList =
  | "AWS::EC2::AvailabilityZone::Name"
  | "AWS::EC2::Image::Id"
  | "AWS::EC2::Instance::Id"
  | "AWS::EC2::SecurityGroup::GroupName"
  | "AWS::EC2::SecurityGroup::Id"
  | "AWS::EC2::Subnet::Id"
  | "AWS::EC2::Volume::Id"
  | "AWS::EC2::VPC::Id"
  | "AWS::Route53::HostedZone::Id";

/**
 * CloudFormation provides a set of parameter types that help catch invalid
 * values when creating or updating a stack. When you use these parameter types,
 * anyone who uses your template must specify valid values from the AWS account
 * and Region they're creating the stack in.
 *
 * If they use the AWS Management Console, CloudFormation provides a
 * prepopulated list of existing values from their account and Region. This way,
 * the user doesn't have to remember and correctly type a specific name or ID.
 * Instead, they just select values from a drop-down list. In some cases, they
 * can even search for values by ID, name, or Name tag value.
 *
 * @see {@link https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/cloudformation-supplied-parameter-types.html#aws-specific-parameter-types-supported}
 */
export type AwsScalarParameterType =
  | "AWS::EC2::AvailabilityZone::Name"
  | "AWS::EC2::Image::Id"
  | "AWS::EC2::Instance::Id"
  | "AWS::EC2::KeyPair::KeyName"
  | "AWS::EC2::SecurityGroup::GroupName"
  | "AWS::EC2::SecurityGroup::Id"
  | "AWS::EC2::Subnet::Id"
  | "AWS::EC2::Volume::Id"
  | "AWS::EC2::VPC::Id"
  | "AWS::Route53::HostedZone::Id";

/**
 * CloudFormation provides a set of parameter types that help catch invalid
 * values when creating or updating a stack. When you use these parameter types,
 * anyone who uses your template must specify valid values from the AWS account
 * and Region they're creating the stack in.
 *
 * If they use the AWS Management Console, CloudFormation provides a
 * prepopulated list of existing values from their account and Region. This way,
 * the user doesn't have to remember and correctly type a specific name or ID.
 * Instead, they just select values from a drop-down list. In some cases, they
 * can even search for values by ID, name, or Name tag value.
 *
 * @see {@link https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/cloudformation-supplied-parameter-types.html#aws-specific-parameter-types-supported}
 */
export type AwsParameterType =
  | AwsScalarParameterType
  | ParameterListType<AwsParameterTypesSupportingList>;

/**
 * A value for {@link ParameterDefinition.Type} that means the parameter value
 * will be loaded from SSM Parameter Store, using the provided parameter value
 * as the SSM Parameter Store key.
 */
export type SsmParameterValueType<T extends string> =
  `AWS::SSM::Parameter::Value<${T}>`;

/**
 * CloudFormation also provides parameter types that correspond to existing
 * parameters in Systems Manager Parameter Store. When you use these parameter
 * types, anyone who uses your template must specify a Parameter Store key as
 * the value of the Systems Manager parameter type, and CloudFormation then
 * retrieves the latest value from Parameter Store to use in their stack. This
 * can be useful when you need to frequently update applications with new
 * property values, such as new Amazon Machine Image (AMI) IDs.
 *
 * @see {@link https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/cloudformation-supplied-parameter-types.html#systems-manager-parameter-types-supported}
 */
export type SsmParameterType =
  | "AWS::SSM::Parameter::Name"
  | SsmParameterValueType<"String">
  | SsmParameterValueType<ParameterListType<"String">>
  | SsmParameterValueType<"CommaDelimitedList">
  | SsmParameterValueType<AwsParameterType>;

/**
 * All values for {@link ParameterDefinition.Type} that will cause the parameter
 * to resolve to an array value.
 */
export type ParameterStringArrayType =
  | "CommaDelimitedList"
  | ParameterListType<"String">
  | ParameterListType<AwsParameterTypesSupportingList>;

/**
 * Map of CloudFormation parameter type values to TypeScript types.
 *
 * @see {@link https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/parameters-section-structure.html}
 */
export type ParameterTypeMap = {
  String: string;
  Number: number;
  "List<Number>": number[];
  CommaDelimitedList: string[];
} & {
  [T in AwsParameterType | SsmParameterType]: T extends
    | ParameterStringArrayType
    | SsmParameterValueType<ParameterStringArrayType>
    ? string[]
    : string;
};

/**
 * Allowed values for the Type field in a Parameter definition.
 *
 * To convert to a TypeScript type, see {@link ParameterTypeMap}.
 *
 * @see {@link https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/parameters-section-structure.html}
 */
export type ParameterType = keyof ParameterTypeMap;
