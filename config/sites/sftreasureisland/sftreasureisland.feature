@site
Feature: sftreasureisland.org
  Background: default hostname
    Given request header Host: ${TEST_SUBDOMAIN}sftreasureisland.org

  Scenario: /
    When I visit /
    Then I should be redirected to https://sf.gov/departments/city-administrator/treasure-island-development-authority

  Scenario: Archive URL
    When I visit /blah
    Then I should be redirected to https://wayback.archive-it.org/18901/3/https://sftreasureisland.org/blah

  @prod-only
  Scenario: www.sftreasureisland.org/
    Given request header Host: ${TEST_SUBDOMAIN}www.sftreasureisland.org
    When I visit /
    Then I should be redirected to https://sf.gov/departments/city-administrator/treasure-island-development-authority