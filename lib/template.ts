import type {
  ConditionFunction,
  FnFindInMap,
  FnIf,
  Ref,
  RuleFunction,
  ValueFn,
  WithIntrinsics,
} from "./intrinsics.ts";
import type { ParameterType } from "./parameters.ts";

/**
 * A CloudFormation template, with loosely-typed resources by default.
 *
 * @see {@link https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/template-anatomy.html}
 */
export type Template<
  ResourceType extends ResourceDefinition = ResourceDefinition,
> = {
  /**
   * The AWSTemplateFormatVersion section (optional) identifies the capabilities
   * of the template. The latest template format version is 2010-09-09 and is
   * currently the only valid value.
   *
   * The value for the template format version declaration must be a literal
   * string. You can't use a parameter or function to specify the template
   * format version. If you don't specify a value, AWS CloudFormation assumes
   * the latest template format version.
   *
   * @see {@link https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/format-version-structure.html}
   */
  AWSTemplateFormatVersion?: "2010-09-09" | undefined;

  /**
   * The optional Conditions section contains statements that define the
   * circumstances under which entities are created or configured. For example,
   * you can create a condition and then associate it with a resource or output
   * so that AWS CloudFormation only creates the resource or output if the
   * condition is true. Similarly, you can associate the condition with a
   * property so that AWS CloudFormation only sets the property to a specific
   * value if the condition is true. If the condition is false, AWS
   * CloudFormation sets the property to a different value that you specify.
   *
   * You might use conditions when you want to reuse a template that can create
   * resources in different contexts, such as a test environment versus a
   * production environment. In your template, you can add an EnvironmentType
   * input parameter, which accepts either prod or test as inputs. For the
   * production environment, you might include Amazon EC2 instances with certain
   * capabilities; however, for the test environment, you want to use reduced
   * capabilities to save money. With conditions, you can define which resources
   * are created and how they're configured for each environment type.
   *
   * Conditions are evaluated based on predefined pseudo parameters or input
   * parameter values that you specify when you create or update a stack. Within
   * each condition, you can reference another condition, a parameter value, or
   * a mapping. After you define all your conditions, you can associate them
   * with resources and resource properties in the Resources and Outputs
   * sections of a template.
   *
   * At stack creation or stack update, AWS CloudFormation evaluates all the
   * conditions in your template before creating any resources. Resources that
   * are associated with a true condition are created. Resources that are
   * associated with a false condition are ignored. AWS CloudFormation also
   * re-evaluates these conditions at each stack update before updating any
   * resources. Resources that are still associated with a true condition are
   * updated. Resources that are now associated with a false condition are
   * deleted.
   *
   * @see {@link https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/conditions-section-structure.html}
   */
  Conditions?: TemplateMap<ConditionFunction> | undefined;

  /**
   * The optional `Mappings` section matches a key to a corresponding set of
   * named values. For example, if you want to set values based on a region, you
   * can create a mapping that uses the region name as a key and contains the
   * values you want to specify for each specific region. You use the
   * `Fn::FindInMap` intrinsic function to retrieve values in a map.
   *
   * @see {@link https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/mappings-section-structure.html}
   */
  Mappings?: TemplateMap<MappingDefinition> | undefined;

  /**
   * You can use the optional `Metadata` section to include arbitrary JSON or
   * YAML objects that provide details about the template.
   *
   * @see {@link https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/metadata-section-structure.html}
   */
  Metadata?: TemplateMap<unknown> | undefined;

  /**
   * The optional `Outputs` section declares output values that you can import
   * into other stacks (to create cross-stack references), return in response
   * (to describe stack calls), or view on the AWS CloudFormation console. For
   * example, you can output the S3 bucket name for a stack to make the bucket
   * easier to find.
   *
   * @see {@link https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/outputs-section-structure.html}
   */
  Outputs?: TemplateMap<OutputDefinition> | undefined;

  /**
   * Use the optional `Parameters` section to customize your templates.
   * Parameters enable you to input custom values to your template each time you
   * create or update a stack.
   *
   * @see {@link https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/parameters-section-structure.html}
   */
  Parameters?: TemplateMap<ParameterDefinition> | undefined;

  /**
   * The required `Resources` section declares the AWS resources that you want
   * to include in the stack, such as an Amazon EC2 instance or an Amazon S3
   * bucket.
   *
   * @see {@link https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/resources-section-structure.html}
   */
  Resources: TemplateMap<ResourceType>;

  /**
   * The optional `Rules` section validates a parameter or a combination of
   * parameters passed to a template during a stack creation or stack update. To
   * use template rules, explicitly declare `Rules` in your template followed by
   * an assertion. Use the rules section to validate parameter values before
   * creating or updating resources.
   *
   * @see {@link https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/rules-section-structure.html}
   */
  Rules?: TemplateMap<RuleDefinition> | undefined;
};

/**
 * Keys of the sections in a template.
 */
export type TemplateSection = Exclude<
  keyof Template,
  "AWSTemplateFormatVersion"
>;

/**
 * The value type of a template section.
 */
export type TemplateSectionType<Section extends TemplateSection> = Exclude<
  Template[Section],
  undefined
