import { saveMappingHandler } from "@/modules/autofill/api/saveMapping";

export default function handler(req, res) {
  return saveMappingHandler(req, res);
}
