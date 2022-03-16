# sftreasureisland.org

This was a Drupal 7 site running on Pantheon. We're archiving it to this [public collection][collection].

We manage the collection on [Archive-It](https://partner.archive-it.org/571/collections/18901).

## Process

1. Create a new Archive-It collection and named it "Treasure Island Development Authority"
2. Add seed URLs from [this spreadsheet][url sheet]
3. Run a preliminary crawl:

    Check all of the seeds

      <img width="215" alt="image" src="https://user-images.githubusercontent.com/113896/158273499-0494aaed-a057-4f18-b2de-46a49424b138.png">

    Then click the <kbd>Run Crawl</kbd> button:

      <img width="342" alt="image" src="https://user-images.githubusercontent.com/113896/158273578-0de562bd-3e27-4612-81ba-4960748b1189.png">

    Select "One-Time Crawl", `2` GB, and leave the default time limit at "1 Day"; Crawling technology: "Standard".
    
    Click the <kbd>Crawl</kbd> button to start the crawl.

4. Either as the crawl runs or after it's completed, review the results of the crawl:

    🚧 TKTKTK 🚧
    
5. Adjust seed and collection settings as necessary and re-crawl all or a selection of seeds to capture additional documents.

    I modified the collection scope with the following rules:

    - Block `browsealoud.com` (and `www.browsealoud.com`) to avoid crawling their site
    - Block `sf.gov` to avoid following redirects to the new site
    - Accept (crawl) all URLs containing `sftreasureisland.org` to expand beyond the seed URLs

6. Run targeted crawls for some URLs...

    - In one case, I noticed that one crawl produced a bunch of requests for URIs ending in `node/___/<something-else>`, which all just resolve in Drupal to the node URL.
      To test a workaround for these, I ran one crawl on two specific node URLs seed scope rules that block URLs matching the regular expression `node/368/.+` and `node/351/.+`.
      The crawl produced nearly 3GB of data, [mostly in PDFs](https://partner.archive-it.org/571/collections/18901/crawl/1570719/types/application%7Cpdf).

7. Temporarily disable sf.gov redirects

      In order to work around issues with dead-end archive URLs, we decided to disable Drupal redirects to sf.gov before crawling again. See [the other section](#disabling-drupal-redirects) for more info.
      
      
### Drupal redirects

We need to do three things here:

1. [Download redirect rules](#download-redirect-rules)
2. [Disable sf.gov redirects](#disable-sfgov-redirects) before crawling
3. [Re-enable sf.gov redirects](#re-enable-sfgov-redirects) after crawling

We'll do these with Pantheon's [terminus] command line tool, which you can [install](https://pantheon.io/docs/terminus/install) on macOS with:

```sh
brew install pantheon-systems/external/terminus
```

SQL queries can be executed on the **live database** (:warning:) with:

```sh
terminus drush treasure-island.live sql:query "$query"
```

### Download redirect rules
We'll need to respect the existing redirect rules on `archive.sf.gov`. We can easily get these from the database with the SQL query:

```sql
SELECT rid, source, redirect, status
FROM redirect
WHERE redirect LIKE 'https://sf.gov%'
```

Run the query and save it to `redirects.tsv` as TSV (the default format) with:

```sh
terminus drush treasure-island.live sql:query "
    SELECT rid, source, redirect, status
    FROM redirect
    WHERE redirect LIKE 'https://sf.gov%'
" > redirects.tsv
```

### Disable sf.gov redirects
The goal here is to **temporarily disable** the redirects so that we can run a crawl that doesn't fan out to the new pages on sf.gov, and accurately captures the old pages (which are effectively inaccessible with the redirects in place). 

```sh
terminus drush treasure-island.live sql:query "
    UPDATE redirect
    SET status = 0
    WHERE redirect LIKE 'https://sf.gov%'
"
```

Then, we flush the cache with:

```sh
terminus drush treasure-island.live cr
```

Once this is done, you're clear to run the crawl with all relevant [???] seed URLs.

### Re-enable sf.gov redirects

Run this to re-enable the sf.gov redirects:

```sh
terminus drush treasure-island.live sql:query "
    UPDATE redirect
    SET status = 1
    WHERE
        redirect LIKE 'https://sf.gov%'
"
```

If there were any previously _disabled_ redirects in `redirects.tsv` (with `status = 0`), you can list their IDs (the `rid` db column) with:

```sh
cat redirect.tsv | egrep '0$' | cut -f1
```

Then paste those into the `RIDS` variable separated by commas:

```sh
# they must be comma-separated!
export RIDS="PASTE, IDS, HERE"
terminus drush treasure-island.live sql:query "
    UPDATE redirect
    SET status = 0
    WHERE rid IN($RIDS)
"
```

Then, clear the Drupal cache again:

```sh
terminus drush treasure-island.live cr
```

[collection]: https://archive-it.org/collections/18901
[url sheet]: https://docs.google.com/spreadsheets/d/17Sjac3PpryqqGJ2dAPOIO2EgAAoWygDohpQnndBU4J4/edit#gid=1347642292
[terminus]: https://pantheon.io/docs/terminus