>[string];

/**
 * An array containing all valid TemplateSection values.
 */
export const TemplateSection = Object.keys({
  // trick to make sure we have all the values
  Conditions: true,
  Mappings: true,
  Metadata: true,
  Outputs: true,
  Parameters: true,
  Resources: true,
  Rules: true,
} satisfies Record<TemplateSection, any>) as TemplateSection[];

/**
 * A key-value map.
 */
export type TemplateMap<T> = Record<string, T>;

/**
 * The optional `Mappings` section matches a key to a corresponding set of
 * named values. For example, if you want to set values based on a region, you
 * can create a mapping that uses the region name as a key and contains the
 * values you want to specify for each specific region. You use the
 * `Fn::FindInMap` intrinsic function to retrieve values in a map.
 *
 * @see {@link https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/mappings-section-structure.html}
 */
export type MappingDefinition<
  TopLevelKey extends string = string,
  SecondLevelKey extends string = string,
  Value = unknown,
> = Record<TopLevelKey, Record<SecondLevelKey, Value>>;

/**
 * The name of the resource output to be exported for a cross-stack reference.
 *
 * @see {@link https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/outputs-section-structure.html}
 */
export type OutputExport = {
  Name: string | ValueFn<string>;
};

/**
 * The optional `Outputs` section declares output values that you can import
 * into other stacks (to create cross-stack references), return in response (to
 * describe stack calls), or view on the AWS CloudFormation console. For
 * example, you can output the S3 bucket name for a stack to make the bucket
 * easier to find.
 *
 * @see {@link https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/outputs-section-structure.html}
 */
export type OutputDefinition = {
  /**
   * A String type that describes the output value. The value for the
   * description declaration must be a literal string that's between `0` and
   * `1024` bytes in length. You can't use a parameter or function to specify
   * the description. The description can be a maximum of 4 K in length.
   */
  Description?: string | ValueFn<string> | undefined;

  /**
   * The name of the resource output to be exported for a cross-stack reference.
   */
  Export?: OutputExport | undefined;

  /**
   * The value of the property returned by the aws `cloudformation
   * describe-stacks` command. The value of an output can include literals,
   * parameter references, pseudo-parameters, a mapping value, or intrinsic
   * functions.
   */
  Value: unknown;
};

/**
 * Parameters enable you to input custom values to your template each time you
 * create or update a stack.
 *
 * @see {@link https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/parameters-section-structure.html#parameters-section-structure-properties}
 */
export type ParameterDefinition<T extends ParameterType = ParameterType> = {
  /**
   * A regular expression that represents the patterns to allow for String
   * types. The pattern must match the entire parameter value provided.
   */
  AllowedPattern?: string | undefined;

  /**
   * An array containing the list of values allowed for the parameter.
   */
  AllowedValues?: string[] | undefined;

  /**
   * A string that explains a constraint when the constraint is violated. For
   * example, without a constraint description, a parameter that has an allowed
   * pattern of `[A-Za-z0-9]+` displays the following error message when the
   * user specifies an invalid value:
   *
   * > Malformed input-Parameter MyParameter must match pattern [A-Za-z0-9]+
   *
   * By adding a constraint description, such as must only contain letters
   * (uppercase and lowercase) and numbers, you can display the following
   * customized error message:
   *
   * > Malformed input-Parameter MyParameter must only contain uppercase and
   * > lowercase letters and numbers
   */
  ConstraintDescription?: string | undefined;

  /**
   * A value of the appropriate type for the template to use if no value is
   * specified when a stack is created. If you define constraints for the
   * parameter, you must specify a value that adheres to those constraints.
   */
  Default?: string | undefined;

  /**
   * A string of up to 4000 characters that describes the parameter.
   */
  Description?: string | undefined;

  /**
   * An integer value that determines the largest number of characters you want
   * to allow for `String` types.
   */
  MaxLength?: number | undefined;

  /**
   * A numeric value that determines the largest numeric value you want to allow
   * for `Number` types.
   */
  MaxValue?: number | undefined;

  /**
   * An integer value that determines the smallest number of characters you want
   * to allow for `String` types.
   */
  MinLength?: number | undefined;

  /**
   * A numeric value that determines the smallest numeric value you want to
   * allow for `Number` types.
   */
  MinValue?: number | undefined;

  /**
   * Whether to mask the parameter value to prevent it from being displayed in
   * the console, command line tools, or API. If you set the NoEcho attribute to
   * true, CloudFormation returns the parameter value masked as asterisks
   * `(*****)` for any calls that describe the stack or stack events, except for
   * information stored in the locations specified below.
   */
  NoEcho?: boolean | undefined;

  /**
   * The data type for the parameter. See AWS documentation for
   * more info.
   *
   * @see {@link https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/parameters-section-structure.html#parameters-section-structure-properties}
   */
  Type: T;
};

/**
 * Represents the additional options for a resource definition (other than
 * `Type` and Properties.)
 *
 * @see {@link https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-template-resource-type-ref.html}
 */
