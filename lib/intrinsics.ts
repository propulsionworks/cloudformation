import type { JsonPrimitive } from "./json.ts";
import type { AwsScalarParameterType } from "./parameters.ts";

/**
 * Branding symbol for {@link IntrinsicValue}.
 */
export const IntrinsicValueType = Symbol.for(
  "@propulsionworks/cloudformation/IntrinsicValueType",
);

/**
 * Pseudo parameters are parameters that are predefined by AWS CloudFormation.
 * You don't declare them in your template. Use them the same way as you would a
 * parameter, as the argument for the Ref function.
 */
export const PseudoParameters = [
  "AWS::AccountId",
  "AWS::NotificationARNs",
  "AWS::NoValue",
  "AWS::Partition",
  "AWS::Region",
  "AWS::StackId",
  "AWS::StackName",
  "AWS::URLSuffix",
] as const;

/**
 * Pseudo parameters are parameters that are predefined by AWS CloudFormation.
 * You don't declare them in your template. Use them the same way as you would a
 * parameter, as the argument for the Ref function.
 */
export type PseudoParameter = (typeof PseudoParameters)[number];

/**
 * Type brand for intrinsic functions returning the given type.
 */
export type IntrinsicValue<T> = {
  [IntrinsicValueType]: T;
};

type LogicFunction<ValueFn, LogicFn = never> =
  | FnAnd<ValueFn, LogicFn>
  | FnEquals<ValueFn>
  | FnNot<ValueFn, LogicFn>
  | FnOr<ValueFn, LogicFn>
  | LogicFn;

/**
 * Value functions which can be used within Condition definitions.
 */
export type ConditionValueFunction = FnFindInMap | Ref;

/**
 * Value functions which can be used with If functions.
 */
export type IfValueFunction<Value> =
  | (Value extends string ? FnBase64 | FnJoin | FnSub : never)
  | (Value extends string[] ? FnGetAZs : never)
  | FnFindInMap<Value>
  | FnGetAtt<Value>
  | FnIf<Value>
  | FnSelect<Value>
  | Ref<Value>;

/**
 * You can use intrinsic functions, such as Fn::If, Fn::Equals, and Fn::Not, to
 * conditionally create stack resources. These conditions are evaluated based on
 * input parameters that you declare when you create or update a stack. After
 * you define all your conditions, you can associate them with resources or
 * resource properties in the Resources and Outputs sections of a template.
 */
export type ConditionFunction = LogicFunction<ConditionValueFunction>;

/**
 * An intrinsic function which returns the given value.
 */
export type ValueFn<Value = unknown> =
  | (Value extends string ? FnBase64 | FnJoin | FnSub : never)
  | (Value extends readonly string[] ? FnCidr | FnGetAZs | FnSplit : never)
  | (Value extends readonly (infer Element)[] ? ValueFn<Element>[] : never)
  | FnFindInMap<Value>
  | FnGetAtt<Value>
  | FnIf<Value>
  | FnImportValue<Value>
  | FnSelect<Value>
  | Ref<Value>;

/**
 * Convert a value to accept intrinsic functions.
 */
// use [Value] extends [JsonPrimitive]: don't distribute on unions or it gets unwieldy
export type WithIntrinsics<Value> = [Value] extends [JsonPrimitive]
  ? Value | ValueFn<Value>
  : Value extends readonly (infer Element extends JsonPrimitive)[]
    ? Value | ValueFn<Value> | (Element | ValueFn<Element>)[]
    : Value extends object
      ? { [K in keyof Value]: WithIntrinsics<Value[K]> }
      : Value;

/**
 * Condition functions for use in Rule conditions or assertions.
 */
export type RuleConditionFunction =
  | FnContains
  | FnEachMemberEquals
  | FnEachMemberIn;

/**
 * String value functions which can be used with rules.
 */
export type RuleValueFunction<Value = string | string[]> =
  | (Value extends string[] ? FnRefAll | FnValueOfAll : never)
  | FnValueOf<Value>
  | Ref<Value>;

/**
 * In the condition or assertions of a rule, you can use intrinsic functions,
 * such as `Fn::Equals`, `Fn::Not`, and `Fn::RefAll`. The condition property
 * determines if AWS CloudFormation applies the assertions. If the condition
 * evaluates to true, CloudFormation evaluates the assertions to verify whether
 * a parameter value is valid when a provisioned product is created or updated.
 * If a parameter value isn't valid, CloudFormation doesn't create or update the
 * stack. If the condition evaluates to false, CloudFormation doesn't check the
 * parameter value and proceeds with the stack operation.
 */
export type RuleFunction = LogicFunction<
  RuleValueFunction,
  RuleConditionFunction
>;

/**
 * Returns true if all the specified conditions evaluate to true, or returns
 * false if any one of the conditions evaluates to false. `Fn::And` acts as an
 * AND operator. The minimum number of conditions that you can include is 2,
 * and the maximum is 10.
 *
 * @param conditions A condition that evaluates to true or false.
 *
 * @see {@link https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/intrinsic-function-reference-conditions.html#intrinsic-function-reference-conditions-and}
 */
export type FnAnd<ValueFn = ConditionValueFunction, LogicFn = never> = {
  "Fn::And": LogicFunction<ValueFn, LogicFn>[];
};

/**
 * The intrinsic function `Fn::Base64` returns the Base64 representation of
 * the input string. This function is typically used to pass encoded data to
 * Amazon EC2 instances by way of the UserData property.
 *
 * @param valueToEncode The string value you want to convert to Base64.
 * @returns The original string, in Base64 representation.
 *
 * @see {@link https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/intrinsic-function-reference-base64.html}
 */
export type FnBase64 = {
  [IntrinsicValueType]?: string;
  "Fn::Base64": string | ValueFn<string>;
};

