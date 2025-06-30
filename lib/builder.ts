import { assert } from "./assert.ts";
import {
  Condition,
  Fn,
  Ref,
  type ConditionFunction,
  type FnCondition,
  type FnFindInMap,
  type FnGetAtt,
  type FnValueOf,
  type FnValueOfType,
  type FnValueOfTypeMap,
} from "./intrinsics.js";
import type { ParameterType, ParameterTypeMap } from "./parameters.ts";
import {
  TemplateSection,
  type MappingDefinition,
  type OutputDefinition,
  type ParameterDefinition,
  type ResourceDefinition,
  type ResourceOptions,
  type RuleDefinition,
  type Template,
  type TemplateSectionType,
} from "./template.js";

/**
 * Metadata symbol used for embedding the attributes type in a
 * {@link ResourceDefinitionWithAttributes}.
 */
export const AttributeType = Symbol(
  "@propulsionworks/cloudformation/AttributeType",
);

/**
 * Metadata symbol used for embedding the attributes type in a
 * {@link ResourceDefinitionWithAttributes}.
 */
export type AttributeType = typeof AttributeType;

/**
 * Thrown if a duplicate entity is added to a {@link TemplateBuilder}.
 */
export class DuplicateTemplateEntityError extends Error {
  public constructor(sectionName: TemplateSection, name: string) {
    const entity = getTemplateEntityName(sectionName);
    super(`the ${entity} "${name}" has already been added to the template`);
    this.name = "DuplicateTemplateEntityError";
  }
}

/**
 * Extends {@link ResourceDefinition} with the resource attributes type.
 */
export type ResourceDefinitionWithAttributes<
  Type extends string = string,
  Props extends object = Record<string, unknown>,
  Attributes extends object = never,
> = ResourceDefinition<Type, Props> & {
  [AttributeType]?: Attributes;
};

/**
 * Represents a condition that has been added to a template.
 */
export type ConditionInstance = {
  name: string;
  ref: () => FnCondition;
};

/**
 * Represents a mapping that has been added to a template.
 */
export type MappingInstance<
  TopLevelKey extends string = string,
  SecondLevelKey extends string = string,
  Value = unknown,
> = {
  name: string;
  findInMap: (
    TopLevelKey: TopLevelKey,
    secondLevelKey: SecondLevelKey,
  ) => Required<FnFindInMap<Value>>;
};

/**
 * Represents a parameter that has been added to a template.
 */
export type ParameterInstance<T extends ParameterType> = T extends FnValueOfType
  ? {
      name: string;
      ref: () => Ref<ParameterTypeMap[T]>;
      valueOf: <Attr extends keyof FnValueOfTypeMap[T]>(
        attribute: Attr,
      ) => Required<FnValueOf<FnValueOfTypeMap[T][Attr]>>;
    }
  : {
      name: string;
      ref: () => Ref<ParameterTypeMap[T]>;
    };

/**
 * Represents a resource that has been added to a template.
 */
export type ResourceInstance<Def> =
  Def extends ResourceDefinitionWithAttributes<any, any, infer Attributes>
    ? {
        name: string;
        ref: <T = string>() => Ref<T>;
        getAtt: <Attr extends keyof Attributes>(
          name: Attr,
        ) => Required<FnGetAtt<Attributes[Attr]>>;
      }
    : {
        name: string;
        ref: <T = string>() => Ref<T>;
      };

/**
 * Utility class to assist with creating {@link Template} instances.
 */
export class TemplateBuilder<
  ResourceType extends ResourceDefinition = ResourceDefinition,
