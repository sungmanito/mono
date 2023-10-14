import type { ParamMatcher } from "@sveltejs/kit";
import { isValid } from 'ulidx';
export const match: ParamMatcher = param => isValid(param);