export type ResourceOptions = {
  /**
   * The name of a condition to associate with the resource. The resource will
   * only be created if the condition evaluates to true.
   *
   * @see {@link https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/conditions-section-structure.html}
   */
  Condition?: string | undefined;

  /**
   * Associate the `CreationPolicy` attribute with a resource to prevent its
   * status from reaching create complete until AWS CloudFormation receives a
   * specified number of success signals or the timeout period is exceeded. To
   * signal a resource, you can use the `cfn-signal` helper script or
   * [SignalResource
   * API](https://docs.aws.amazon.com/AWSCloudFormation/latest/APIReference/API_SignalResource.html).
   * CloudFormation publishes valid signals to the stack events so that you
   * track the number of signals sent.
   *
   * @see {@link https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-attribute-creationpolicy.html}
   */
  CreationPolicy?: CreationPolicy | undefined;

  /**
   * With the `DeletionPolicy` attribute you can preserve, and in some cases,
   * backup a resource when its stack is deleted. You specify a `DeletionPolicy`
   * attribute for each resource that you want to control. If a resource has no
   * `DeletionPolicy` attribute, AWS CloudFormation deletes the resource by
   * default, except for:
   *
   *  - For `AWS::RDS::DBCluster resources`, the default policy is `Snapshot`.
   *  - For `AWS::RDS::DBInstance` resources that don't specify the
   *    `DBClusterIdentifier` property, the default policy is `Snapshot`.
   *  - For Amazon S3 buckets, you must delete all objects in the bucket for
   *    deletion to succeed.
   *
   * This capability also applies to stack update operations that lead to
   * resources being deleted from stacks. For example, if you remove the
   * resource from the stack template, and then update the stack with the
   * template. This capability doesn't apply to resources whose physical
   * instance is replaced during stack update operations. For example, if you
   * edit a resource's properties such that CloudFormation replaces that
   * resource during a stack update.
   *
   * To keep a resource when its stack is deleted, specify Retain for that
   * resource. You can use retain for any resource. For example, you can retain
   * a nested stack, Amazon S3 bucket, or EC2 instance so that you can continue
   * to use or modify those resources after you delete their stacks.
   *
   * For resources that support snapshots, such as `AWS::EC2::Volume`, specify
   * Snapshot to have CloudFormation create a snapshot before deleting the
   * resource.
   *
   * @see {@link https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-attribute-deletionpolicy.html}
   */
  DeletionPolicy?:
    | DeletionPolicy
    | FnFindInMap<DeletionPolicy>
    | FnIf<DeletionPolicy>
    | Ref<DeletionPolicy>
    | undefined;

  /**
   * With the `DependsOn` attribute you can specify that the creation of a
   * specific resource follows another. When you add a `DependsOn` attribute to
   * a resource, that resource is created only after the creation of the
   * resource specified in the `DependsOn` attribute.
   *
   * @see {@link https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-attribute-dependson.html}
   */
  DependsOn?: string[] | undefined;

  /**
   * The metadata attribute enables you to associate structured data with a
   * resource. By adding a metadata attribute to a resource, you can add data in
   * JSON or YAML to the resource declaration. In addition, you can use
   * intrinsic functions (such as `GetAtt` and `Ref`), parameters, and pseudo
   * parameters within the metadata attribute to add those interpreted values.
   *
   * AWS CloudFormation doesn't validate the syntax within the metadata
   * attribute.
   *
   * @see {@link https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-attribute-metadata.html}
   */
  Metadata?: TemplateMap<unknown> | undefined;

  /**
   * Use the `UpdatePolicy` attribute to specify how AWS CloudFormation handles
   * updates to the `AWS::AppStream::Fleet`,
   * `AWS::AutoScaling::AutoScalingGroup`, `AWS::ElastiCache::ReplicationGroup`,
   * `AWS::OpenSearchService::Domain`, `AWS::Elasticsearch::Domain`, or
   * `AWS::Lambda::Alias resources`.
   *
   * @see {@link https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-attribute-updatepolicy.html}
   */
  UpdatePolicy?: UpdatePolicy | undefined;

  /**
   * Use the UpdateReplacePolicy attribute to retain or, in some cases, backup
   * the existing physical instance of a resource when it's replaced during a
   * stack update operation.
   *
   * When you initiate a stack update, AWS CloudFormation updates resources
   * based on differences between what you submit and the stack's current
   * template and parameters. If you update a resource property that requires
   * that the resource be replaced, CloudFormation recreates the resource during
   * the update. Recreating the resource generates a new physical ID.
   * CloudFormation creates the replacement resource first, and then changes
   * references from other dependent resources to point to the replacement
   * resource. By default, CloudFormation then deletes the old resource. Using
   * the `UpdateReplacePolicy`, you can specify that CloudFormation retain or,
   * in some cases, create a snapshot of the old resource.
   *
   * For resources that support snapshots, such as `AWS::EC2::Volume`, specify
   * Snapshot to have CloudFormation create a snapshot before deleting the old
   * resource instance.
   *
   * @see {@link https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-attribute-updatereplacepolicy.html}
   */
  UpdateReplacePolicy?:
    | UpdateReplacePolicy
    | FnFindInMap<UpdateReplacePolicy>
    | FnIf<UpdateReplacePolicy>
    | Ref<UpdateReplacePolicy>
    | undefined;
};

