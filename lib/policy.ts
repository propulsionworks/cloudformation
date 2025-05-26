import type { WithIntrinsics } from "./intrinsics.ts";

/**
 * The `Version` policy element specifies the language syntax rules that are
 * to be used to process a policy. To use all of the available policy
 * features, include a `Version` element with a value of `"2012-10-17"`.
 *
 * @see {@link https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_elements_version.html}
 */
export type PolicyVersion = "2008-10-17" | "2012-10-17";

/**
 * You manage access in AWS by creating policies and attaching them to IAM
 * identities (users, groups of users, or roles) or AWS resources. A policy is
 * an object in AWS that, when associated with an identity or resource, defines
 * their permissions. AWS evaluates these policies when an IAM principal (user
 * or role) makes a request. Permissions in the policies determine whether the
 * request is allowed or denied. Most policies are stored in AWS as JSON
 * documents. AWS supports six types of policies: identity-based policies,
 * resource-based policies, permissions boundaries, Organizations SCPs, ACLs,
 * and session policies.
 *
 * @see {@link https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_elements.html}
 */
export type PolicyDocument = {
  /**
   * The `Version` policy element specifies the language syntax rules that are
   * to be used to process a policy. To use all of the available policy
   * features, include a `Version` element with a value of `"2012-10-17"`.
   *
   * @see {@link https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_elements_version.html}
   */
  Version?: PolicyVersion | undefined;

  /**
   * The `Statement` element is the main element for a policy. This element is
   * required. The Statement element can contain a single statement or an array
   * of individual statements. Each individual statement block must be enclosed
   * in curly braces `{ }`. For multiple statements, the array must be enclosed
   * in square brackets `[ ]`.
   *
   * @see {@link https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_elements_statement.html}
   */
  Statement: PolicyStatement[];
};

/**
 * The `Statement` element is the main element for a policy. This element is
 * required. The Statement element can contain a single statement or an array
 * of individual statements. Each individual statement block must be enclosed
 * in curly braces `{ }`. For multiple statements, the array must be enclosed
 * in square brackets `[ ]`.
 *
 * @see {@link https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_elements_statement.html}
 */
export type PolicyStatement = {
  /**
   * The `Action` element describes the specific action or actions that will be
   * allowed or denied. Statements must include either an `Action` or
   * `NotAction` element. Each AWS service has its own set of actions that
   * describe tasks that you can perform with that service.
   *
   * @see {@link https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_elements_action.html}
   */
  Action: string | string[];

  /**
   * The Condition element (or Condition block) lets you specify conditions for
   * when a policy is in effect. The Condition element is optional. In the
   * Condition element, you build expressions in which you use condition
   * operators (equal, less than, etc.) to match the condition keys and values
   * in the policy against keys and values in the request context.
   *
   * @see {@link https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_elements_condition.html}
   */
  Condition?: PolicyCondition;

  /**
   * The `Effect` element is required and specifies whether the statement
   * results in an allow or an explicit deny. Valid values for `Effect` are
   * `Allow` and `Deny`. By default, access to resources is denied. To allow
   * access to a resource, you must set the `Effect` element to `Allow`. To override
   * an allow (for example, to override an allow that is otherwise in force),
   * you set the `Effect` element to `Deny`.
   *
   * @see {@link https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_elements_effect.html}
   */
  Effect?: PolicyEffect | undefined;

  /**
   * `NotAction` is an advanced policy element that explicitly matches
   * everything except the specified list of actions. Using `NotAction` can
   * result in a shorter policy by listing only a few actions that should not
   * match, rather than including a long list of actions that will match. When
   * using `NotAction`, you should keep in mind that actions specified in this
   * element are the only actions in that are limited. This, in turn, means that
   * all of the applicable actions or services that are not listed are allowed
   * if you use the `Allow` effect. In addition, such unlisted actions or
   * services are denied if you use the `Deny` effect. When you use `NotAction`
   * with the `Resource` element, you provide scope for the policy. This is how
   * AWS determines which actions or services are applicable. For more
   * information, see the following example policy.
   *
   * @see {@link https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_elements_notaction.html}
   */
  NotAction?: string | string[] | undefined;

  /**
   * Use the `NotPrincipal` element to specify the IAM user, federated user, IAM
   * role, AWS account, AWS service, or other principal that is not allowed or
   * denied access to a resource. The `NotPrincipal` element enables you to
   * specify an exception to a list of principals. Use this element to deny
   * access to all principals except the one named in the `NotPrincipal`
   * element.
   *
   * @see {@link https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_elements_notprincipal.html}
   */
  NotPrincipal?: PolicyPrincipal | string | undefined;

  /**
   * `NotResource` is an advanced policy element that explicitly matches every
   * resource except those specified. Using `NotResource` can result in a
   * shorter policy by listing only a few resources that should not match,
   * rather than including a long list of resources that will match. This is
   * particularly useful for policies that apply within a single AWS service.
   *
   * @see {@link https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_elements_notresource.html}
   */
  NotResource?: string | string[] | undefined;

  /**
   * Use the `Principal` element in a resource-based JSON policy to specify the
   * principal that is allowed or denied access to a resource.
   *
   * @see {@link https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_elements_principal.html}
   */
  Principal?: PolicyPrincipal | string | undefined;

  /**
   * The `Resource` element specifies the object or objects that the statement
   * covers. Statements must include either a `Resource` or a `NotResource`
   * element. You specify a resource using an ARN.
   *
   * @see {@link https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_elements_resource.html}
   */
  Resource?: string | string[] | undefined;

  /**
   * You can provide an optional identifier, `Sid` (statement ID) for the policy
   * statement. You can assign a `Sid` value to each statement in a statement
   * array. In services that let you specify an ID element, such as SQS and SNS,
   * the `Sid` value is just a sub-ID of the policy document ID. In IAM, the
   * `Sid` value must be unique within a JSON policy.
   *
   * @see {@link https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_elements_sid.html}
   */
  Sid?: string | undefined;
};