> {
  readonly #template: Template;

  public get template(): Template {
    return this.#template;
  }

  public constructor(template?: Template) {
    this.#template = template ?? { Resources: {} };
  }

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
   * @see {@link https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/conditions-section-structure.html}
   */
  public addCondition(
    name: string,
    definition: ConditionFunction,
  ): ConditionInstance {
    this.#addSection("Conditions", name, definition);
    return {
      name,
      ref: () => Condition(name),
    };
  }

  /**
   * The optional `Mappings` section matches a key to a corresponding set of
   * named values. For example, if you want to set values based on a region, you
   * can create a mapping that uses the region name as a key and contains the
   * values you want to specify for each specific region. You use the
   * `Fn::FindInMap` intrinsic function to retrieve values in a map.
   *
   * @see {@link https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/mappings-section-structure.html}
   */
  public addMapping<
    TopLevelKey extends string,
    SecondLevelKey extends string,
    Value,
  >(
    name: string,
    definition: MappingDefinition<TopLevelKey, SecondLevelKey, Value>,
  ): MappingInstance<TopLevelKey, SecondLevelKey, Value>;

  /**
   * The optional `Mappings` section matches a key to a corresponding set of
   * named values. For example, if you want to set values based on a region, you
   * can create a mapping that uses the region name as a key and contains the
   * values you want to specify for each specific region. You use the
   * `Fn::FindInMap` intrinsic function to retrieve values in a map.
   *
   * @see {@link https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/mappings-section-structure.html}
   */
  public addMapping<
    TopLevelKey extends string,
    SecondLevelKey extends string,
    Value,
  >(
    name: string,
    topLevelKey: TopLevelKey,
    mapping: Record<SecondLevelKey, Value>,
  ): MappingInstance<TopLevelKey, SecondLevelKey, Value>;

  /**
   * The optional `Mappings` section matches a key to a corresponding set of
   * named values. For example, if you want to set values based on a region, you
   * can create a mapping that uses the region name as a key and contains the
   * values you want to specify for each specific region. You use the
   * `Fn::FindInMap` intrinsic function to retrieve values in a map.
   *
   * @see {@link https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/mappings-section-structure.html}
   */
  public addMapping<
    TopLevelKey extends string,
    SecondLevelKey extends string,
    Value,
  >(
    name: string,
    topLevelKey: TopLevelKey,
    secondLevelKey: SecondLevelKey,
    value: Value,
  ): MappingInstance<TopLevelKey, SecondLevelKey, Value>;

  /**
   * The optional `Mappings` section matches a key to a corresponding set of
   * named values. For example, if you want to set values based on a region, you
   * can create a mapping that uses the region name as a key and contains the
   * values you want to specify for each specific region. You use the
   * `Fn::FindInMap` intrinsic function to retrieve values in a map.
   *
   * @see {@link https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/mappings-section-structure.html}
   */
  public addMapping(
    name: string,
    topLevel: string | MappingDefinition,
    secondLevel?: string | Record<string, unknown>,
    value?: unknown,
  ): MappingInstance {
    if (typeof topLevel === "object") {
      this.#addSection("Mappings", name, topLevel);
    } else if (typeof secondLevel === "object") {
      this.#set(["Mappings", name, topLevel], secondLevel);
    } else {
      assert(secondLevel);
      this.#set(["Mappings", name, topLevel, secondLevel], value);
    }
    return {
      name,
      findInMap: Fn.FindInMap.bind(Fn, name),
    };
  }

  /**
   * The optional `Outputs` section declares output values that you can import
   * into other stacks (to create cross-stack references), return in response (to
   * describe stack calls), or view on the AWS CloudFormation console. For
   * example, you can output the S3 bucket name for a stack to make the bucket
   * easier to find.
   *
   * @see {@link https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/outputs-section-structure.html}
   */
  public addOutput(name: string, definition: OutputDefinition): void {
    this.#addSection("Outputs", name, definition);
  }

  /**
   * Use the optional `Parameters` section to customize your templates.
   * Parameters enable you to input custom values to your template each time you
   * create or update a stack.
   *
   * @see {@link https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/parameters-section-structure.html}
   */
  public addParameter<T extends ParameterType>(
    name: string,
    definition: ParameterDefinition<T>,
  ): ParameterInstance<T> {
    this.#addSection("Parameters", name, definition);
    return {
      name,
      ref: () => Ref(name),
      valueOf: Fn.ValueOf.bind(Fn, name),
    } as ParameterInstance<T>;
  }

  /**
   * The required `Resources` section declares the AWS resources that you want
   * to include in the stack, such as an Amazon EC2 instance or an Amazon S3
   * bucket.
   *
   * @see {@link https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/resources-section-structure.html}
   */
  public addResource<T extends ResourceType["Type"]>(
    name: string,
    type: T,
    properties: Extract<ResourceType, { Type: T }>["Properties"],
    options?: ResourceOptions,
  ): ResourceInstance<Extract<ResourceType, { Type: T }>> {
    this.#addSection("Resources", name, {
      Type: type,
      Properties: properties,
      ...options,
    });
    return {
      name,
      ref: () => Ref(name),
      getAtt: Fn.GetAtt.bind(Fn, name),
    } as ResourceInstance<Extract<ResourceType, { Type: T }>>;
  }

  /**
   * The optional `Rules` section validates a parameter or a combination of
   * parameters passed to a template during a stack creation or stack update. To
   * use template rules, explicitly declare `Rules` in your template followed by
   * an assertion. Use the rules section to validate parameter values before
   * creating or updating resources.
   *
   * @see {@link https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/rules-section-structure.html}
   */
  public addRule(name: string, definition: RuleDefinition): void {
    this.#addSection("Rules", name, definition);
  }

  /**
   * Add a definition to the template.
   */
  #addSection<Section extends TemplateSection>(
    sectionName: Section,
    name: string,
    definition: TemplateSectionType<Section>,
  ): void {
    this.#set([sectionName, name], definition);
  }

  #set(keys: string[], value: unknown): void {
    const parents = keys.slice(0, -1);
    const leaf = keys.at(-1);

    assert(
      leaf && parents.length > 0,
      `keys should have at least two elements`,
    );

    let obj: any = this.#template;
    for (const key of parents) {
      if (key in obj) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        obj = obj[key];
      } else {
        const parent = {};
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        obj[key] = parent;
        obj = parent;
      }
    }

    if (leaf in obj) {
      throw new DuplicateTemplateEntityError(
        keys[0] as TemplateSection,
        keys.slice(1).join("."),
      );
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    obj[leaf] = value;
  }
}

/**
 * Returns the entity name for a template section, e.g. "condition" for
 * "Conditions" and "metadata" for "Metadata".
 */
function getTemplateEntityName(sectionName: TemplateSection): string {
  return (
    sectionName.endsWith("s") ? sectionName.slice(0, -1) : sectionName
  ).toLowerCase();
}
