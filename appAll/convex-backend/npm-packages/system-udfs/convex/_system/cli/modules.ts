import { ValidatorJSON } from "../../../../convex/dist/internal-cjs-types/values";
import { UdfType, Visibility } from "../frontend/common";
import { queryPrivateSystem } from "../secretSystemTables";
import { v } from "convex/values";

type FunctionSpec = {
  identifier: string;
  functionType: UdfType;
  visibility: Visibility;
  args?: ValidatorJSON;
  returns?: ValidatorJSON;
};

type HttpFunctionSpec = {
  functionType: "HttpAction";
  method: string;
  path: string;
};

type FunctionSpecs = (FunctionSpec | HttpFunctionSpec)[];

export const DEFAULT_ARGS_VALIDATOR = '{ "type": "any" }';
export const DEFAULT_RETURN_VALIDATOR = '{ "type": "any" }';

export const apiSpec = queryPrivateSystem({
  args: {
    componentId: v.optional(v.union(v.string(), v.null())),
  },
  handler: async ({ db }): Promise<FunctionSpecs> => {
    const result: FunctionSpecs = [];
    for await (const module of db.query("_modules")) {
      const analyzeResult = module.analyzeResult;
      if (!analyzeResult) {
        // `Skipping ${module.path}`
        continue;
      }

      for (const fn of analyzeResult.functions || []) {
        result.push({
          identifier: module.path + ":" + fn.name,
          functionType: fn.udfType,
          visibility: fn.visibility ?? { kind: "public" },
          args: JSON.parse(fn.args ?? DEFAULT_ARGS_VALIDATOR),
          returns:
            JSON.parse(fn.returns ?? DEFAULT_RETURN_VALIDATOR) ??
            JSON.parse(DEFAULT_RETURN_VALIDATOR),
        });
      }

      for (const httpFn of analyzeResult.httpRoutes || []) {
        result.push({
          functionType: "HttpAction",
          method: httpFn.route.method,
          path: httpFn.route.path,
        });
      }
    }

    return result;
  },
});
