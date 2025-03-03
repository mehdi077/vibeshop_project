/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as action from "../action.js";
import type * as adversarial from "../adversarial.js";
import type * as adversarialWasm from "../adversarialWasm.js";
import type * as analyze from "../analyze.js";
import type * as args_validation from "../args_validation.js";
import type * as asyncTests from "../asyncTests.js";
import type * as auth from "../auth.js";
import type * as basic from "../basic.js";
import type * as benches from "../benches.js";
import type * as creationTime from "../creationTime.js";
import type * as crons from "../crons.js";
import type * as crons_error from "../crons_error.js";
import type * as custom_errors from "../custom_errors.js";
import type * as directory_defaultTest from "../directory/defaultTest.js";
import type * as directory_udfs from "../directory/udfs.js";
import type * as environmentVariables from "../environmentVariables.js";
import type * as fetch from "../fetch.js";
import type * as globals from "../globals.js";
import type * as helpers from "../helpers.js";
import type * as http from "../http.js";
import type * as http_action from "../http_action.js";
import type * as http_all_imported_handlers from "../http_all_imported_handlers.js";
import type * as http_no_default from "../http_no_default.js";
import type * as http_no_imports from "../http_no_imports.js";
import type * as http_object_default from "../http_object_default.js";
import type * as http_undefined_default from "../http_undefined_default.js";
import type * as idEncoding from "../idEncoding.js";
import type * as idStrings from "../idStrings.js";
import type * as import_tests from "../import_tests.js";
import type * as indexing from "../indexing.js";
import type * as internal_ from "../internal.js";
import type * as js from "../js.js";
import type * as js_builtins_abort_controller from "../js_builtins/abort_controller.js";
import type * as js_builtins_blob from "../js_builtins/blob.js";
import type * as js_builtins_crypto from "../js_builtins/crypto.js";
import type * as js_builtins_event from "../js_builtins/event.js";
import type * as js_builtins_event_target from "../js_builtins/event_target.js";
import type * as js_builtins_file from "../js_builtins/file.js";
import type * as js_builtins_headers from "../js_builtins/headers.js";
import type * as js_builtins_request from "../js_builtins/request.js";
import type * as js_builtins_response from "../js_builtins/response.js";
import type * as js_builtins_setTimeout from "../js_builtins/setTimeout.js";
import type * as js_builtins_stream from "../js_builtins/stream.js";
import type * as js_builtins_structuredClone from "../js_builtins/structuredClone.js";
import type * as js_builtins_testHelpers from "../js_builtins/testHelpers.js";
import type * as js_builtins_textEncoder from "../js_builtins/textEncoder.js";
import type * as js_builtins_url from "../js_builtins/url.js";
import type * as js_builtins_urlSearchParams from "../js_builtins/urlSearchParams.js";
import type * as load_failure from "../load_failure.js";
import type * as logging from "../logging.js";
import type * as name from "../name.js";
import type * as node_actions from "../node_actions.js";
import type * as query from "../query.js";
import type * as returns_validation from "../returns_validation.js";
import type * as scheduler from "../scheduler.js";
import type * as search from "../search.js";
import type * as shapes from "../shapes.js";
import type * as size_errors from "../size_errors.js";
import type * as sourceMaps from "../sourceMaps.js";
import type * as storage from "../storage.js";
import type * as sync from "../sync.js";
import type * as unicode from "../unicode.js";
import type * as userError from "../userError.js";
import type * as values from "../values.js";
import type * as vector_search from "../vector_search.js";
import type * as wasmTests from "../wasmTests.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  action: typeof action;
  adversarial: typeof adversarial;
  adversarialWasm: typeof adversarialWasm;
  analyze: typeof analyze;
  args_validation: typeof args_validation;
  asyncTests: typeof asyncTests;
  auth: typeof auth;
  basic: typeof basic;
  benches: typeof benches;
  creationTime: typeof creationTime;
  crons: typeof crons;
  crons_error: typeof crons_error;
  custom_errors: typeof custom_errors;
  "directory/defaultTest": typeof directory_defaultTest;
  "directory/udfs": typeof directory_udfs;
  environmentVariables: typeof environmentVariables;
  fetch: typeof fetch;
  globals: typeof globals;
  helpers: typeof helpers;
  http: typeof http;
  http_action: typeof http_action;
  http_all_imported_handlers: typeof http_all_imported_handlers;
  http_no_default: typeof http_no_default;
  http_no_imports: typeof http_no_imports;
  http_object_default: typeof http_object_default;
  http_undefined_default: typeof http_undefined_default;
  idEncoding: typeof idEncoding;
  idStrings: typeof idStrings;
  import_tests: typeof import_tests;
  indexing: typeof indexing;
  internal: typeof internal_;
  js: typeof js;
  "js_builtins/abort_controller": typeof js_builtins_abort_controller;
  "js_builtins/blob": typeof js_builtins_blob;
  "js_builtins/crypto": typeof js_builtins_crypto;
  "js_builtins/event": typeof js_builtins_event;
  "js_builtins/event_target": typeof js_builtins_event_target;
  "js_builtins/file": typeof js_builtins_file;
  "js_builtins/headers": typeof js_builtins_headers;
  "js_builtins/request": typeof js_builtins_request;
  "js_builtins/response": typeof js_builtins_response;
  "js_builtins/setTimeout": typeof js_builtins_setTimeout;
  "js_builtins/stream": typeof js_builtins_stream;
  "js_builtins/structuredClone": typeof js_builtins_structuredClone;
  "js_builtins/testHelpers": typeof js_builtins_testHelpers;
  "js_builtins/textEncoder": typeof js_builtins_textEncoder;
  "js_builtins/url": typeof js_builtins_url;
  "js_builtins/urlSearchParams": typeof js_builtins_urlSearchParams;
  load_failure: typeof load_failure;
  logging: typeof logging;
  name: typeof name;
  node_actions: typeof node_actions;
  query: typeof query;
  returns_validation: typeof returns_validation;
  scheduler: typeof scheduler;
  search: typeof search;
  shapes: typeof shapes;
  size_errors: typeof size_errors;
  sourceMaps: typeof sourceMaps;
  storage: typeof storage;
  sync: typeof sync;
  unicode: typeof unicode;
  userError: typeof userError;
  values: typeof values;
  vector_search: typeof vector_search;
  wasmTests: typeof wasmTests;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