/**
 * The required `Resources` section declares the AWS resources that you want to
 * include in the stack, such as an Amazon EC2 instance or an Amazon S3 bucket.
 *
 * @see {@link https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-template-resource-type-ref.html}
 */
export type ResourceDefinition<
  Type extends string = string,
  Props extends object = any,
> = ResourceOptions & {
  /**
   * Resource properties are additional options that you can specify for a
   * resource.
   *
   * @see {@link https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-template-resource-type-ref.html}
   */
  Properties: WithIntrinsics<Props>;

  /**
   * The resource type identifies the type of resource that you are declaring.
   * For example, `AWS::EC2::Instance` declares an EC2 instance.
   *
   * @see {@link https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-template-resource-type-ref.html}
   */
  Type: Type;
};

/**
 * The required `Resources` section declares the AWS resources that you want to
 * include in the stack, such as an Amazon EC2 instance or an Amazon S3 bucket.
 *
 * @see {@link https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-template-resource-type-ref.html}
 */
export type TypedResourceDefinition = {
  [Type in keyof ResourcePropertiesTypeMap]: ResourceDefinition<
    Type,
    ResourcePropertiesType<Type>
  >;
}[keyof ResourcePropertiesTypeMap];

/**
 * Extension point for consumers to extend in order to define strongly-typed
 * resource types.
 */
// needs to be an interface so it can be extended with declaration merging
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions, @typescript-eslint/no-empty-object-type
export interface ResourcePropertiesTypeMap {}

/**
 * Extension point for consumers to extend in order to define strongly-typed
 * resource attribute (output) types.
 */
// needs to be an interface so it can be extended with declaration merging
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions, @typescript-eslint/no-empty-object-type
export interface ResourceAttributesTypeMap {}

/**
 * A CloudFormation template, with strongly-typed resources. The resource types
 * should be generated with the code generation tool.
 *
 * @see {@link https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/template-anatomy.html}
 */
export type FullyTypedTemplate = Template<TypedResourceDefinition>;

/**
 * Get the properties type for the given resource type.
 */
export type ResourcePropertiesType<T extends keyof ResourcePropertiesTypeMap> =
  T extends keyof ResourcePropertiesTypeMap
    ? ResourcePropertiesTypeMap[T]
    : never;

/**
 * Get the attributes type for the given resource type.
 */
export type ResourceAttributesType<T extends keyof ResourceAttributesTypeMap> =
  T extends keyof ResourceAttributesTypeMap
    ? ResourceAttributesTypeMap[T]
    : never;

/**
 * Definition for a rule assertion.
 *
 * @see {@link https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/rules-section-structure.html#template-constraint-rules-syntax}
 */
export type RuleAssertion = {
  /**
   * Rule-specific intrinsic function.
   *
   * @see {@link https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/rules-section-structure.html#rules-specific-intrinsic-section-structure}
   */
  Assert: RuleFunction;

  /**
   * Information about this assert.
   */
  AssertDescription?: string | undefined;
};

/**
 * Each template rule consists of two properties:
 *
 *  - Rule condition (optional) — determines when a rule takes effect.
 *  - Assertions (required) — describes what values users can specify for a
 *    particular parameter.
 *
 * A rule can include a `RuleCondition` property and must include an Assertions
 * property. For each rule, you can define only one rule condition. You can
 * define one or more asserts within the `Assertions` property. If you don't
 * define a rule condition, the rule's assertions always take effect.
 *
 * @see {@link https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/rules-section-structure.html#w2ab1c23c15c19b5}
 */
export type RuleDefinition = {
  /**
   * Describes what values users can specify for a particular parameter.
   */
  Assertions: RuleAssertion[];

  /**
   * Determines when a rule takes effect.
   */
  RuleCondition?: RuleFunction | undefined;
};

/**
 * To specify how AWS CloudFormation handles replacement updates for an Auto
 * Scaling group, use the AutoScalingReplacingUpdate policy. This policy enables
 * you to specify whether AWS CloudFormation replaces an Auto Scaling group with
 * a new one or replaces only the instances in the Auto Scaling group.
 *
 * @see {@link https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-attribute-updatepolicy.html#cfn-attributes-updatepolicy-replacingupdate}
 */
export type AutoScalingReplacingUpdatePolicy = {
  /**
   * Specifies whether an Auto Scaling group and the instances it contains are
   * replaced during an update. During replacement, CloudFormation retains the
   * old group until it finishes creating the new one. If the update fails,
   * CloudFormation can roll back to the old Auto Scaling group and delete the
   * new Auto Scaling group.
   *
   * While CloudFormation creates the new group, it doesn't detach or attach any
   * instances. After successfully creating the new Auto Scaling group,
   * CloudFormation deletes the old Auto Scaling group during the cleanup
   * process.
   *
   * When you set the `WillReplace` parameter, remember to specify a matching
   * `CreationPolicy`. If the minimum number of instances (specified by the
   * `MinSuccessfulInstancesPercent` property) don't signal success within the
   * `Timeout` period (specified in the `CreationPolicy` policy), the
   * replacement update fails and AWS CloudFormation rolls back to the old Auto
   * Scaling group.
   */
  WillReplace?: boolean | ValueFn<boolean> | undefined;
};

