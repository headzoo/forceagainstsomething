const MAX_HTML_BYTES = 1_000_000;
const MAX_REDIRECTS = 3;

export type ActionMetadata = {
  href: string;
  suggestedTitle: string;
  suggestedDetail: string;
  effort: string;
};

function decodeEntities(value: string) {
  const entities: Record<string, string> = {
    amp: '&', apos: "'", gt: '>', lt: '<', nbsp: ' ', quot: '"',
  };

  return value.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (match, entity: string) => {
    if (entity[0] === '#') {
      const isHex = entity[1]?.toLowerCase() === 'x';
      const codePoint = Number.parseInt(entity.slice(isHex ? 2 : 1), isHex ? 16 : 10);
      return Number.isFinite(codePoint) ? String.fromCodePoint(codePoint) : match;
    }

    return entities[entity.toLowerCase()] ?? match;
  });
}

function cleanText(value: string, maxLength: number) {
  return decodeEntities(value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()).slice(0, maxLength);
}

function firstTag(html: string, tag: 'h1' | 'h2' | 'title') {
  const match = html.match(new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
  return match ? cleanText(match[1], 180) : '';
}

function metaContent(html: string, names: string[]) {
  const tags = html.match(/<meta\b[^>]*>/gi) ?? [];

  for (const tag of tags) {
    const nameMatch = tag.match(/(?:name|property)\s*=\s*["']([^"']+)["']/i);
    if (!nameMatch || !names.includes(nameMatch[1].toLowerCase())) continue;
    const contentMatch = tag.match(/content\s*=\s*["']([^"']*)["']/i);
    if (contentMatch) return cleanText(contentMatch[1], 320);
  }

  return '';
}

function isPrivateIpv4(hostname: string) {
  if (!/^\d{1,3}(?:\.\d{1,3}){3}$/.test(hostname)) return false;
  const parts = hostname.split('.').map(Number);
  if (parts.some((part) => part > 255)) return true;

  return parts[0] === 0
    || parts[0] === 10
    || parts[0] === 127
    || (parts[0] === 169 && parts[1] === 254)
    || (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31)
    || (parts[0] === 192 && parts[1] === 168)
    || parts[0] >= 224;
}

export function parsePublicHttpUrl(value: string) {
  let url: URL;

  try {
    url = new URL(value);
  } catch {
    throw new Error('Enter a complete http:// or https:// link.');
  }

  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) {
    throw new Error('Only public http:// or https:// links are supported.');
  }

  if ((url.protocol === 'http:' && url.port && url.port !== '80')
    || (url.protocol === 'https:' && url.port && url.port !== '443')) {
    throw new Error('Links using custom ports are not supported.');
  }

  const hostname = url.hostname.toLowerCase().replace(/^\[|\]$/g, '');
  const blockedName = hostname === 'localhost'
    || hostname.endsWith('.localhost')
    || hostname.endsWith('.local')
    || hostname.endsWith('.internal');
  const blockedIpv6 = hostname.includes(':')
    && (hostname === '::' || hostname === '::1' || hostname.startsWith('fc') || hostname.startsWith('fd') || hostname.startsWith('fe8') || hostname.startsWith('fe9') || hostname.startsWith('fea') || hostname.startsWith('feb'));

  if (blockedName || isPrivateIpv4(hostname) || blockedIpv6) {
    throw new Error('That link does not point to a public website.');
  }

  url.hash = '';
  return url;
}

async function readLimitedHtml(response: Response) {
  if (!response.body) return '';
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX_HTML_BYTES) {
      await reader.cancel();
      throw new Error('That page is too large to analyze.');
    }
    chunks.push(value);
  }

  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(bytes);
}

function inferEffort(html: string) {
  const text = cleanText(
    html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' '),
    MAX_HTML_BYTES,
  ).toLowerCase();
  const inputCount = (html.match(/<input\b/gi) ?? []).length + (html.match(/<textarea\b/gi) ?? []).length;

  if (/lawsuit|litigation|court case|legal challenge|case docket/.test(text)) return 'Follow case';
  if (/volunteer|join (?:our|the) (?:team|campaign)|organizer training|canvass/.test(text)) return 'Volunteer';
  if (/donate|contribution|make a gift/.test(text)) return 'Donate';
  if (/share (?:this|with|the)|spread the word/.test(text)) return 'Share';
  if (/call (?:your|congress|senator|representative|lawmakers)/.test(text)) return '5 min';
  if (/sign (?:the|this|our) petition|add your name|take the pledge/.test(text)) return inputCount > 8 ? '3 min' : '2 min';
  if (/email (?:your|congress)|write (?:to )?(?:your|congress)|contact (?:your|a) representative/.test(text)) return '5 min';
  return inputCount > 8 ? '5 min' : '2 min';
}

export function slugifyTitle(title: string) {
  const slug = title
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
    .replace(/-+$/g, '');

  return slug || 'action';
}

export async function analyzeActionHref(input: string): Promise<ActionMetadata> {
  let url = parsePublicHttpUrl(input);
  let response: Response | undefined;

  for (let redirects = 0; redirects <= MAX_REDIRECTS; redirects += 1) {
    response = await fetch(url, {
      headers: { 'User-Agent': 'ForceAgainstSomethingBot/1.0 (+https://forceagainstsomething.com)' },
      redirect: 'manual',
      signal: AbortSignal.timeout(10_000),
    });

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');
      if (!location || redirects === MAX_REDIRECTS) throw new Error('That page redirects too many times.');
      url = parsePublicHttpUrl(new URL(location, url).toString());
      continue;
    }
    break;
  }

  if (!response?.ok) throw new Error(`The page returned HTTP ${response?.status ?? 'an error'}.`);
  const contentType = response.headers.get('content-type')?.toLowerCase() ?? '';
  if (contentType && !contentType.includes('text/html') && !contentType.includes('application/xhtml+xml')) {
    throw new Error('That link is not an HTML page.');
  }

  const html = await readLimitedHtml(response);
  const suggestedTitle = firstTag(html, 'h1')
    || firstTag(html, 'h2')
    || metaContent(html, ['og:title', 'twitter:title'])
    || firstTag(html, 'title');

  if (!suggestedTitle) throw new Error('We could not find a page heading. You can try another link.');

  return {
    href: url.toString(),
    suggestedTitle,
    suggestedDetail: metaContent(html, ['description', 'og:description', 'twitter:description']),
    effort: inferEffort(html),
  };
}