/**
 * The intrinsic function `Fn::Cidr` returns an array of CIDR address blocks.
 * The number of CIDR blocks returned is dependent on the count parameter.
 *
 * @param ipBlock The user-specified CIDR address block to be split into
 * smaller CIDR blocks.
 * @param count The number of CIDRs to generate. Valid range is between 1 and
 * 256.
 * @param cidrBits The number of subnet bits for the CIDR. For example,
 * specifying a value "8" for this parameter will create a CIDR with a mask of
 * "/24".
 * @returns An array of CIDR address blocks.
 *
 * @see {@link https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/intrinsic-function-reference-cidr.html}
 */
export type FnCidr = {
  [IntrinsicValueType]?: string[];
  "Fn::Cidr": [
    ipBlock: string | FnSelect<string> | Ref<string>,
    count: number | FnSelect<number> | Ref<number>,
    cidrBits: number | FnSelect<number> | Ref<number>,
  ];
};

/**
 * The intrinsic function Condition returns the evaluated result of the
 * specified condition.
 *
 * When you are declaring a condition in a template and you need to use another
 * condition in the evaluation, you can use Condition to refer to that other
 * condition. This is used when declaring a condition in the Conditions section
 * of the template.
 *
 * @param name The name of the condition you want to reference.
 *
 * @see {@link https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/intrinsic-function-reference-condition.html}
 */
export type FnCondition = {
  Condition: string;
};

/**
 * Returns `true` if a specified string matches at least one value in a list
 * of strings.
 *
 * @param listOfStrings A list of strings, such as `"A", "B", "C"`.
 * @param string A string, such as `"A"`, that you want to compare against a
 * list of strings.
 *
 * @see {@link https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/intrinsic-function-reference-rules.html#fn-contains}
 */
export type FnContains = {
  "Fn::Contains": [
    listOfStrings: string[] | RuleValueFunction<string[]>,
    string: string | RuleValueFunction<string>,
  ];
};

/**
 * Returns `true` if a specified string matches all values in a list.
 *
 * @param listOfStrings A list of strings, such as `"A", "B", "C"`.
 * @param string A string, such as `"A"`, that you want to compare against a
 * list of strings.
 *
 * @see {@link https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/intrinsic-function-reference-rules.html#fn-eachmemberequals}
 */
export type FnEachMemberEquals = {
  "Fn::EachMemberEquals": [
    listOfStrings: string[] | RuleValueFunction<string[]>,
    string: string | RuleValueFunction<string>,
  ];
};

/**
 * Returns `true` if a specified string matches all values in a list.
 *
 * @param stringsToCheck A list of strings, such as `"A", "B", "C"`.
 * CloudFormation checks whether each member in the stringsToC`heck parameter
 * is in the `stringsToMap` parameter.
 * @param stringsToMatch A list of strings, such as `"A", "B", "C"`. Each
 * member in the `stringsToMatch` parameter is compared against the members of
 * the `stringsToCheck` parameter.
 *
 * @see {@link https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/intrinsic-function-reference-rules.html#fn-eachmemberin}
 */
export type FnEachMemberIn = {
  "Fn::EachMemberIn": [
    stringsToCheck: string[] | RuleValueFunction<string[]>,
    stringsToMatch: string[] | RuleValueFunction<string[]>,
  ];
};

/**
 * Compares if two values are equal. Returns true if the two values are equal
 * or false if they aren't.
 *
 * @param value1 A value of any primitive type that you want to compare.
 * @param value2 A value of any primitive type that you want to compare.
 *
 * @see {@link https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/intrinsic-function-reference-conditions.html#intrinsic-function-reference-conditions-equals}
 */
export type FnEquals<ValueFn = ConditionValueFunction> = {
  "Fn::Equals": [
    value1: JsonPrimitive | ValueFn,
    value2: JsonPrimitive | ValueFn,
  ];
};

/**
 * The intrinsic function `Fn::FindInMap` returns the value corresponding to
 * keys in a two-level map that is declared in the Mappings section.
 *
 * @param mapName The logical name of a mapping declared in the Mappings
 * section that contains the keys and values.
 * @param topLevelKey The top-level key name. Its value is a list of key-value pairs.
 * @param secondLevelKey The second-level key name, which is set to one of the keys from the list assigned to TopLevelKey.
 * @returns The value that is assigned to SecondLevelKey.
 *
 * @see {@link https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/intrinsic-function-reference-findinmap.html}
 */
export type FnFindInMap<Value = unknown> = {
  [IntrinsicValueType]?: Value;
  "Fn::FindInMap": [
    mapName: string | FnFindInMap<string> | Ref<string>,
    topLevelKey: string | FnFindInMap<string> | Ref<string>,
    secondLevelKey: string | FnFindInMap<string> | Ref<string>,
  ];
};

/**
 * The `Fn::GetAtt` intrinsic function returns the value of an attribute from
 * a resource in the template. For more information about GetAtt return values
 * for a particular resource, refer to the documentation for that resource in
 * the Resource and Property Reference.
 *
 * @param logicalNameOfResource The logical name (also called logical ID) of
 * the resource that contains the attribute that you want.
 * @param attributeName The name of the resource-specific attribute whose
 * value you want. See the resource's reference page for details about the
 * attributes available for that resource type.
 * @returns The attribute value.
 *
 * @see {@link https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/intrinsic-function-reference-getatt.html}
 */
export type FnGetAtt<Value> = {
  [IntrinsicValueType]?: Value;
  "Fn::GetAtt": [
    logicalResourceName: string,
    attributeName: string | Ref<string>,
  ];
};

