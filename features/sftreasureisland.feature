@site
Feature: sftreasureisland.org
  Background: Host header
    Given request headers:
      | Host | ${TEST_SUBDOMAIN}sftreasureisland.org |
  Scenario: /
    When I visit /
    Then I should be redirected to https://sf.gov/departments/city-administrator/treasure-island-development-authority
