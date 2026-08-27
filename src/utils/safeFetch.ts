/**
 * fetch() that survives being loaded from a URL with embedded credentials
 * (https://user:pass@host/...). A relative request URL inherits the page's
 * credentials, and Chrome then refuses to construct the Request at all
 * ("Request cannot be constructed from a URL that includes credentials"),
 * which broke every config load behind basic-auth hosting. Resolving against
 * location.origin + pathname — which never carry credentials — keeps the
 * same path semantics and changes nothing on a normal URL. The browser still
 * attaches the basic-auth session it established when the page loaded.
 */
export function safeFetch(input: string, init?: RequestInit): Promise<Response> {
    let url = input;
    try {
        const resolved = new URL(input, `${window.location.origin}${window.location.pathname}`);
        resolved.username = '';
        resolved.password = '';
        url = resolved.href;
    } catch { /* leave as-is; fetch will surface the real error */ }
    return fetch(url, init);
}