/**
 * The intrinsic function `Fn::GetAZs` returns an array that lists
 * Availability Zones for a specified region. Because customers have access to
 * different Availability Zones, the intrinsic function `Fn::GetAZs` enables
 * template authors to write templates that adapt to the calling user's
 * access. That way you don't have to hard-code a full list of Availability
 * Zones for a specified region.
 *
 * @param region The name of the region for which you want to get the
 * Availability Zones. You can use the AWS::Region pseudo parameter to
 * specify the region in which the stack is created. Specifying an empty
 * string is equivalent to specifying AWS::Region.
 * @returns The list of Availability Zones for the region.
 *
 * @see {@link https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/intrinsic-function-reference-getavailabilityzones.html}
 */
export type FnGetAZs = {
  [IntrinsicValueType]?: string[];
  "Fn::GetAZs": string | Ref<string>;
};

/**
 * Returns one value if the specified condition evaluates to true and another
 * value if the specified condition evaluates to false. Currently, AWS
 * CloudFormation supports the Fn::If intrinsic function in the metadata
 * attribute, update policy attribute, and property values in the Resources
 * section and Outputs sections of a template. You can use the `AWS::NoValue`
 * pseudo parameter as a return value to remove the corresponding property.
 *
 * @param conditionName A reference to a condition in the Conditions section.
 * Use the condition's name to reference it.
 * @param valueIfTrue A value to be returned if the specified condition
 * evaluates to true.
 * @param valueIfFalse A value to be returned if the specified condition
 * evaluates to false.
 *
 * @see {@link https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/intrinsic-function-reference-conditions.html#intrinsic-function-reference-conditions-if}
 */
export type FnIf<Value> = {
  [IntrinsicValueType]?: Value;
  "Fn::If": [
    conditionName: string,
    valueIfTrue: Value | IfValueFunction<Value>,
    valueIfFalse: Value | IfValueFunction<Value>,
  ];
};

/**
 * The intrinsic function `Fn::ImportValue` returns the value of an output
 * exported by another stack. You typically use this function to create
 * cross-stack references. In the following example template snippets, Stack A
 * exports VPC security group values and Stack B imports them.
 *
 * @param sharedValueToImport The stack output value that you want to import.
 * @returns The stack output value.
 *
 * @see {@link https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/intrinsic-function-reference-importvalue.html}
 */
export type FnImportValue<Value> = {
  [IntrinsicValueType]?: Value;
  "Fn::ImportValue":
    | string
    | FnBase64
    | FnJoin
    | FnSub
    | FnFindInMap<string>
    | FnIf<string>
    | FnSelect<string>
    | Ref<string>;
};

/**
 * The intrinsic function `Fn::Join` appends a set of values into a single
 * value, separated by the specified delimiter. If a delimiter is the empty
 * string, the set of values are concatenated with no delimiter.
 *
 * @param delimiter The value you want to occur between fragments. The
 * delimiter will occur between fragments only. It will not terminate the
 * final value.
 * @param listOfValues The list of values you want combined.
 * @returns The combined string.
 *
 * @see {@link https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/intrinsic-function-reference-join.html}
 */
export type FnJoin = {
  [IntrinsicValueType]?: string;
  "Fn::Join": [delimiter: string, listOfValues: FnJoinListValue];
};

/**
 * Allowed functions in each element of the `listOfValues` parameter in
 * {@link FnJoin}.
 */
export type FnJoinListItemValue =
  | string
  | FnBase64
  | FnFindInMap<string>
  | FnGetAtt<string>
  | FnIf<string>
  | FnImportValue<string>
  | FnSelect<string>
  | Ref<string>;

/**
 * Allowed functions in the `listOfValues` parameter in {@link FnJoin}.
 */
export type FnJoinListValue =
  | FnGetAZs
  | FnFindInMap<string[]>
  | FnGetAtt<string[]>
  | FnIf<string[]>
  | FnImportValue<string[]>
  | FnSelect<string[]>
  | FnSplit
  | Ref<string[]>
  | FnJoinListItemValue[];

/**
 * Returns true for a condition that evaluates to false or returns false for a
 * condition that evaluates to true. `Fn::Not` acts as a NOT operator.
 *
 * @param condition A condition such as `Fn::Equals` that evaluates to true or
 * false.
 *
 * @see {@link https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/intrinsic-function-reference-conditions.html#intrinsic-function-reference-conditions-not}
 */
export type FnNot<ValueFn = ConditionValueFunction, LogicFn = never> = {
  "Fn::Not": [condition: LogicFunction<ValueFn, LogicFn>];
};

/**
 * Returns true if any one of the specified conditions evaluate to true, or
 * returns false if all of the conditions evaluates to false. `Fn::Or` acts as
 * an OR operator. The minimum number of conditions that you can include is 2,
 * and the maximum is 10.
 *
 * @param conditions A condition that evaluates to true or false.
 *
 * @see {@link https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/intrinsic-function-reference-conditions.html#intrinsic-function-reference-conditions-or}
 */
export type FnOr<ValueFn = ConditionValueFunction, LogicFn = never> = {
  "Fn::Or": LogicFunction<ValueFn, LogicFn>[];
};

/**
 * The intrinsic function Ref returns the value of the specified parameter or
 * resource.
 *
 * - When you specify a parameter's logical name, it returns the value of the
 * parameter.
 *
 * - When you specify a resource's logical name, it returns a value that you
 * can typically use to refer to that resource, such as a physical ID.
 *
 * When you are declaring a resource in a template and you need to specify
 * another template resource by name, you can use the Ref to refer to that
 * other resource. In general, Ref returns the name of the resource. For
 * example, a reference to an AWS::AutoScaling::AutoScalingGroup returns the
 * name of that Auto Scaling group resource.
 *
 * @param logicalName The logical name of the resource or parameter you want
 * to dereference.
 *
 * @returns The physical ID of the resource or the value of the parameter.
 *
 * @see {@link https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/intrinsic-function-reference-ref.html}
 */