/**
 * To specify how CloudFormation handles rolling updates for an Auto Scaling
 * group, use the `AutoScalingRollingUpdate` policy. Rolling updates enable you
 * to specify whether AWS CloudFormation updates instances that are in an Auto
 * Scaling group in batches or all at once.
 *
 * Be aware that, during stack update rollback operations, CloudFormation uses
 * the `UpdatePolicy` configuration specified in the template before the current
 * stack update operation. For example, suppose you have updated the
 * `MaxBatchSize` in your stack template's `UpdatePolicy` from 1 to 10. You then
 * perform a stack update, and that update fails and CloudFormation initiates an
 * update rollback operation. In such a case, CloudFormation will use 1 as the
 * maximum batch size, rather than 10. For this reason, we recommend you make
 * changes to the UpdatePolicy configuration in a stack update separate from and
 * before any updates to the `AWS::AutoScaling::AutoScalingGroup` resource that
 * are likely to initiate rolling updates.
 *
 * @see {@link https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-attribute-updatepolicy.html#cfn-attributes-updatepolicy-rollingupdate}
 */

export type AutoScalingRollingUpdatePolicy = {
  /**
   * Specifies the maximum number of instances that CloudFormation updates.
   *
   * @default 1
   */
  MaxBatchSize?: number | ValueFn<number> | undefined;

  /**
   * Specifies the minimum number of instances that must be in service within
   * the Auto Scaling group while CloudFormation updates old instances. This
   * value must be less than the `MaxSize` of the Auto Scaling group.\
   *
   * @default 0
   */
  MinInstancesInService?: number | ValueFn<number> | undefined;

  /**
   * Specifies the percentage of instances in an Auto Scaling rolling update
   * that must signal success for an update to succeed. You can specify a value
   * from `0` to `100`. CloudFormation rounds to the nearest tenth of a percent.
   * For example, if you update five instances with a minimum successful
   * percentage of `50`, three instances must signal success.
   *
   * If an instance doesn't send a signal within the time specified in the
   * `PauseTime` property, CloudFormation assumes that the instance wasn't
   * updated.
   *
   * If you specify this property, you must also enable the
   * `WaitOnResourceSignals` and `PauseTime` properties.
   *
   * The `MinSuccessfulInstancesPercent` parameter applies only to instances
   * only for signaling purpose. To specify the number of instances in your
   * autoscaling group, see the `MinSize`, `MaxSize`, and `DesiredCapacity`
   * properties fo the `AWS::AutoScaling::AutoScalingGroup` resource.
   *
   * @default 100
   */
  MinSuccessfulInstancesPercent?: number | ValueFn<number> | undefined;

  /**
   * The amount of time that CloudFormation pauses after making a change to a
   * batch of instances to give those instances time to start software
   * applications. For example, you might need to specify `PauseTime` when
   * scaling up the number of instances in an Auto Scaling group.
   *
   * If you enable the WaitOnResourceSignals property, `PauseTime` is the amount
   * of time that CloudFormation should wait for the Auto Scaling group to
   * receive the required number of valid signals from added or replaced
   * instances. If the `PauseTime` is exceeded before the Auto Scaling group
   * receives the required number of signals, the update fails. For best
   * results, specify a time period that gives your applications sufficient time
   * to get started. If the update needs to be rolled back, a short `PauseTime`
   * can cause the rollback to fail.
   *
   * Specify `PauseTime` in the ISO8601 duration format (in the format
   * `PT#H#M#S`, where each `#` is the number of hours, minutes, and seconds,
   * respectively). The maximum `PauseTime` is one hour (`PT1H`).
   *
   * **Default:** `PT0S` (0 seconds). If the `WaitOnResourceSignals` property is
   * set to true, the default is `PT5M`.
   */
  PauseTime?: string | ValueFn<string> | undefined;

  /**
   * Specifies the Auto Scaling processes to suspend during a stack update.
   * Suspending processes prevents Auto Scaling from interfering with a stack
   * update. For example, you can suspend alarming so that Amazon EC2 Auto
   * Scaling doesn't execute scaling policies associated with an alarm. For
   * valid values, see the `ScalingProcesses.member.N` parameter for the
   * SuspendProcesses action in the Amazon EC2 Auto Scaling API Reference.
   */
  SuspendProcesses?:
    | (string | ValueFn<string>)[]
    | ValueFn<string[]>
    | undefined;

  /**
   * Specifies whether the Auto Scaling group waits on signals from new
   * instances during an update. Use this property to ensure that instances have
   * completed installing and configuring applications before the Auto Scaling
   * group update proceeds. AWS CloudFormation suspends the update of an Auto
   * Scaling group after new EC2 instances are launched into the group. AWS
   * CloudFormation must receive a signal from each new instance within the
   * specified PauseTime before continuing the update. To signal the Auto
   * Scaling group, use the `cfn-signal` helper script or SignalResource API.
   *
   * To have instances wait for an Elastic Load Balancing health check before
   * they signal success, add a health-check verification by using the `cfn-init`
   * helper script. For an example, see the `verify_instance_health` command in
   * the Auto Scaling rolling updates sample template.
   *
   * @default false
   */
  WaitOnResourceSignals?: boolean | ValueFn<boolean> | undefined;
};

