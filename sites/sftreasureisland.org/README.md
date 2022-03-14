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
      
      
### Disabling Drupal redirects

The goal here is to disable the redirects _temporarily_ so that we can run a crawl that doesn't fan out to the new pages on sf.gov, and accurately captures the old pages (which are effectively inaccessible with the redirects in place). To do this, you'll need:

- [ ] Access to the CCSF Pantheon admin
- [ ] The `mysql` command line tool (or some other app for managing MySQL/MariaDB)

When you've got those sorted:

1. Log into Pantheon and navigate to the [Treasure Island app](https://dashboard.pantheon.io/sites/09b62bfd-fa45-45a1-b9cd-79ebe754943a#live)'s "Live" tab and click the <kbd>Connection info</kbd> button in the top right:

    <img width="1171" alt="image" src="https://user-images.githubusercontent.com/113896/158275300-fa0963b0-83ce-4f69-91e5-5cc1554e4379.png">
    
2. Copy the `mysql ...` command and run it in your terminal, or copy the connection info to your MySQL admin app.
3. Run this SQL query to verify that there are sf.gov redirects:

    ```sql
    select * from redirect where redirect like 'https://sf.gov%';
    ```
    
4. Log in to [sftreasureisland.org/admin](https://sftreasureisland.org/admin) so that you can clear the cache after disabling the redirects
5. Take note of the already disabled sf.gov redirects, if any:

    ```sql
    select * from redirect where redirect like 'https://sf.gov%' and status != 1;
    ```
    
6. Run this SQL query to disabled the redirects:

    ```sql
    update redirect set status = 0 where redirect like 'https://sf.gov%';
    ```
    
    
7. Clear the Drupal cache by clicking <kbd>Flush all caches</kbd> link in the admin header:
    
    <img width="172" alt="image" src="https://user-images.githubusercontent.com/113896/158277960-1a65b1d5-6ee4-4d09-a24b-f29786131850.png">

8. Do the crawl with all relevant [???] seed URLs
9. Run this SQL query to re-enable the redirects:

    ```sql
    update redirect set status = 1 where redirect like 'https://sf.gov%';
    ```

10. Re-_disable_ any previously disabled redirects by putting their `rid` values in the `in(...)` call:

    ```sql
    update redirect set status = 0 where rid in(...);
    ```

11. Clear the Drupal cache again, as in step 7 above.


[collection]: https://archive-it.org/collections/18901
[url sheet]: https://docs.google.com/spreadsheets/d/17Sjac3PpryqqGJ2dAPOIO2EgAAoWygDohpQnndBU4J4/edit#gid=1347642292
