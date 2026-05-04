/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as calendarNotes from "../calendarNotes.js";
import type * as categories_template from "../categories_template.js";
import type * as documents from "../documents.js";
import type * as subscription from "../subscription.js";
import type * as templates from "../templates.js";
import type * as userPlan from "../userPlan.js";
import type * as userSettings from "../userSettings.js";
import type * as userUsage from "../userUsage.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  calendarNotes: typeof calendarNotes;
  categories_template: typeof categories_template;
  documents: typeof documents;
  subscription: typeof subscription;
  templates: typeof templates;
  userPlan: typeof userPlan;
  userSettings: typeof userSettings;
  userUsage: typeof userUsage;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
