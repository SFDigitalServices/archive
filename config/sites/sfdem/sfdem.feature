@site
Feature: sfdem.org
  Background: default hostname
    Given request header Host: ${TEST_SUBDOMAIN}sfdem.org

  Scenario: /
    When I visit /
    Then I should be redirected to "https://sf.gov/departments/department-emergency-management"

  Scenario: Archive URL
    When I visit /blah
    Then I should be redirected to https://wayback.archive-it.org/20222/3/https://sfdem.org/blah