/**
 * To specify how AWS CloudFormation handles updates for the `MinSize`,
 * `MaxSize`, and `DesiredCapacity` properties when the
 * `AWS::AutoScaling::AutoScalingGroup` resource has an associated scheduled
 * action, use the `AutoScalingScheduledAction` policy.
 *
 * With scheduled actions, the group size properties of an Auto Scaling group
 * can change at any time. When you update a stack with an Auto Scaling group
 * and scheduled action, CloudFormation always sets the group size property
 * values of your Auto Scaling group to the values that are defined in the
 * `AWS::AutoScaling::AutoScalingGroup` resource of your template, even if a
 * scheduled action is in effect.
 *
 * If you don't want CloudFormation to change any of the group size property
 * values when you have a scheduled action in effect, use the
 * `AutoScalingScheduledAction` update policy and set
 * `IgnoreUnmodifiedGroupSizeProperties` to true to prevent CloudFormation from
 * changing the `MinSize`, `MaxSize`, or `DesiredCapacity` properties unless you
 * have modified these values in your template.
 *
 * @see {@link https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-attribute-updatepolicy.html#cfn-attributes-updatepolicy-scheduledactions}
 */

export type AutoScalingScheduledActionPolicy = {
  /**
   * If true, AWS CloudFormation ignores differences in group size properties
   * between your current Auto Scaling group and the Auto Scaling group
   * described in the `AWS::AutoScaling::AutoScalingGroup` resource of your
   * template during a stack update. If you modify any of the group size
   * property values in your template, AWS CloudFormation uses the modified
   * values and updates your Auto Scaling group.
   *
   * @default false
   */
  IgnoreUnmodifiedGroupSizeProperties?: boolean | undefined;
};

/**
 * To perform an CodeDeploy deployment when the version changes on an
 * `AWS::Lambda::Alias` resource, use the `CodeDeployLambdaAliasUpdate` update
 * policy.
 *
 * @see {@link https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-attribute-updatepolicy.html#cfn-attributes-updatepolicy-codedeploylambdaaliasupdate}
 */
export type CodeDeployLambdaAliasUpdatePolicy = {
  /**
   * The name of the Lambda function to run after traffic routing completes.
   */
  AfterAllowTrafficHook?: string | ValueFn<string> | undefined;

  /**
   * The name of the CodeDeploy application.
   */
  ApplicationName: string | ValueFn<string> | undefined;

  /**
   * The name of the Lambda function to run before traffic routing starts.
   */
  BeforeAllowTrafficHook?: string | ValueFn<string> | undefined;

  /**
   * The name of the CodeDeploy deployment group. This is where the
   * traffic-shifting policy is set.
   */
  DeploymentGroupName: string | ValueFn<string> | undefined;
};

/**
 * For an Auto Scaling group replacement update, specifies how many instances
 * must signal success for the update to succeed.
 *
 * @see {@link https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-attribute-creationpolicy.html}
 */
export type AutoScalingCreationPolicy = {
  /**
   * Specifies the percentage of instances in an Auto Scaling replacement update
   * that must signal success for the update to succeed. You can specify a value
   * from `0` to `100`. CloudFormation rounds to the nearest tenth of a percent.
   * For example, if you update five instances with a minimum successful
   * percentage of `50`, three instances must signal success. If an instance
   * doesn't send a signal within the time specified by the Timeout property,
   * CloudFormation assumes that the instance wasn't created.
   */
  MinSuccessfulInstancesPercent?: number | ValueFn<number> | undefined;
};

/**
 * When CloudFormation creates the associated resource, configures the number of
 * required success signals and the length of time that CloudFormation waits for
 * those signals.
 *
 * @see {@link https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-attribute-creationpolicy.html}
 */
export type ResourceSignalPolicy = {
  /**
   * The number of success signals CloudFormation must receive before it sets
   * the resource status as `CREATE_COMPLETE`. If the resource receives a
   * failure signal or doesn't receive the specified number of signals before
   * the timeout period expires, the resource creation fails and CloudFormation
   * rolls the stack back.
   */
  Count?: number | ValueFn<number> | undefined;

  /**
   * The length of time that CloudFormation waits for the number of signals that
   * was specified in the Count property. The timeout period starts after
   * CloudFormation starts creating the resource, and the timeout expires no
   * sooner than the time you specify but can occur shortly thereafter. The
   * maximum time that you can specify is 12 hours.
   *
   * The value must be in ISO8601 duration format, in the form: `"PT#H#M#S"`,
   * where each # is the number of hours, minutes, and seconds, respectively.
   * For best results, specify a period of time that gives your instances plenty
   * of time to get up and running. A shorter timeout can cause a rollback.
   */
  Timeout?: string | ValueFn<string> | undefined;
};

