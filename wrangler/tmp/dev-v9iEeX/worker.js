var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// src/lib/inquiry.ts
var INQUIRY_LIMITS = {
  fullName: 120,
  email: 254,
  projectType: 80,
  shortDescription: 1500,
  company: 120,
  audience: 500,
  currentUrl: 500,
  problem: 1500,
  launchTimeframe: 120,
  budget: 120,
  additionalDetails: 3e3,
  website: 120
};
var INQUIRY_PROJECT_TYPES = [
  "Business website",
  "E-commerce website",
  "Landing page",
  "Website redesign",
  "Web application",
  "Website maintenance",
  "Other"
];
var EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
var isRecord = /* @__PURE__ */ __name((value) => typeof value === "object" && value !== null && !Array.isArray(value), "isRecord");
function validateInquiryPayload(input) {
  if (!isRecord(input)) {
    return { ok: false, error: "Inquiry data must be a JSON object." };
  }
  const fields = Object.keys(INQUIRY_LIMITS);
  const data = {};
  for (const field of fields) {
    const value = input[field];
    if (value === void 0) {
      data[field] = "";
      continue;
    }
    if (typeof value !== "string") {
      return { ok: false, field, error: `${field} must be a string.` };
    }
    const trimmed = value.trim();
    if (trimmed.length > INQUIRY_LIMITS[field]) {
      return {
        ok: false,
        field,
        error: `${field} is too long (maximum ${INQUIRY_LIMITS[field]} characters).`
      };
    }
    data[field] = trimmed;
  }
  const required = [
    "fullName",
    "email",
    "projectType",
    "shortDescription"
  ];
  for (const field of required) {
    if (!data[field]) {
      return { ok: false, field, error: `${field} is required.` };
    }
  }
  if (!EMAIL_PATTERN.test(data.email)) {
    return { ok: false, field: "email", error: "Please provide a valid email address." };
  }
  if (!INQUIRY_PROJECT_TYPES.includes(data.projectType)) {
    return { ok: false, field: "projectType", error: "Please choose a valid project type." };
  }
  if (data.currentUrl) {
    try {
      const url = new URL(data.currentUrl);
      if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error("unsupported protocol");
    } catch {
      return { ok: false, field: "currentUrl", error: "Please provide a valid http(s) URL." };
    }
  }
  return { ok: true, data };
}
__name(validateInquiryPayload, "validateInquiryPayload");

