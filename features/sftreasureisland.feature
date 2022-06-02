@site
Feature: sftreasureisland.org
  Background: Host header
    Given request headers:
      | Host | ${TEST_SUBDOMAIN}sftreasureisland.org |

  Scenario: /
    When I visit /
    Then I should be redirected to https://sf.gov/departments/city-administrator/treasure-island-development-authority

  Scenario: /development/arts
    When I visit /development/arts
    Then I should be redirected to https://sf.gov/information/treasure-island-arts-master-plan

  Scenario: some other URL
    When I visit /some-other-url
    Then I should be redirected to https://wayback.archive-it.org/18901/3/https://sftreasureisland.org/some-other-url