export type Ref<Value = unknown> = {
  [IntrinsicValueType]?: Value;
  Ref: string;
};

/**
 * Returns all values for a specified parameter type.
 *
 * @param parameterType An AWS-specific parameter type, such as
 * `AWS::EC2::SecurityGroup::Id` or `AWS::EC2::VPC::Id`. For more information,
 * see Parameters in the AWS CloudFormation User Guide.
 *
 * @see {@link https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/intrinsic-function-reference-rules.html#fn-refall}
 */
export type FnRefAll = {
  [IntrinsicValueType]?: string[];
  "Fn::RefAll": string | RuleValueFunction<string>;
};

/**
 * The intrinsic function `Fn::Select` returns a single object from a list of
 * objects by index.
 *
 * @param index The index of the object to retrieve. This must be a value from
 * zero to N-1, where N represents the number of elements in the array.
 * @param listOfObjects The list of objects to select from. This list must not
 * be null, nor can it have null entries.
 * @returns The selected object.
 *
 * @see {@link https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/intrinsic-function-reference-select.html}
 */
export type FnSelect<Value> = {
  [IntrinsicValueType]?: Value;
  "Fn::Select": [
    index: number | Ref<number> | FnFindInMap<number>,
    listOfObjects:
      | Value[]
      | (Value extends string[] ? FnGetAZs | FnSplit : never)
      | FnFindInMap<Value[]>
      | FnGetAtt<Value[]>
      | Ref<Value[]>,
  ];
};

/**
 * To split a string into a list of string values so that you can select an
 * element from the resulting string list, use the `Fn::Split` intrinsic
 * function. Specify the location of splits with a delimiter, such as , (a
 * comma). After you split a string, use the `Fn::Select` function to pick a
 * specific element.
 *
 * @param delimiter A string value that determines where the source string is
 * divided.
 * @param sourceString The string value that you want to split.
 * @returns A list of string values.
 *
 * @see {@link https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/intrinsic-function-reference-split.html}
 */
export type FnSplit = {
  [IntrinsicValueType]?: string[];
  "Fn::Split": [delimiter: string, sourceString: string | ValueFn<string>];
};

/**
 * The intrinsic function `Fn::Sub` substitutes variables in an input string
 * with values that you specify. In your templates, you can use this function
 * to construct commands or outputs that include values that aren't available
 * until you create or update a stack.
 *
 * @param text A string with variables that AWS CloudFormation substitutes
 * with their associated values at runtime. Write variables as `${MyVarName}`.
 * Variables can be template parameter names, resource logical IDs,
 * resource attributes, or a variable in a key-value map. If you specify only
 * template parameter names, resource logical IDs, and resource attributes,
 * don't specify a key-value map.
 *
 * If you specify template parameter names or resource logical IDs, such as
 * `${InstanceTypeParameter}` AWS CloudFormation returns the same values as if
 * you used the Ref intrinsic function. If you specify resource attributes,
 * such as `${MyInstance.PublicIp}` AWS CloudFormation returns the same values
 * as if you used the `Fn::GetAtt` intrinsic function.
 *
 * To write a dollar sign and curly braces (`${}`) literally, add an
 * exclamation point (!) after the open curly brace, such as `${!Literal}`.
 * AWS CloudFormation resolves this text as `${Literal}`.
 *
 * @param values A map of values that AWS CloudFormation substitutes for the
 * associated variable names at runtime.
 *
 * @see {@link https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/intrinsic-function-reference-sub.html}
 */
export type FnSub = {
  [IntrinsicValueType]?: string;
  "Fn::Sub": [text: string, values: Record<string, string | ValueFn<string>>];
};

/**
 * Map of parameter type to attribute name to output type.
 */
export type FnValueOfTypeMap = {
  "AWS::EC2::VPC::Id": {
    DefaultNetworkAcl: string;
    DefaultSecurityGroup: string;
  } & Record<`Tags.${string}`, string>;
  "AWS::EC2::Subnet::Id": {
    AvailabilityZone: string;
    VpcId: string;
  } & Record<`Tags.${string}`, string>;
  "AWS::EC2::SecurityGroup::Id": Record<`Tags.${string}`, string>;
};

/**
 * Supported attributes for {@link FnValueOf} and {@link FnValueOfAll}.
 */
export type FnValueOfAttribute = {
  [K in keyof FnValueOfTypeMap]: keyof FnValueOfTypeMap[K];
}[keyof FnValueOfTypeMap];

/**
 * Supported parameter types for {@link FnValueOf} and {@link FnValueOfAll}.
 */
export type FnValueOfType = keyof FnValueOfTypeMap;

/**
 * Returns an attribute value or list of values for a specific parameter and
 * attribute.
 *
 * @param parameterLogicalId The name of a parameter for which you want to
 * retrieve attribute values. The parameter must be declared in the
 * `Parameters` section of the template.
 * @param attribute The name of an attribute from which you want to retrieve a
 * value.
 *
 * @see {@link https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/intrinsic-function-reference-rules.html#fn-valueof}
 */
export type FnValueOf<Value = string> = {
  [IntrinsicValueType]?: Value;
  "Fn::ValueOf": [parameterLogicalId: string, attribute: FnValueOfAttribute];
};

/**
 * Returns a list of all attribute values for a given parameter type and
 * attribute.
 *
 * @param parameterType An AWS-specific parameter type, such as
 * `AWS::EC2::SecurityGroup::Id` or `AWS::EC2::VPC::Id`. For more information,
 * see Parameters in the AWS CloudFormation User Guide.
 * @param attribute The name of an attribute from which you want to retrieve a
 * value.
 *
 * @see {@link https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/intrinsic-function-reference-rules.html#fn-valueofall}
 */