// src/worker.ts
var INQUIRY_PATH = "/api/inquiry";
var DEFAULT_INQUIRY_TO_EMAIL = "persianbearstudio@gmail.com";
var MAX_INQUIRY_BODY_BYTES = 16384;
var SECURITY_HEADERS = {
  "Content-Security-Policy": [
    "default-src 'none'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "font-src 'self'",
    "connect-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'"
  ].join("; "),
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-Frame-Options": "DENY",
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Embedder-Policy": "same-origin",
  "Cross-Origin-Resource-Policy": "same-origin",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  "X-Permitted-Cross-Domain-Policies": "none",
  "Upgrade-Insecure-Requests": "1"
};
function jsonResponse(body, status) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });
}
__name(jsonResponse, "jsonResponse");
function escapeHtml(value) {
  return value.replace(/[&<>'"]/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "'": "&#39;",
      '"': "&quot;"
    };
    return entities[character];
  });
}
__name(escapeHtml, "escapeHtml");
function inquiryText(data) {
  return [
    `Name: ${data.fullName}`,
    `Email: ${data.email}`,
    `Project type: ${data.projectType}`,
    `Company: ${data.company || "Not provided"}`,
    `Audience: ${data.audience || "Not provided"}`,
    `Current URL: ${data.currentUrl || "Not provided"}`,
    `Launch timeframe: ${data.launchTimeframe || "Not provided"}`,
    `Budget: ${data.budget || "Not provided"}`,
    "",
    "Short description:",
    data.shortDescription,
    "",
    "Problem to solve:",
    data.problem || "Not provided",
    "",
    "Additional details:",
    data.additionalDetails || "Not provided"
  ].join("\n");
}
__name(inquiryText, "inquiryText");
function inquiryHtml(data) {
  const rows = [
    ["Name", data.fullName],
    ["Email", data.email],
    ["Project type", data.projectType],
    ["Company", data.company || "Not provided"],
    ["Audience", data.audience || "Not provided"],
    ["Current URL", data.currentUrl || "Not provided"],
    ["Launch timeframe", data.launchTimeframe || "Not provided"],
    ["Budget", data.budget || "Not provided"],
    ["Short description", data.shortDescription],
    ["Problem to solve", data.problem || "Not provided"],
    ["Additional details", data.additionalDetails || "Not provided"]
  ];
  return `<h1>New project inquiry</h1><dl>${rows.map(([label, value]) => `<dt><strong>${escapeHtml(label)}</strong></dt><dd>${escapeHtml(value).replace(/\n/g, "<br>")}</dd>`).join("")}</dl>`;
}
__name(inquiryHtml, "inquiryHtml");
async function handleInquiry(request, env, url) {
  if (request.method !== "POST") {
    return jsonResponse({ ok: false, error: "Method not allowed." }, 405);
  }
  const origin = request.headers.get("Origin");
  if (origin && origin !== url.origin) {
    return jsonResponse({ ok: false, error: "Origin not allowed." }, 403);
  }
  const contentType = request.headers.get("Content-Type")?.toLowerCase() ?? "";
  if (!contentType.startsWith("application/json")) {
    return jsonResponse({ ok: false, error: "Content-Type must be application/json." }, 415);
  }
  const contentLength = Number(request.headers.get("Content-Length") ?? "0");
  if (contentLength > MAX_INQUIRY_BODY_BYTES) {
    return jsonResponse({ ok: false, error: "Inquiry payload is too large." }, 413);
  }
  let rawBody;
  try {
    rawBody = await request.text();
  } catch {
    return jsonResponse({ ok: false, error: "Could not read inquiry payload." }, 400);
  }
  if (new TextEncoder().encode(rawBody).byteLength > MAX_INQUIRY_BODY_BYTES) {
    return jsonResponse({ ok: false, error: "Inquiry payload is too large." }, 413);
  }
  let parsed;
  try {
    parsed = JSON.parse(rawBody);
  } catch {
    return jsonResponse({ ok: false, error: "Inquiry payload must be valid JSON." }, 400);
  }
  const validation = validateInquiryPayload(parsed);
  if (!validation.ok || !validation.data) {
    return jsonResponse({ ok: false, error: validation.error ?? "Please check the inquiry fields." }, 400);
  }
  if (validation.data.website) {
    return jsonResponse({ ok: false, error: "Please check the inquiry fields." }, 400);
  }
  const fallbackEmail = env.INQUIRY_TO_EMAIL?.trim() || DEFAULT_INQUIRY_TO_EMAIL;
  if (!env.RESEND_API_KEY?.trim() || !env.RESEND_FROM_EMAIL?.trim()) {
    return jsonResponse(
      {
        ok: false,
        error: `Inquiry delivery is not configured. Please email ${fallbackEmail} directly.`,
        fallbackEmail
      },
      503
    );
  }
  try {
    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: env.RESEND_FROM_EMAIL,
        to: [fallbackEmail],
        reply_to: validation.data.email,
        subject: `New project inquiry from ${validation.data.fullName}`,
        text: inquiryText(validation.data),
        html: inquiryHtml(validation.data)
      })
    });
    if (!resendResponse.ok) {
      return jsonResponse(
        {
          ok: false,
          error: `We could not send your inquiry right now. Please email ${fallbackEmail} directly.`,
          fallbackEmail
        },
        502
      );
    }
  } catch {
    return jsonResponse(
      {
        ok: false,
        error: `We could not send your inquiry right now. Please email ${fallbackEmail} directly.`,
        fallbackEmail
      },
      502
    );
  }
  return jsonResponse({ ok: true }, 200);
}
__name(handleInquiry, "handleInquiry");
function applySecurityHeaders(response) {
  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) headers.set(key, value);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}
__name(applySecurityHeaders, "applySecurityHeaders");
var worker_default = {
  async fetch(request, env) {
    const url = new URL(request.url);
    const response = url.pathname === INQUIRY_PATH ? await handleInquiry(request, env, url) : await env.ASSETS.fetch(request);
    return applySecurityHeaders(response);
  }
};

// node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    const body = JSON.stringify(error);
    const headers = {
      "Content-Type": "application/json",
      "MF-Experimental-Error-Stack": "true"
    };
    const encoded = encodeURIComponent(body);
    if (encoded.length <= 8192) {
      headers["MF-Experimental-Error-Stack-Payload"] = encoded;
    }
    return new Response(body, { status: 500, headers });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-Xf436E/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = worker_default;

// node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-Xf436E/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  scheduledTime;
  cron;
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=worker.js.map
