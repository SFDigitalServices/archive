@site
Feature: sfosb.org
  Background: default hostname
    Given request header Host: ${TEST_SUBDOMAIN}sfosb.org

  Scenario: /
    When I visit /
    Then I should be redirected to "https://sf.gov/departments/office-economic-and-workforce-development/office-small-business"

  Scenario: Archive URL
    When I visit /blah
    Then I should be redirected to https://wayback.archive-it.org/19772/3/https://sfosb.org/blah