export type FnValueOfAll = {
  [IntrinsicValueType]?: string[];
  "Fn::ValueOfAll": [
    parameterType: FnValueOfType,
    attribute: FnValueOfAttribute,
  ];
};

/**
 * You can use intrinsic functions, such as Fn::If, Fn::Equals, and Fn::Not, to
 * conditionally create stack resources. These conditions are evaluated based on
 * input parameters that you declare when you create or update a stack. After
 * you define all your conditions, you can associate them with resources or
 * resource properties in the Resources and Outputs sections of a template.
 *
 * You define all conditions in the Conditions section of a template except for
 * Fn::If conditions. You can use the Fn::If condition in the metadata
 * attribute, update policy attribute, and property values in the Resources
 * section and Outputs sections of a template.
 *
 * You might use conditions when you want to reuse a template that can create
 * resources in different contexts, such as a test environment versus a
 * production environment. In your template, you can add an EnvironmentType
 * input parameter, which accepts either prod or test as inputs. For the
 * production environment, you might include Amazon EC2 instances with certain
 * capabilities; however, for the test environment, you want to use less
 * capabilities to save costs. With conditions, you can define which resources
 * are created and how they're configured for each environment type.
 *
 * @see {@link https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/intrinsic-function-reference-conditions.html}
 */
// eslint-disable-next-line @typescript-eslint/no-extraneous-class -- keep the functions together to match cfn
export class Fn {
  /**
   * Returns true if all the specified conditions evaluate to true, or returns
   * false if any one of the conditions evaluates to false. `Fn::And` acts as an
   * AND operator. The minimum number of conditions that you can include is 2,
   * and the maximum is 10.
   *
   * @param conditions A condition that evaluates to true or false.
   *
   * @see {@link https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/intrinsic-function-reference-conditions.html#intrinsic-function-reference-conditions-and}
   */
  public static And<ValueFn, LogicFn>(
    ...args: LogicFunction<ValueFn, LogicFn>[]
  ): FnAnd<ValueFn, LogicFn> {
    return {
      "Fn::And": args,
    };
  }

  /**
   * The intrinsic function `Fn::Base64` returns the Base64 representation of
   * the input string. This function is typically used to pass encoded data to
   * Amazon EC2 instances by way of the UserData property.
   *
   * @param valueToEncode The string value you want to convert to Base64.
   * @returns The original string, in Base64 representation.
   *
   * @see {@link https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/intrinsic-function-reference-base64.html}
   */
  public static Base64(
    valueToEncode: string | ValueFn<string>,
  ): Required<FnBase64> {
    return valueFn({ "Fn::Base64": valueToEncode });
  }

  /**
   * The intrinsic function `Fn::Cidr` returns an array of CIDR address blocks.
   * The number of CIDR blocks returned is dependent on the count parameter.
   *
   * @param ipBlock The user-specified CIDR address block to be split into
   * smaller CIDR blocks.
   * @param count The number of CIDRs to generate. Valid range is between 1 and
   * 256.
   * @param cidrBits The number of subnet bits for the CIDR. For example,
   * specifying a value "8" for this parameter will create a CIDR with a mask of
   * "/24".
   * @returns An array of CIDR address blocks.
   *
   * @see {@link https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/intrinsic-function-reference-cidr.html}
   */
  public static Cidr(
    ipBlock: string | FnSelect<string> | Ref<string>,
    count: number | FnSelect<number> | Ref<number>,
    cidrBits: number | FnSelect<number> | Ref<number>,
  ): Required<FnCidr> {
    return valueFn({
      "Fn::Cidr": [ipBlock, count, cidrBits],
    });
  }

  /**
   * Returns `true` if a specified string matches at least one value in a list
   * of strings.
   *
   * @param listOfStrings A list of strings, such as `"A", "B", "C"`.
   * @param string A string, such as `"A"`, that you want to compare against a
   * list of strings.
   *
   * @see {@link https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/intrinsic-function-reference-rules.html#fn-contains}
   */
  public static Contains(
    listOfStrings: string[] | RuleValueFunction<string[]>,
    string: string | RuleValueFunction<string>,
  ): FnContains {
    return { "Fn::Contains": [listOfStrings, string] };
  }

  /**
   * Returns `true` if a specified string matches all values in a list.
   *
   * @param listOfStrings A list of strings, such as `"A", "B", "C"`.
   * @param string A string, such as `"A"`, that you want to compare against a
   * list of strings.
   *
   * @see {@link https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/intrinsic-function-reference-rules.html#fn-eachmemberequals}
   */
  public static EachMemberEquals(
    listOfStrings: string[] | RuleValueFunction<string[]>,
    string: string | RuleValueFunction<string>,
  ): FnEachMemberEquals {
    return {
      "Fn::EachMemberEquals": [listOfStrings, string],
    };
  }

  /**
   * Returns `true` if a specified string matches all values in a list.
   *
   * @param stringsToCheck A list of strings, such as `"A", "B", "C"`.
   * CloudFormation checks whether each member in the stringsToC`heck parameter
   * is in the `stringsToMap` parameter.
   * @param stringsToMatch A list of strings, such as `"A", "B", "C"`. Each
   * member in the `stringsToMatch` parameter is compared against the members of
   * the `stringsToCheck` parameter.
   *
   * @see {@link https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/intrinsic-function-reference-rules.html#fn-eachmemberin}
   */
  public static EachMemberIn(
    stringsToCheck: string[] | RuleValueFunction<string[]>,
    stringsToMatch: string[] | RuleValueFunction<string[]>,
  ): FnEachMemberIn {
    return {
      "Fn::EachMemberIn": [stringsToCheck, stringsToMatch],
    };
  }

