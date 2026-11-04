// Mirrors the engine's buildTagOf rule: read the content attribute from the
// meta element named build-tag, without depending on attribute order.
export function parseBuildTag(html) {
 for(const tag of String(html).matchAll(/<meta\b[^>]*>/gi)) {
  const attrs={};
  for(const match of tag[0].matchAll(/([^\s=/>]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g))attrs[match[1].toLowerCase()]=match[2]??match[3]??match[4];
  if(attrs.name?.toLowerCase()==='build-tag'&&attrs.content?.trim())return attrs.content.trim();
 }
 return null;
}
