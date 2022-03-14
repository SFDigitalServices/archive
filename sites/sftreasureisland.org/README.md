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



[collection]: https://archive-it.org/collections/18901
[url sheet]: https://docs.google.com/spreadsheets/d/17Sjac3PpryqqGJ2dAPOIO2EgAAoWygDohpQnndBU4J4/edit#gid=1347642292