  /**
   * Compares if two values are equal. Returns true if the two values are equal
   * or false if they aren't.
   *
   * @param value1 A value of any primitive type that you want to compare.
   * @param value2 A value of any primitive type that you want to compare.
   *
   * @see {@link https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/intrinsic-function-reference-conditions.html#intrinsic-function-reference-conditions-equals}
   */
  public static Equals<Value1 extends JsonPrimitive, Value2 extends Value1>(
    value1: Value1 | FnFindInMap<Value1> | Ref<Value1>,
    value2: Value2 | FnFindInMap<Value2> | Ref<Value2>,
  ): FnEquals {
    return { "Fn::Equals": [value1, value2] };
  }

  /**
   * The intrinsic function `Fn::FindInMap` returns the value corresponding to
   * keys in a two-level map that is declared in the Mappings section.
   *
   * @param mapName The logical name of a mapping declared in the Mappings
   * section that contains the keys and values.
   * @param topLevelKey The top-level key name. Its value is a list of key-value pairs.
   * @param secondLevelKey The second-level key name, which is set to one of the keys from the list assigned to TopLevelKey.
   * @returns The value that is assigned to SecondLevelKey.
   *
   * @see {@link https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/intrinsic-function-reference-findinmap.html}
   */
  public static FindInMap<Value>(
    mapName: string | FnFindInMap<string> | Ref<string>,
    topLevelKey: string | FnFindInMap<string> | Ref<string>,
    secondLevelKey: string | FnFindInMap<string> | Ref<string>,
  ): Required<FnFindInMap<Value>> {
    return valueFn({
      "Fn::FindInMap": [mapName, topLevelKey, secondLevelKey],
    });
  }

  /**
   * The `Fn::GetAtt` intrinsic function returns the value of an attribute from
   * a resource in the template. For more information about GetAtt return values
   * for a particular resource, refer to the documentation for that resource in
   * the Resource and Property Reference.
   *
   * @param logicalNameOfResource The logical name (also called logical ID) of
   * the resource that contains the attribute that you want.
   * @param attributeName The name of the resource-specific attribute whose
   * value you want. See the resource's reference page for details about the
   * attributes available for that resource type.
   * @returns The attribute value.
   *
   * @see {@link https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/intrinsic-function-reference-getatt.html}
   */
  public static GetAtt<Value>(
    logicalResourceName: string,
    attributeName: string | Ref<string>,
  ): Required<FnGetAtt<Value>> {
    return valueFn({
      "Fn::GetAtt": [logicalResourceName, attributeName],
    });
  }

  /**
   * The intrinsic function `Fn::GetAZs` returns an array that lists
   * Availability Zones for a specified region. Because customers have access to
   * different Availability Zones, the intrinsic function `Fn::GetAZs` enables
   * template authors to write templates that adapt to the calling user's
   * access. That way you don't have to hard-code a full list of Availability
   * Zones for a specified region.
   *
   * @param region The name of the region for which you want to get the
   * Availability Zones. You can use the AWS::Region pseudo parameter to
   * specify the region in which the stack is created. Specifying an empty
   * string is equivalent to specifying AWS::Region.
   * @returns The list of Availability Zones for the region.
   *
   * @see {@link https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/intrinsic-function-reference-getavailabilityzones.html}
   */
  public static GetAZs(region: string | Ref<string>): Required<FnGetAZs> {
    return valueFn({ "Fn::GetAZs": region });
  }

  /**
   * Returns one value if the specified condition evaluates to true and another
   * value if the specified condition evaluates to false. Currently, AWS
   * CloudFormation supports the Fn::If intrinsic function in the metadata
   * attribute, update policy attribute, and property values in the Resources
   * section and Outputs sections of a template. You can use the `AWS::NoValue`
   * pseudo parameter as a return value to remove the corresponding property.
   *
   * @param conditionName A reference to a condition in the Conditions section.
   * Use the condition's name to reference it.
   * @param valueIfTrue A value to be returned if the specified condition
   * evaluates to true.
   * @param valueIfFalse A value to be returned if the specified condition
   * evaluates to false.
   *
   * @see {@link https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/intrinsic-function-reference-conditions.html#intrinsic-function-reference-conditions-if}
   */
  public static If<T, F>(
    conditionName: string,
    valueIfTrue: T | IfValueFunction<T>,
    valueIfFalse: F | IfValueFunction<F>,
  ): Required<FnIf<T | F>> {
    return valueFn({
      "Fn::If": [conditionName, valueIfTrue, valueIfFalse],
    });
  }

  /**
   * The intrinsic function `Fn::ImportValue` returns the value of an output
   * exported by another stack. You typically use this function to create
   * cross-stack references. In the following example template snippets, Stack A
   * exports VPC security group values and Stack B imports them.
   *
   * @param sharedValueToImport The stack output value that you want to import.
   * @returns The stack output value.
   *
   * @see {@link https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/intrinsic-function-reference-importvalue.html}
   */
  public static ImportValue<Value>(
    sharedValueToImport: FnImportValue<Value>["Fn::ImportValue"],
  ): Required<FnImportValue<Value>> {
    return valueFn({ "Fn::ImportValue": sharedValueToImport });
  }

  /**
   * The intrinsic function `Fn::Join` appends a set of values into a single
   * value, separated by the specified delimiter. If a delimiter is the empty
   * string, the set of values are concatenated with no delimiter.
   *
   * @param delimiter The value you want to occur between fragments. The
   * delimiter will occur between fragments only. It will not terminate the
   * final value.
   * @param listOfValues The list of values you want combined.
   * @returns The combined string.
   *
   * @see {@link https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/intrinsic-function-reference-join.html}
   */
  public static Join(
    delimiter: string,
    listOfValues: FnJoinListValue,
  ): Required<FnJoin> {
    return valueFn({ "Fn::Join": [delimiter, listOfValues] });
  }

