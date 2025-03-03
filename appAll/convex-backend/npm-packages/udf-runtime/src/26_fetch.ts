import {
  convexV8ObjectFromRequest,
  Request,
  RequestInit,
} from "./23_request.js";
import {
  responseFromConvexObject,
  Response,
  _redirected,
} from "./23_response.js";
import { performAsyncOp } from "./syscall.js";

// See https://developer.mozilla.org/en-US/docs/Web/API/fetch
// https://fetch.spec.whatwg.org/
export const fetch = async function (
  resource: string | URL | Request,
  options?: RequestInit,
): Promise<Response> {
  let request = new Request(resource, options);
  let response = await fetchWithoutRedirect(request);
  const redirectMode = options?.redirect ?? "follow";
  if (redirectMode === "manual") {
    // Redirect disabled.
    return response;
  }
  let redirects = 0;
  while (redirects < 20) {
    if (![301, 302, 303, 307, 308].includes(response.status)) {
      // No redirect.
      return response;
    }
    if (redirectMode === "error") {
      throw new TypeError("fetch attempted redirect");
    }
    const location = response.headers.get("Location");
    if (location === null) {
      return response;
    }
    redirects += 1;
    options = options ?? {};
    const url = new URL(location, request.url);
    const headers = request.headers;
    if (options.body instanceof ReadableStream) {
      // Cannot send body stream to redirect because it is already consumed.
      if (response.status === 303) {
        options.body = null;
      } else {
        throw new TypeError("fetch cannot redirect with streamed body");
      }
    }
    if (
      ((response.status === 301 || response.status === 302) &&
        request.method === "POST") ||
      (response.status === 303 && !["GET", "HEAD"].includes(request.method))
    ) {
      options.method = "GET";
      options.body = null;
      for (const requestBodyHeaderName of REQUEST_BODY_HEADERS) {
        headers.delete(requestBodyHeaderName);
      }
    }
    if (!sameOrigin(new URL(request.url), url)) {
      headers.delete("Authorization");
    }
    const referrerPolicy = response.headers.get("Referrer-Policy");
    if (referrerPolicy && referrerPolicy.length > 0) {
      headers.set("Referrer-Policy", referrerPolicy);
    }
    options.headers = headers;
    request = new Request(url, options);
    response = await fetchWithoutRedirect(request);
    response[_redirected] = true;
  }
  // Too many redirects.
  throw new TypeError("fetch too many redirects");
};

export const fetchWithoutRedirect = async function (
  request: Request,
): Promise<Response> {
  const requestObject = await convexV8ObjectFromRequest(request);
  const responseObject = await performAsyncOp("fetch", requestObject);
  return responseFromConvexObject(responseObject);
};

const REQUEST_BODY_HEADERS = [
  "Content-Encoding",
  "Content-Language",
  "Content-Location",
  "Content-Type",
];

const sameOrigin = (url: URL, otherURL: URL) => {
  return url.origin === otherURL.origin && url.port === otherURL.port;
};

export const setupFetch = (global: any) => {
  global.fetch = fetch;
};
