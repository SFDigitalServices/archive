import { AzureFunction, Context, HttpRequest } from "@azure/functions"
import { URL } from 'url'
import { ArchiveSnapshot, getArchived } from './archive'

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    const url = req.query.url || req.url
    let parsed: URL
    try {
        parsed = new URL(url)
    } catch (error) {
        context.res = {
            status: 500,
            body: `Unable to parse URL: "${url}"`
        }
        return
    }
    const host = parsed.host || req.headers.Host
    const path = parsed.pathname
    const archived: ArchiveSnapshot = await getArchived(url)
    if (archived) {
        console.log('archived:', archived)
        const redirectUrl = archived.url
        context.res = {
            status: 200,
            body: `Redirect to: ${redirectUrl}`,
            headers: {
                'X-Location': redirectUrl
            }
        };
    } else {
        context.res = {
            status: 404,
            body: `No such archived URL: "${url}"`
        }
    }


};

export default httpTrigger;