/**
 * By default, access to resources is denied. To allow access to a resource, you
 * must set the `Effect` element to `Allow`. To override an allow (for example,
 * to override an allow that is otherwise in force), you set the `Effect`
 * element to `Deny`.
 *
 * @see {@link https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_elements_effect.html}
 */
export type PolicyEffect = "Allow" | "Deny";

/**
 * You can specify AWS account identifiers in the Principal element of a
 * resource-based policy or in condition keys that support principals. This
 * delegates authority to the account. When you allow access to a different
 * account, an administrator in that account must then grant access to an
 * identity (IAM user or role) in that account. When you specify an AWS account,
 * you can use the account ARN (arn:aws:iam::account-ID:root), or a shortened
 * form that consists of the "AWS" prefix followed by the account ID.
 *
 * @see {@link https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_elements_principal.html#principal-accounts}
 */
export type AwsPrincipal = {
  AWS: string | string[];
};

/**
 * An alpha-numeric identifier, that is an obfuscated form of the AWS account
 * ID. You can use this ID to identify an AWS account when granting
 * cross-account access to buckets and objects using Amazon S3. You can retrieve
 * the canonical user ID for your AWS account as either the root user or an IAM
 * user.
 *
 * @see {@link https://docs.aws.amazon.com/general/latest/gr/acct-identifiers.html#FindingCanonicalId}
 */
export type CanonicalUserPrincipal = {
  CanonicalUser: string;
};

/**
 * A web identity session principal is a session principal that results from
 * using the AWS STS `AssumeRoleWithWebIdentity` operation. You can use an
 * external web identity provider (IdP) to sign in, and then assume an IAM role
 * using this operation. This leverages identity federation and issues a role
 * session.
 *
 * @see {@link https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_elements_principal.html#principal-federated-web-identity}
 */
export type FederatedPrincipal = {
  Federated: string;
};

/**
 * You can specify AWS services in the `Principal` element of a resource-based
 * policy or in condition keys that support principals. A service principal is
 * an identifier for a service.
 *
 * @see {@link https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_elements_principal.html#principal-services}
 */
export type ServicePrincipal = {
  Service: string | string[];
};

/**
 * Use the `Principal` element in a resource-based JSON policy to specify the
 * principal that is allowed or denied access to a resource.
 *
 * @see {@link https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_elements_principal.html}
 */
export type PolicyPrincipal =
  | AwsPrincipal
  | CanonicalUserPrincipal
  | FederatedPrincipal
  | ServicePrincipal;

/**
 * String condition operators let you construct Condition elements that restrict
 * access based on comparing a key to a string value.
 * @see {@link https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_elements_condition_operators.html#Conditions_String}
 */
type StringConditionOperator =
  | "StringEquals"
  | "StringNotEquals"
  | "StringEqualsIgnoreCase"
  | "StringNotEqualsIgnoreCase"
  | "StringLike"
  | "StringNotLike";

/**
 * Numeric condition operators let you construct Condition elements that
 * restrict access based on comparing a key to an integer or decimal value.
 * @see {@link https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_elements_condition_operators.html#Conditions_Numeric}
 */
type NumericConditionOperator =
  | "NumericEquals"
  | "NumericNotEquals"
  | "NumericLessThan"
  | "NumericLessThanEquals"
  | "NumericGreaterThan"
  | "NumericGreaterThanEquals";