  /**
   * Returns true for a condition that evaluates to false or returns false for a
   * condition that evaluates to true. `Fn::Not` acts as a NOT operator.
   *
   * @param condition A condition such as `Fn::Equals` that evaluates to true or
   * false.
   *
   * @see {@link https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/intrinsic-function-reference-conditions.html#intrinsic-function-reference-conditions-not}
   */
  public static Not<ValueFn, LogicFn>(
    condition: LogicFunction<ValueFn, LogicFn>,
  ): FnNot<ValueFn, LogicFn> {
    return { "Fn::Not": [condition] };
  }

  /**
   * Returns true if any one of the specified conditions evaluate to true, or
   * returns false if all of the conditions evaluates to false. `Fn::Or` acts as
   * an OR operator. The minimum number of conditions that you can include is 2,
   * and the maximum is 10.
   *
   * @param conditions A condition that evaluates to true or false.
   *
   * @see {@link https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/intrinsic-function-reference-conditions.html#intrinsic-function-reference-conditions-or}
   */
  public static Or<ValueFn, LogicFn>(
    ...conditions: LogicFunction<ValueFn, LogicFn>[]
  ): FnOr<ValueFn, LogicFn> {
    return { "Fn::Or": conditions };
  }

  /**
   * Returns all values for a specified parameter type.
   *
   * @param parameterType An AWS-specific parameter type, such as
   * `AWS::EC2::SecurityGroup::Id` or `AWS::EC2::VPC::Id`. For more information,
   * see Parameters in the AWS CloudFormation User Guide.
   *
   * @see {@link https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/intrinsic-function-reference-rules.html#fn-refall}
   */
  public static RefAll(
    parameterType: AwsScalarParameterType,
  ): Required<FnRefAll> {
    return valueFn({ "Fn::RefAll": parameterType });
  }

  /**
   * The intrinsic function `Fn::Select` returns a single object from a list of
   * objects by index.
   *
   * @param index The index of the object to retrieve. This must be a value from
   * zero to N-1, where N represents the number of elements in the array.
   * @param listOfObjects The list of objects to select from. This list must not
   * be null, nor can it have null entries.
   * @returns The selected object.
   *
   * @see {@link https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/intrinsic-function-reference-select.html}
   */
  public static Select<Value>(
    index: FnSelect<Value>["Fn::Select"][0],
    listOfObjects: FnSelect<Value>["Fn::Select"][1],
  ): Required<FnSelect<Value>> {
    return valueFn({ "Fn::Select": [index, listOfObjects] });
  }

  /**
   * To split a string into a list of string values so that you can select an
   * element from the resulting string list, use the `Fn::Split` intrinsic
   * function. Specify the location of splits with a delimiter, such as , (a
   * comma). After you split a string, use the `Fn::Select` function to pick a
   * specific element.
   *
   * @param delimiter A string value that determines where the source string is
   * divided.
   * @param sourceString The string value that you want to split.
   * @returns A list of string values.
   *
   * @see {@link https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/intrinsic-function-reference-split.html}
   */
  public static Split(
    delimiter: string,
    sourceString: string | ValueFn<string>,
  ): Required<FnSplit> {
    return valueFn({ "Fn::Split": [delimiter, sourceString] });
  }

  /**
   * The intrinsic function `Fn::Sub` substitutes variables in an input string
   * with values that you specify. In your templates, you can use this function
   * to construct commands or outputs that include values that aren't available
   * until you create or update a stack.
   *
   * @param text A string with variables that AWS CloudFormation substitutes
   * with their associated values at runtime. Write variables as `${MyVarName}`.
   * Variables can be template parameter names, resource logical IDs,
   * resource attributes, or a variable in a key-value map. If you specify only
   * template parameter names, resource logical IDs, and resource attributes,
   * don't specify a key-value map.
   *
   * If you specify template parameter names or resource logical IDs, such as
   * `${InstanceTypeParameter}` AWS CloudFormation returns the same values as if
   * you used the Ref intrinsic function. If you specify resource attributes,
   * such as `${MyInstance.PublicIp}` AWS CloudFormation returns the same values
   * as if you used the `Fn::GetAtt` intrinsic function.
   *
   * To write a dollar sign and curly braces (`${}`) literally, add an
   * exclamation point (!) after the open curly brace, such as `${!Literal}`.
   * AWS CloudFormation resolves this text as `${Literal}`.
   *
   * @param values A map of values that AWS CloudFormation substitutes for the
   * associated variable names at runtime.
   *
   * @see {@link https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/intrinsic-function-reference-sub.html}
   */
  public static Sub(
    text: string,
    values: Record<string, ValueFn<string>>,
  ): Required<FnSub> {
    return valueFn({ "Fn::Sub": [text, values] });
  }

  /**
   * Returns an attribute value or list of values for a specific parameter and
   * attribute.
   *
   * @param parameterLogicalId The name of a parameter for which you want to
   * retrieve attribute values. The parameter must be declared in the
   * `Parameters` section of the template.
   * @param attribute The name of an attribute from which you want to retrieve a
   * value.
   *
   * @see {@link https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/intrinsic-function-reference-rules.html#fn-valueof}
   */
  public static ValueOf(
    parameterLogicalId: string,
    attribute: FnValueOfAttribute,
  ): Required<FnValueOf> {
    return valueFn({
      "Fn::ValueOf": [parameterLogicalId, attribute],
    });
  }

  /**
   * Returns a list of all attribute values for a given parameter type and
   * attribute.
   *
   * @param parameterType An AWS-specific parameter type, such as
   * `AWS::EC2::SecurityGroup::Id` or `AWS::EC2::VPC::Id`. For more information,
   * see Parameters in the AWS CloudFormation User Guide.
   * @param attribute The name of an attribute from which you want to retrieve a
   * value.
   *
   * @see {@link https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/intrinsic-function-reference-rules.html#fn-valueofall}
   */
  public static ValueOfAll<ParameterType extends keyof FnValueOfTypeMap>(
    parameterType: ParameterType,
    attribute: Extract<
      keyof FnValueOfTypeMap[ParameterType],
      FnValueOfAttribute
    >,
  ): Required<FnValueOfAll> {
    return valueFn({
      "Fn::ValueOfAll": [parameterType, attribute],
    });
  }
}

