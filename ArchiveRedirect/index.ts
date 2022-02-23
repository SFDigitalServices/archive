import { AzureFunction, Context, HttpRequest } from "@azure/functions"
import { URL } from 'url'
import { ArchiveSnapshot, getArchived } from './archive'
const matchUrl = require('match-url-wildcard')

const DEFAULT_PROTOCOL = 'https'
const ALLOWED_URLS: string[] = [
    'sfgov.org',
    'sftreasureisland.org'
]

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    let url = getRequestUrl(req)
    if (!url?.includes('.')) {
        console.error('invalid URL:', url)
        context.res = {
            status: 404,
            body: `No domain included in URL: "${url || ''}"`
        }
        return
    } else if (!url.includes('://')) {
        url = `${DEFAULT_PROTOCOL}://${url}`
    }

    let parsed: URL
    try {
        parsed = new URL(url)
    } catch (error) {
        console.error('unable to parse:', url, error.message)
        context.res = {
            status: 500,
            body: `Unable to parse URL: "${url}"`
        }
        return
    }

    const match: string = ALLOWED_URLS.find(pattern => matchUrl(url, pattern))
    if (!match) {
        console.log('unmatched URL: "%s"', url)
        context.res = {
            status: 404,
            body: `Unallowed URL: "${url}"`
        }
        return
    } else {
        console.log('matched pattern: "%s" to url: "%s"', match, url)
    }

    const archived: ArchiveSnapshot = await getArchived(url)
    if (archived) {
        console.log('archived:', archived)
        const redirectUrl = archived.url
        context.res = {
            status: 301,
            body: `Redirect: "${redirectUrl}"`,
            headers: {
                Location: redirectUrl
            }
        };
    } else {
        context.res = {
            status: 404,
            body: `No such archived URL: "${url}"`
        }
    }
}

export default httpTrigger

function getRequestUrl (req: HttpRequest) {
    return req.params.url || req.query.url || getRawQueryString(req.url) || req.url
}

function getRawQueryString (url: string): string {
    return url.includes('?') ? url.substring(url.indexOf('?') + 1) : undefined
}
