#!/usr/bin/env node
/**
 * This file generates resource types from the
 * `@propulsionworks/cfn-resource-schemas` package data.
 */

import {
  loadSchemas,
  loadSupplemental,
} from "@propulsionworks/cfn-resource-schemas";
import type { ResourceSupplemental } from "@propulsionworks/cfn-resource-schemas/types";
import assert from "node:assert";
import { mkdir } from "node:fs/promises";
import { join, resolve } from "node:path";
import ts from "typescript";
import { AwsDocumenter } from "../build-lib/aws-documenter.ts";
import { asciiCompare } from "../build-lib/case.ts";
import { CodeGenerator, printSourceFile } from "../build-lib/code-generator.ts";
import { ConsoleProblemReporter } from "../build-lib/problems.ts";
import {
  ResourceBuilder,
  type ResourceDocumenter,
} from "../build-lib/resource-builder.ts";
import { ResourceTypeSimplifier } from "../build-lib/resource-type-simplifier.ts";
import type { ImportedName, WellKnownType } from "../build-lib/type-nodes.ts";

export async function main(argv: string[]): Promise<number> {
  const outputPath = resolve(
    import.meta.dirname,
    "../exports/resources.generated",
  );
  await mkdir(outputPath, { recursive: true });

  const documenter = await loadDocumenter();
  const problems = new ConsoleProblemReporter();

  const wellKnownTypes: Record<WellKnownType, ImportedName> = {
    "iam-policy": {
      type: "import",
      moduleName: "../main.ts",
      name: "TemplatePolicyDocument",
      typeOnly: true,
    },
  };

  const resourceDefType: ImportedName = {
    type: "import",
    moduleName: "../main.ts",
    name: "ResourceDefinition",
    typeOnly: true,
  };

  const resourceDefWithAttribsType: ImportedName = {
    type: "import",
    moduleName: "../main.ts",
    name: "ResourceDefinitionWithAttributes",
    typeOnly: true,
  };

  const tagType: ImportedName = {
    type: "import",
    moduleName: "../main.ts",
    name: "Tag",
    typeOnly: true,
  };

  for await (const schema of loadSchemas()) {
    if (argv.length > 0 && !argv.includes(schema.typeName)) {
      continue;
    }
    const builder = new ResourceBuilder(schema, { documenter, problems });
    const resource = builder.build();

    const simplifier = new ResourceTypeSimplifier(resource, { tagType });
    const code = new CodeGenerator({ simplifier, wellKnownTypes });

    const mangledTypeName = schema.typeName.replaceAll(/^AWS|::|\./g, "");
    const resourceName = schema.typeName.split("::")[2];
    assert(resourceName);

    const propTypeName = `${mangledTypeName}Props`;
    const attribTypeName = `${mangledTypeName}Attribs`;

    const statements: ts.Statement[] = [];

    const resourceType = resource.attributes
      ? code.createTypeReference(resourceDefWithAttribsType, [
          ts.factory.createLiteralTypeNode(
            ts.factory.createStringLiteral(schema.typeName),
          ),
          ts.factory.createTypeReferenceNode(propTypeName),
          ts.factory.createTypeReferenceNode(attribTypeName),
        ])
      : code.createTypeReference(resourceDefType, [
          ts.factory.createLiteralTypeNode(
            ts.factory.createStringLiteral(schema.typeName),
          ),
          ts.factory.createTypeReferenceNode(propTypeName),
        ]);

    // output the full resource type
    statements.push(
      ts.factory.createTypeAliasDeclaration(
        [ts.factory.createToken(ts.SyntaxKind.ExportKeyword)],
        mangledTypeName,
        undefined,
        resourceType,
      ),
    );

    // output the properties type
    statements.push(
      code.generateTypeDefinition(propTypeName, resource.properties),
    );

    // output the attributes if we have any
    if (resource.attributes) {
      simplifier.mode = "attributes";

      statements.push(
        code.generateTypeDefinition(attribTypeName, resource.attributes),
      );
      simplifier.mode = "resource";
    }

    const definitions: [string, ts.Statement][] = [];
    let thisPass: number;

    // only generate the types that get referenced
    do {
      thisPass = 0;

      for (const [name, def] of Object.entries(resource.definitions)) {
        const alreadyGenerated = definitions.some(
          ([existing]) => existing === name,
        );
        if (code.referencedNames.has(name) && !alreadyGenerated) {
          definitions.push([name, code.generateTypeDefinition(name, def)]);
          ++thisPass;
        }
      }
    } while (thisPass > 0);

    definitions.sort(([a], [b]) => asciiCompare(a, b));
    statements.push(...definitions.map(([, def]) => def));

    // now output the imports
    const imports = [...code.referencedNames].filter(
      (x) => typeof x !== "string" && x.type === "import",
    );
    // imports go at the top
    statements.unshift(...code.generateImportDeclarations(imports));
    await printSourceFile(join(outputPath, schema.$id + ".ts"), statements);
  }

  return 0;
}

async function loadDocumenter(): Promise<ResourceDocumenter> {
  const data: ResourceSupplemental[] = [];

  for await (const resource of loadSupplemental()) {
    data.push(resource);
  }
  return new AwsDocumenter(data);
}

if (process.argv[1] === import.meta.filename) {
  process.exitCode = await main(process.argv.slice(2));
}
