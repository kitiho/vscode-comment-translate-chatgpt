import fetch, { Headers, Request, Response } from 'node-fetch';


if (!('fetch' in globalThis)) {
  globalThis.fetch = fetch;
  globalThis.Headers = Headers;
  globalThis.Request = Request;
  globalThis.Response = Response;
}
