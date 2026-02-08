import { US_PROVINCES } from "./us";
import { FR_PROVINCES } from "./fr";
import { GB_PROVINCES } from "./gb";
import { CA_PROVINCES } from "./ca";
import { JP_PROVINCES } from "./jp";
import { KR_PROVINCES } from "./kr";
import { IN_PROVINCES } from "./in";
import { ID_PROVINCES } from "./id";
import { MY_PROVINCES } from "./my";

export const PROVINCES_BY_COUNTRY = {
  US: US_PROVINCES,
  FR: FR_PROVINCES,
  GB: GB_PROVINCES,
  CA: CA_PROVINCES,
  JP: JP_PROVINCES,
  KR: KR_PROVINCES,
  IN: IN_PROVINCES,
  ID: ID_PROVINCES,
  MY: MY_PROVINCES,
} as const;

export type CountryCodeWithProvinces = keyof typeof PROVINCES_BY_COUNTRY;