/**
 * Date condition operators let you construct Condition elements that restrict
 * access based on comparing a key to a date/time value. You use these condition
 * operators with `aws:CurrentTime` key or `aws:EpochTime` key. You must specify
 * date/time values with one of the W3C implementations of the ISO 8601 date
 * formats or in epoch (UNIX) time.
 * @see {@link https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_elements_condition_operators.html#Conditions_Date}
 */
type DateConditionOperator =
  | "DateEquals"
  | "DateNotEquals"
  | "DateLessThan"
  | "DateLessThanEquals"
  | "DateGreaterThan"
  | "DateGreaterThanEquals";

/**
 * Boolean conditions let you construct Condition elements that restrict access
 * based on comparing a key to "true" or "false."
 * @see {@link https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_elements_condition_operators.html#Conditions_Boolean}
 */
type BooleanConditionOperator = "Bool";

/**
 * The BinaryEquals condition operator let you construct Condition elements that
 * test key values that are in binary format. It compares the value of the
 * specified key byte for byte against a base-64 encoded representation of the
 * binary value in the policy.
 * @see {@link https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_elements_condition_operators.html#Conditions_BinaryEquals}
 */
type BinaryConditionOperator = "BinaryEquals";

/**
 * IP address condition operators let you construct Condition elements that
 * restrict access based on comparing a key to an IPv4 or IPv6 address or range
 * of IP addresses. You use these with the aws:SourceIp key. The value must be
 * in the standard CIDR format (for example, 203.0.113.0/24 or
 * 2001:DB8:1234:5678::/64). If you specify an IP address without the associated
 * routing prefix, IAM uses the default prefix value of /32.
 * @see {@link https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_elements_condition_operators.html#Conditions_IPAddress}
 */
type IpAddressConditionOperator = "IpAddress" | "NotIpAddress";

/**
 * Amazon Resource Name (ARN) condition operators let you construct Condition
 * elements that restrict access based on comparing a key to an ARN. The ARN is
 * considered a string.
 * @see {@link https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_elements_condition_operators.html#Conditions_ARN}
 */
type ArnConditionOperator =
  | "ArnEquals"
  | "ArnLike"
  | "ArnNotEquals"
  | "ArnNotLike";

type UnqualifiedConditionOperator =
  | StringConditionOperator
  | NumericConditionOperator
  | DateConditionOperator
  | BooleanConditionOperator
  | BinaryConditionOperator
  | IpAddressConditionOperator
  | ArnConditionOperator
  | "Null";

/**
 * To compare your condition context key against a request context key with
 * multiple values, you must use the ForAllValues or ForAnyValue set operators.
 * These set operators are used to compare two sets of values, such as the set
 * of tags in a request and the set of tags in a policy condition.
 * @see {@link https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_condition-single-vs-multi-valued-context-keys.html#reference_policies_condition-multi-valued-context-keys}
 */
type SetConditionOperator<
  Operator extends UnqualifiedConditionOperator = UnqualifiedConditionOperator,
> = `ForAllValues:${Operator}` | `ForAnyValue:${Operator}`;

/**
 * You can add IfExists to the end of any condition operator name except the
 * `Null` condition—for example, `StringLikeIfExists`. You do this to say "If
 * the condition key is present in the context of the request, process the key
 * as specified in the policy. If the key is not present, evaluate the condition
 * element as true." Other condition elements in the statement can still result
 * in a nonmatch, but not a missing key when checked with `...IfExists`. If you
 * are using an `"Effect": "Deny"` element with a negated condition operator
 * like `StringNotEqualsIfExists`, the request is still denied even if the
 * condition key is not present.
 * @see {@link https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_elements_condition_operators.html#Conditions_IfExists}
 */
type IfExistsOperator<
  Operator extends Exclude<UnqualifiedConditionOperator, "Null"> = Exclude<
    UnqualifiedConditionOperator,
    "Null"
  >,
> = `${Operator}IfExists`;

/**
 * An operator for a policy condition.
 */
export type PolicyConditionOperator =
  | UnqualifiedConditionOperator
  | SetConditionOperator
  | IfExistsOperator;

/**
 * The comparison key and value for a policy condition.
 */
export type PolicyConditionValue<Key extends string = string> = Record<
  Key,
  string | string[]
>;

/**
 * The Condition element (or Condition block) lets you specify conditions for
 * when a policy is in effect. The Condition element is optional. In the
 * Condition element, you build expressions in which you use condition
 * operators (equal, less than, etc.) to match the condition keys and values
 * in the policy against keys and values in the request context.
 *
 * @see {@link https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_elements_condition.html}
 */
export type PolicyCondition = Partial<
  Record<PolicyConditionOperator, PolicyConditionValue>
>;

/**
 * Like {@link PolicyDocument} but accepts intrinsic functions, for use within
 * a resource definition.
 */
export type TemplatePolicyDocument = WithIntrinsics<PolicyDocument>;