/**
 * Associate the `CreationPolicy` attribute with a resource to prevent its
 * status from reaching create complete until AWS CloudFormation receives a
 * specified number of success signals or the timeout period is exceeded. To
 * signal a resource, you can use the `cfn-signal` helper script or
 * SignalResource API. CloudFormation publishes valid signals to the stack
 * events so that you track the number of signals sent.
 *
 * @see {@link https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-attribute-creationpolicy.html}
 */
export type CreationPolicy = {
  /**
   * For an Auto Scaling group replacement update, specifies how many instances
   * must signal success for the update to succeed.
   */
  AutoScalingCreationPolicy?: AutoScalingCreationPolicy | undefined;

  /**
   * When CloudFormation creates the associated resource, configures the number
   * of required success signals and the length of time that CloudFormation
   * waits for those signals.
   */
  ResourceSignal?: ResourceSignalPolicy | undefined;
};

/**
 * With the `DeletionPolicy` attribute you can preserve, and in some cases,
 * backup a resource when its stack is deleted. You specify a `DeletionPolicy`
 * attribute for each resource that you want to control. If a resource has no
 * `DeletionPolicy` attribute, AWS CloudFormation deletes the resource by
 * default, except for:
 *
 *  - For `AWS::RDS::DBCluster resources`, the default policy is `Snapshot`.
 *  - For `AWS::RDS::DBInstance` resources that don't specify the
 *    `DBClusterIdentifier` property, the default policy is `Snapshot`.
 *  - For Amazon S3 buckets, you must delete all objects in the bucket for
 *    deletion to succeed.
 *
 * This capability also applies to stack update operations that lead to
 * resources being deleted from stacks. For example, if you remove the resource
 * from the stack template, and then update the stack with the template. This
 * capability doesn't apply to resources whose physical instance is replaced
 * during stack update operations. For example, if you edit a resource's
 * properties such that CloudFormation replaces that resource during a stack
 * update.
 *
 * To keep a resource when its stack is deleted, specify Retain for that
 * resource. You can use retain for any resource. For example, you can retain a
 * nested stack, Amazon S3 bucket, or EC2 instance so that you can continue to
 * use or modify those resources after you delete their stacks.
 *
 * For resources that support snapshots, such as `AWS::EC2::Volume`, specify
 * Snapshot to have CloudFormation create a snapshot before deleting the
 * resource.
 *
 * @see {@link https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-attribute-deletionpolicy.html}
 */
export type DeletionPolicy = "Delete" | "Retain" | "Snapshot";

/**
 * Use the UpdateReplacePolicy attribute to retain or, in some cases, backup the
 * existing physical instance of a resource when it's replaced during a stack
 * update operation.
 *
 * When you initiate a stack update, AWS CloudFormation updates resources based
 * on differences between what you submit and the stack's current template and
 * parameters. If you update a resource property that requires that the resource
 * be replaced, CloudFormation recreates the resource during the update.
 * Recreating the resource generates a new physical ID. CloudFormation creates
 * the replacement resource first, and then changes references from other
 * dependent resources to point to the replacement resource. By default,
 * CloudFormation then deletes the old resource. Using the UpdateReplacePolicy,
 * you can specify that CloudFormation retain or, in some cases, create a
 * snapshot of the old resource.
 *
 * For resources that support snapshots, such as `AWS::EC2::Volume`, specify
 * Snapshot to have CloudFormation create a snapshot before deleting the old
 * resource instance.
 *
 * @see {@link https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-attribute-updatereplacepolicy.html}
 */
export type UpdateReplacePolicy = "Delete" | "Retain" | "Snapshot";

/**
 * Use the `UpdatePolicy` attribute to specify how AWS CloudFormation handles
 * updates to the `AWS::AppStream::Fleet`,
 * `AWS::AutoScaling::AutoScalingGroup`, ``AWS::ElastiCache::ReplicationGroup``,
 * `AWS::OpenSearchService::Domain`, `AWS::Elasticsearch::Domain`, or
 * `AWS::Lambda::Alias resources`.
 *
 * @see {@link https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-attribute-updatepolicy.html}
 */
