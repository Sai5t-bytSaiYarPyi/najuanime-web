export async function onRequest(context) {
  const url = new URL(context.request.url);
  const parts = url.pathname.split('/').filter(Boolean);
  
  // /manhwa/:id → detail page
  if (parts.length === 2) {
    return context.env.ASSETS.fetch(
      new URL('/manhwa/detail/index.html', url)
    );
  }
  
  // /manhwa/:id/:ch → reader page
  if (parts.length === 3) {
    return context.env.ASSETS.fetch(
      new URL('/manhwa/detail/reader/index.html', url)
    );
  }
  
  return context.env.ASSETS.fetch(context.request);
}
