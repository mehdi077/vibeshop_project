import {
  CronSpec,
  Module,
  ResolvedSourcePos,
  UdfType,
  Visibility,
} from "./common";
import { queryPrivateSystem } from "../secretSystemTables";
import { v } from "convex/values";
import { DEFAULT_ARGS_VALIDATOR } from "../cli/modules";
import { currentSystemUdfInComponent } from "convex/server";
import { DatabaseReader } from "../../_generated/server";

export const listForAllComponents = queryPrivateSystem({
  args: {},
  handler: async (ctx): Promise<[string | null, [string, Module][]][]> => {
    // NOTE this UDF calls itself recursively in each component with
    // `currentSystemUdfInComponent` below.
    const modulesInCurrentComponent = await listHandler(ctx.db);
    const result: [string | null, [string, Module][]][] = [
      [null, modulesInCurrentComponent],
    ];
    // When this UDF is running in a non-root component, the _components table
    // is empty, so that's the base case of the recursion.
    const componentDocs = await ctx.db.query("_components").collect();
    for (const doc of componentDocs) {
      if (!doc.parent) {
        // Root component, which is the current component.
        continue;
      }
      const ref = currentSystemUdfInComponent(doc._id);
      for (const [_, modulesInChildComponent] of await ctx.runQuery(
        ref as any,
      )) {
        result.push([doc._id, modulesInChildComponent]);
      }
    }
    return result;
  },
});

/**
 * Return all user defined modules + their functions.
 *
 * Note that this does not include system modules because they are not stored
 * in the `_modules` table.
 */
export const list = queryPrivateSystem({
  args: {
    componentId: v.optional(v.union(v.string(), v.null())),
  },
  handler: async ({ db }): Promise<[string, Module][]> => {
    return await listHandler(db);
  },
});

async function listHandler(db: DatabaseReader): Promise<[string, Module][]> {
  const result: [string, Module][] = [];
  for await (const module of db.query("_modules")) {
    const analyzeResult = module.analyzeResult;
    if (!analyzeResult) {
      // `Skipping ${module.path}`
      continue;
    }

    const functions = analyzeResult.functions.map(processFunction) ?? [];
    // Stuff HTTP routes into the functions (the format the dashboard expects).
    for (const route of analyzeResult.httpRoutes || []) {
      functions.push(processHttpRoute(route));
    }

    const cronSpecs = processCronSpecs(analyzeResult.cronSpecs);

    result.push([
      module.path,
      {
        functions,
        sourcePackageId: module.sourcePackageId,
        ...(cronSpecs !== null ? { cronSpecs } : {}),
      },
    ]);
  }
  return result;
}

function processCronSpecs(
  cronSpecs: null | undefined | Array<{ identifier: string; spec: CronSpec }>,
): Array<[string, CronSpec]> | null {
  if (cronSpecs === null || cronSpecs === undefined) {
    return null;
  }
  return cronSpecs.map((c) => [c.identifier, c.spec]);
}

function processHttpRoute(f: {
  route: {
    path: string;
    method: string;
  };
  pos?: ResolvedSourcePos;
  lineno?: bigint;
  args?: string;
}) {
  const lineno = f.pos?.start_lineno ?? f.lineno;
  return {
    name: `${f.route.method} ${f.route.path}`,
    lineno: lineno ? Number(lineno) : undefined,
    udfType: "HttpAction",
    visibility: { kind: "public" },
    argsValidator: f.args || DEFAULT_ARGS_VALIDATOR,
  } as const;
}

function processFunction(f: {
  name: string;
  pos?: ResolvedSourcePos;
  lineno?: bigint;
  udfType: UdfType;
  visibility?: Visibility | null;
  args?: string;
}) {
  const lineno = f.pos?.start_lineno ?? f.lineno;
  return {
    ...f,
    lineno: lineno ? Number(lineno) : undefined,
    visibility: f.visibility ?? { kind: "public" },
    argsValidator: f.args || DEFAULT_ARGS_VALIDATOR,
  };
}