export type UpdatePolicy = {
  /**
   * To specify how AWS CloudFormation handles replacement updates for an Auto
   * Scaling group, use the AutoScalingReplacingUpdate policy. This policy
   * enables you to specify whether AWS CloudFormation replaces an Auto Scaling
   * group with a new one or replaces only the instances in the Auto Scaling
   * group.
   *
   * @see {@link https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-attribute-updatepolicy.html#cfn-attributes-updatepolicy-replacingupdate}
   */
  AutoScalingReplacing?: AutoScalingReplacingUpdatePolicy | undefined;

  /**
   * To specify how CloudFormation handles rolling updates for an Auto Scaling
   * group, use the `AutoScalingRollingUpdate` policy. Rolling updates enable
   * you to specify whether AWS CloudFormation updates instances that are in an
   * Auto Scaling group in batches or all at once.
   *
   * Be aware that, during stack update rollback operations, CloudFormation uses
   * the `UpdatePolicy` configuration specified in the template before the
   * current stack update operation. For example, suppose you have updated the
   * `MaxBatchSize` in your stack template's `UpdatePolicy` from 1 to 10. You
   * then perform a stack update, and that update fails and CloudFormation
   * initiates an update rollback operation. In such a case, CloudFormation will
   * use 1 as the maximum batch size, rather than 10. For this reason, we
   * recommend you make changes to the UpdatePolicy configuration in a stack
   * update separate from and before any updates to the
   * `AWS::AutoScaling::AutoScalingGroup` resource that are likely to initiate
   * rolling updates.
   *
   * @see {@link https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-attribute-updatepolicy.html#cfn-attributes-updatepolicy-rollingupdate}
   */
  AutoScalingRollingUpdate?: AutoScalingRollingUpdatePolicy | undefined;

  /**
   * To specify how AWS CloudFormation handles updates for the `MinSize`,
   * `MaxSize`, and `DesiredCapacity` properties when the
   * `AWS::AutoScaling::AutoScalingGroup` resource has an associated scheduled
   * action, use the `AutoScalingScheduledAction` policy.
   *
   * With scheduled actions, the group size properties of an Auto Scaling group
   * can change at any time. When you update a stack with an Auto Scaling group
   * and scheduled action, CloudFormation always sets the group size property
   * values of your Auto Scaling group to the values that are defined in the
   * `AWS::AutoScaling::AutoScalingGroup` resource of your template, even if a
   * scheduled action is in effect.
   *
   * If you don't want CloudFormation to change any of the group size property
   * values when you have a scheduled action in effect, use the
   * `AutoScalingScheduledAction` update policy and set
   * `IgnoreUnmodifiedGroupSizeProperties` to true to prevent CloudFormation
   * from changing the `MinSize`, `MaxSize`, or `DesiredCapacity` properties
   * unless you have modified these values in your template.
   *
   * @see {@link https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-attribute-updatepolicy.html#cfn-attributes-updatepolicy-scheduledactions}
   */
  AutoScalingScheduledAction?: AutoScalingScheduledActionPolicy | undefined;

  /**
   * To perform an CodeDeploy deployment when the version changes on an
   * `AWS::Lambda::Alias` resource, use the `CodeDeployLambdaAliasUpdate` update
   * policy.
   *
   * @see {@link https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-attribute-updatepolicy.html#cfn-attributes-updatepolicy-codedeploylambdaaliasupdate}
   */
  CodeDeployLambdaAliasUpdate?: CodeDeployLambdaAliasUpdatePolicy | undefined;

  /**
   * To upgrade an OpenSearch Service domain to a new version of OpenSearch or
   * Elasticsearch rather than replacing the entire
   * `AWS::OpenSearchService::Domain` or `AWS::Elasticsearch::Domain` resource, use
   * the `EnableVersionUpgrade` update policy.
   *
   * If `EnableVersionUpgrade` is set to true, you can update the `EngineVersion`
   * property of the `AWS::OpenSearchService::Domain` resource (or the
   * `ElasticsearchVersion` property of the legacy `AWS::Elasticsearch::Domain`
   * resource), and CloudFormation will update that property without
   * interruption. When `EnableVersionUpgrade` is set to false, or not specified,
   * updating the `EngineVersion` or `ElasticsearchVersion` property results in
   * CloudFormation replacing the entire
   * `AWS::OpenSearchService::Domain`/`AWS::Elasticsearch::Domain` resource.
   *
   * @see {@link https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-attribute-updatepolicy.html#cfn-attributes-updatepolicy-upgradeopensearchdomain}
   */
  EnableVersionUpgrade?: boolean | ValueFn<boolean> | undefined;

  /**
   * To modify a replication group's shards by adding or removing shards, rather
   * than replacing the entire `AWS::ElastiCache::ReplicationGroup` resource,
   * use the `UseOnlineResharding` update policy.
   *
   * If `UseOnlineResharding` is set to true, you can update the `NumNodeGroups`
   * and `NodeGroupConfiguration` properties of the
   * `AWS::ElastiCache::ReplicationGroup` resource, and CloudFormation will
   * update those properties without interruption. When `UseOnlineResharding` is
   * set to false, or not specified, updating the `NumNodeGroups` and
   * `NodeGroupConfiguration` properties results in CloudFormation replacing the
   * entire `AWS::ElastiCache::ReplicationGroup` resource.
   *
   * @see {@link https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-attribute-updatepolicy.html#cfn-attributes-updatepolicy-useonlineresharding}
   */
  UseOnlineResharding?: boolean | ValueFn<boolean> | undefined;
};

/**
 * A key-value pair to associate with a resource.
 */
export type Tag = {
  /**
   * The key name of the tag. You can specify a value that is 1 to 128 Unicode
   * characters in length and cannot be prefixed with `aws:`. You can use any of
   * the following characters: the set of Unicode letters, digits, whitespace,
   * _, ., /, =, +, and -.
   * @minLength 1
   * @maxLength 128
   */
  Key: string;
  /**
   * The value for the tag. You can specify a value that is 0 to 256 Unicode
   * characters in length and cannot be prefixed with `aws:`. You can use any of
   * the following characters: the set of Unicode letters, digits, whitespace,
   * _, ., /, =, +, and -.
   * @minLength 1
   * @maxLength 256
   */
  Value: string;
};
