@site
Feature: sftreasureisland.org
  Background: Host header
    Given request headers:
      | Host | ${TEST_SUBDOMAIN}innovation.sfgov.org |

  Scenario: /
    When I visit /
    Then I should be redirected to https://wayback.archive-it.org/org-571/3/https://www.innovation.sfgov.org/

  Scenario: some other URL
    When I visit /some-other-url
    Then I should be redirected to https://wayback.archive-it.org/org-571/3/https://www.innovation.sfgov.org/some-other-url
