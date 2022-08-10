Feature: Server
  Scenario: Static files
    Given request header Host: ${TEST_SUBDOMAIN}archive.sf.gov
    When I visit /js/snapshot.js
    Then I should get status code 200
    And I should get header "Content-type" containing "application/javascript"

  Scenario: Explicit site redirect
    Given request header Host: ${TEST_SUBDOMAIN}sftreasureisland.org
    When I visit /
    Then I should be redirected to https://sf.gov/departments/city-administrator/treasure-island-development-authority

  Scenario: Site archive (internal 404)
    Given request header Host: ${TEST_SUBDOMAIN}sftreasureisland.org
    When I visit /blah
    Then I should be redirected to https://wayback.archive-it.org/18901/3/https://sftreasureisland.org/blah
    When I follow the redirect
    Then I should get header "Content-type" containing "text/html"
    And I should get status code 404

  Scenario: /_/ URL aliases
    Given request header Host: ${TEST_SUBDOMAIN}archive.sf.gov
    When I visit /_/sftreasureisland.org
    Then I should be redirected to https://sf.gov/departments/city-administrator/treasure-island-development-authority
    When I visit /_/sftreasureisland.org/
    Then I should be redirected to https://sf.gov/departments/city-administrator/treasure-island-development-authority
    When I visit /_/sftreasureisland.org/blah
    Then I should be redirected to https://wayback.archive-it.org/18901/3/https://sftreasureisland.org/blah
