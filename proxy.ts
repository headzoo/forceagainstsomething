import { type NextRequest, NextResponse } from 'next/server';

function rewrite(request: NextRequest, pathname: string) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  return NextResponse.rewrite(url);
}

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  let match = pathname.match(/^\/action\/([^/]+)\/([^/]+)\.json$/);
  if (match) return rewrite(request, `/api/public/action/${match[1]}/${match[2]}`);

  match = pathname.match(/^\/issue\/([^/]+)\.json$/);
  if (match) return rewrite(request, `/api/public/issue/${match[1]}`);

  match = pathname.match(/^\/org\/([^/]+)\.json$/);
  if (match) return rewrite(request, `/api/public/org/${match[1]}`);

  return NextResponse.next();
}

export const config = {
  matcher: ['/action/:path*', '/issue/:path*', '/org/:path*'],
};