/**
 * The intrinsic function Condition returns the evaluated result of the
 * specified condition.
 *
 * When you are declaring a condition in a template and you need to use another
 * condition in the evaluation, you can use Condition to refer to that other
 * condition. This is used when declaring a condition in the Conditions section
 * of the template.
 *
 * @param name The name of the condition you want to reference.
 *
 * @see {@link https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/intrinsic-function-reference-condition.html}
 */
export function Condition(name: string): FnCondition {
  return { Condition: name };
}

/**
 * Returns the AWS account ID of the account in which the stack is being
 * created, such as `123456789012`.
 *
 * @see {@link https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/pseudo-parameter-reference.html#cfn-pseudo-param-accountid}
 */
export function Ref(name: "AWS::AccountId"): Ref<string>;
/**
 * Returns the list of notification Amazon Resource Names (ARNs) for the
 * current stack.
 *
 * To get a single ARN from the list, use {@link Split}.
 *
 * @see {@link https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/pseudo-parameter-reference.html#cfn-pseudo-param-notificationarns}
 */
export function Ref(name: "AWS::NotificationARNs"): Ref<string>; // eslint-disable-line @typescript-eslint/unified-signatures
/**
 * Removes the corresponding resource property when specified as a return
 * value in the `Fn::If` intrinsic function.
 *
 * @see {@link https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/pseudo-parameter-reference.html#cfn-pseudo-param-novalue}
 */
export function Ref(name: "AWS::NoValue"): Ref<string>; // eslint-disable-line @typescript-eslint/unified-signatures
/**
 * Returns the partition that the resource is in. For standard AWS Regions,
 * the partition is `aws`. For resources in other partitions, the partition is
 * `aws-partitionname`. For example, the partition for resources in the China
 * (Beijing and Ningxia) Region is `aws-cn` and the partition for resources in
 * the AWS GovCloud (US-West) region is `aws-us-gov`.
 *
 * @see {@link https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/pseudo-parameter-reference.html#cfn-pseudo-param-partition}
 */
export function Ref(name: "AWS::Partition"): Ref<string>; // eslint-disable-line @typescript-eslint/unified-signatures
/**
 * Returns a string representing the Region in which the encompassing resource
 * is being created, such as `us-west-2`.
 *
 * @see {@link https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/pseudo-parameter-reference.html#cfn-pseudo-param-region}
 */
export function Ref(name: "AWS::Region"): Ref<string>; // eslint-disable-line @typescript-eslint/unified-signatures
/**
 * Returns the ID of the stack as specified with the aws cloudformation
 * create-stack command, such as
 * `arn:aws:cloudformation:us-west-2:123456789012:stack/teststack/51af3dc0-da77-11e4-872e-1234567db123`.
 *
 * @see {@link https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/pseudo-parameter-reference.html#cfn-pseudo-param-stackid}
 */
export function Ref(name: "AWS::StackId"): Ref<string>; // eslint-disable-line @typescript-eslint/unified-signatures
/**
 * Returns the name of the stack as specified with the aws cloudformation
 * `create-stack` command, such as `teststack`.
 *
 * @see {@link https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/pseudo-parameter-reference.html#cfn-pseudo-param-stackname}
 */
export function Ref(name: "AWS::StackName"): Ref<string>; // eslint-disable-line @typescript-eslint/unified-signatures
/**
 * Returns the suffix for a domain. The suffix is typically `amazonaws.com`,
 * but might differ by Region. For example, the suffix for the China (Beijing)
 * Region is `amazonaws.com.cn`.
 *
 * @see {@link https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/pseudo-parameter-reference.html#cfn-pseudo-param-urlsuffix}
 */
export function Ref(name: "AWS::URLSuffix"): Ref<string>; // eslint-disable-line @typescript-eslint/unified-signatures
/**
 * The intrinsic function Ref returns the value of the specified parameter or
 * resource.
 *
 * - When you specify a parameter's logical name, it returns the value of the
 * parameter.
 *
 * - When you specify a resource's logical name, it returns a value that you
 * can typically use to refer to that resource, such as a physical ID.
 *
 * When you are declaring a resource in a template and you need to specify
 * another template resource by name, you can use the Ref to refer to that
 * other resource. In general, Ref returns the name of the resource. For
 * example, a reference to an AWS::AutoScaling::AutoScalingGroup returns the
 * name of that Auto Scaling group resource.
 *
 * @param logicalName The logical name of the resource or parameter you want
 * to dereference.
 *
 * @returns The physical ID of the resource or the value of the parameter.
 *
 * @see {@link https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/intrinsic-function-reference-ref.html}
 */
export function Ref<Value>(name: string): Ref<Value>;
export function Ref(name: string): Ref {
  return valueFn({ Ref: name });
}

/**
 * Constructs a string value using {@link Join} from a tagged template
 * literal.
 */
export function joinStr(
  literals: TemplateStringsArray,
  ...values: FnJoinListItemValue[]
): FnJoin {
  const parts: FnJoinListItemValue[] = [];

  for (const [i, literal] of literals.entries()) {
    if (literal) {
      parts.push(literal);
    }
    if (i < values.length) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      parts.push(values[i]!);
    }
  }

  return Fn.Join("", parts);
}

function valueFn<T, Value>(
  obj: T & Partial<IntrinsicValue<Value>>,
): T & IntrinsicValue<Value> {
  return obj as T & IntrinsicValue<Value>;
}
